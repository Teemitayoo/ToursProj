const { promisify } = require('util'); //for promisify tokin validation
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const sendEmail = require('./../utils/email');
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });

    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //Chck if email and password exist
    if (!email || !password) {
      return next(
        new AppError(
          'Please provide  email and password',
          400
        )
      );
    }

    //check if user exists and password is correct
    const user = await User.findOne({ email }).select(
      '+password'
    );

    if (
      !user ||
      !(await user.correctPassword(
        password,
        user.password
      ))
    ) {
      return next(
        new AppError(
          'Incorrect email or password',
          401
        )
      );
    }

    //console.log(user);
    //if everything is ok, send token to client

    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.protect = catchAsync(
  async (req, res, next) => {
    // get token and check if its exist
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    //console.log(token);
    if (!token) {
      return next(
        new AppError(
          'You are not logged in! Please login to get access',
          401
        )
      );
    }
    //validate token
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );

    // check if user still exists
    const currentUser = await User.findById(
      decoded.id
    );
    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to the token does no longer exist',
          401
        )
      );
    }

    //Check if user changed password/token after the Jwt was issued
    if (
      currentUser.changedPasswordAfter(decoded.iat)
    ) {
      return next(
        new AppError(
          'User recently changed password! Please log in again',
          401
        )
      );
    }
    //grant access to route
    req.user = currentUser;

    next();
  }
);

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          403
        )
      );
    }

    next();
  };
};
exports.forgotPassword = catchAsync(
  async (req, res, next) => {
    // get user based on posted email
    const user = await User.findOne({
      email: req.body.email,
    });
    if (!user) {
      return next(
        new AppError(
          'There is no user with the email address',
          404
        )
      );
    }
    //generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    //send it to user's mail
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    try {
      const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n If you didn't forget your password, please ignore this email `;
      await sendEmail({
        email: user.email,
        subject:
          'Your password request Token()valid for 10 minutes',
        message,
      });
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email',
      });
    } catch (err) {
      console.log(err);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          'There was an error sending the email. Try again later!'
        ),
        500
      );
    }
  }
);
exports.resetPassword = (req, res, next) => {};

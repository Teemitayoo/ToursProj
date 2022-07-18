const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(
    /(["'])(\\?.)*?\1/
  )[0];
  console.log(value);

  const message = `Duplicate field value:x Please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(
    (el) => el.message
  );
  const message = `Invalid input data. ${errors.join(
    '. '
  )}`;
  return new AppError(message, 400);
};
const handleJWTError = (err) =>
  //remember to remove err cause no need
  new AppError(
    'Invalid token. PLease login again',
    401
  );
const handleJWTExpiredError = (err) =>
  //remember to remove err cause no need
  new AppError(
    'Your token has expired! Please login again',
    401
  );

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //UNKNOWN ERROR
    console.error('ERROR', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // err = {};
    // let error = Object.assign({}, ...err);
    // console.log(`yunnohere${error}`);

    if (err.name === 'CastError')
      err = handleCastErrorDB(err);
    if (err.code === 11000)
      err = handleDuplicateFieldsDB(err);

    if (err.name === 'ValidationError')
      err = handleValidationErrorDB(err);

    if (err.name === 'JsonWebTokenError')
      err = handleJWTError(err); //remember to remove err cause no need
    if (err.name === 'TokenExpiredError')
      err = handleJWTExpiredError(err); //remember to remove err cause no need
    sendErrorProd(err, res);
  }
};

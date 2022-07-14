const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();
//MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  //only print params to console when we are in development
  app.use(morgan('dev'));
}
app.use(express.json()); //middleware for post http, creste natours

app.use(express.static(`${__dirname}/public`)); //To render static files like overview.html

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //middleware for knowing today's date and putting it in code
  next();
});

//ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
// TO HANDLE URLS NOT VALID
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  // const err = new Error(
  //   `Can't find ${req.originalUrl} on this server`
  // );
  // err.status = 'fail';
  // err.statusCode = 404;
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server`,
      404
    )
  );
});
//ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);
module.exports = app;

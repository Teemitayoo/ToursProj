const express = require('express');
const morgan = require('morgan');

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
  //create our own middleware
  console.log('Hello from the middleware');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //middleware for knowing today's date and putting it in code
  next();
});

//ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
//START SERVER

module.exports = app;

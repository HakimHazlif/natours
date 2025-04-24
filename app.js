const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// GLOBAL MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // the 3rd-party middleware
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  // allow 100 requests from the same IP in one hour
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter); // use limiter only if /api

app.use(express.json()); // middleware

app.use(express.static(`${__dirname}/public`)); // servering static files by middleware

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // add new property to req object
  next();
});

// ROUTES
app.use('/api/v1/tours', tourRouter); // specify a middleware for a route.. this process is called Mounting the router
app.use('/api/v1/users', userRouter);

// if user enter a wrong route. should put this middleware her after routes
app.all('*', (req, res, next) => {
  //.all means all HTTP methods

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// a global error handling midleware
app.use(globalErrorHandler);

module.exports = app;

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // set up templating engine

// GLOBAL MIDDLEWARES
// servering static files by middleware
app.use(express.static(path.join(__dirname, 'public')));

// set security HTTP headers
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // the 3rd-party middleware
}

// Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  // allow 100 requests from the same IP in one hour
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter); // use limiter only if /api

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // middleware prevents a body that lager than 10 kilo byte

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Pervent parameter pollution
// for ex: ?sort=duration&sort=price
app.use(
  hpp({
    // allow duplicate in some paramters
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // add new property to req object
  next();
});

// ROUTES
app.get('/', (req, res) => {
  // to render views/base.pug
  res.status(200).render('base', {
    tour: 'The Forest Hiker',
    user: 'Jonas',
  });
});
app.get('/overview', (req, res) => {
  res.status(200).render('overview', {
    title: 'All Tours',
  });
});
app.get('/tour', (req, res) => {
  res.status(200).render('tour', {
    title: 'The Forst Hiker Tour',
  });
});

app.use('/api/v1/tours', tourRouter); // specify a middleware for a route.. this process is called Mounting the router
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// if user enter a wrong route. should put this middleware her after routes
app.all('*', (req, res, next) => {
  //.all means all HTTP methods

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// a global error handling midleware
app.use(globalErrorHandler);

module.exports = app;

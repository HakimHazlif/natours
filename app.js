const path = require('path');
const express = require('express');
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const { webhookCheckout } = require('./controllers/bookingController');

const app = express();

app.set('trust proxy', 1);

const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // set up templating engine

// GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors()); // Access-Control-Allow-Origin *
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// servering static files by middleware
app.use(express.static(path.join(__dirname, 'public')));

// set security HTTP headers
// I passed this object into helmet config later because I needed to allow the Content Security Policy to accept the CDN script coming from https://cdnjs.cloudflare.com
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  const looger = pinoHttp({
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostanme',
      },
    },
  });

  app.use(looger);
}

// Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  // allow 100 requests from the same IP in one hour
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter); // use limiter only if /api

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout,
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // middleware prevents a body that lager than 10 kilo byte

app.use(express.urlencoded({ extended: true, limit: '10kb' })); // process the form data via requests into server | POST or PUT

// cookie parser, reading data from cookie into req.cookies
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return;

    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'string') {
        obj[key] = DOMPurify.sanitize(value);
      } else if (typeof value === 'object') {
        sanitize(value);
      }
    });
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
});

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

// compress all the text that sent to clients
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // add new property to req object

  next();
});

// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // specify a middleware for a route.. this process is called Mounting the router
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// if user enter a wrong route. should put this middleware her after routes
app.all('*', (req, res, next) => {
  //.all means all HTTP methods

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// a global error handling midleware
app.use(globalErrorHandler);

module.exports = app;

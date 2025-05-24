const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Helper function to generate CSP header based on environment
const getCSPHeader = () => {
  const baseCSP = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      'https://cdn.maptiler.com',
      'https://cdnjs.cloudflare.com',
    ],
    'connect-src': [
      "'self'",
      'https://cdn.maptiler.com',
      'https://api.maptiler.com',
      'https://cdnjs.cloudflare.com',
    ],
    'worker-src': ["'self'"],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://cdn.maptiler.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'https://cdn.maptiler.com',
      'https://api.maptiler.com',
    ],
    'font-src': ["'self'", 'https:', 'data:', 'https://fonts.gstatic.com'],
  };

  // In development, allow Parcel's hot reload
  if (process.env.NODE_ENV === 'development') {
    baseCSP['script-src'].push("'unsafe-eval'");
    baseCSP['connect-src'].push('ws://localhost:*', 'http://localhost:*');
    baseCSP['worker-src'].push('blob:');
  }

  // Convert to CSP string format
  return Object.entries(baseCSP)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get tour data from collection
  const tours = await Tour.find();

  // 2. Build template

  // 3. Render template using tour data from step 1.
  res
    .status(200)
    .set('Content-Security-Policy', getCSPHeader())
    .render('overview', {
      title: 'All Tours',
      tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  res
    .status(200)
    .set('Content-Security-Policy', getCSPHeader())
    .render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });
});

exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', getCSPHeader())
    .render('login', {
      title: 'log into your account',
    });
};

exports.getAccount = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', getCSPHeader())
    .render('account', {
      title: 'Your account',
    });
};

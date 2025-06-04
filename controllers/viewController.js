const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Helper function to generate CSP header based on environment
const getCSPHeader = () => "worker-src 'self' blob:";

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

  let booking = null;
  if (res.locals.user) {
    booking = await Booking.findOne({
      tour: tour._id,
      user: res.locals.user._id,
    });
  }
  let review = null;
  if (res.locals.user) {
    review = await Review.findOne({
      tour: tour._id,
      user: res.locals.user._id,
    });
  }

  res
    .status(200)
    .set('Content-Security-Policy', getCSPHeader())
    .render('tour', {
      title: `${tour.name} Tour`,
      tour,
      isBooked: !!booking,
      isReviewed: !!review,
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

exports.getSignupForm = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', getCSPHeader())
    .render('signup', {
      title: 'create your account',
    });
};

exports.checkConfirmEmail = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', getCSPHeader())
    .render('checkEmail', {
      title: 'Check your email box',
    });
};

exports.getConfirmedEmail = (req, res) => {
  if (res.status === 'fail')
    res
      .status(400)
      .set('Content-Security-Policy', getCSPHeader())
      .render('emailConfirmation', {
        title: 'Confirmation failed',
        message: res.message,
      });

  res
    .status(200)
    .set('Content-Security-Policy', getCSPHeader())
    .render('emailConfirmation', {
      title: 'Confirmation succeeded',
      user: res.user,
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

exports.getMyTours = catchAsync(async (req, res) => {
  // 1. find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2. Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);

  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  res
    .status(200)
    .set('Content-Security-Policy', getCSPHeader())
    .render('account', {
      title: 'Your account',
      user: updatedUser,
    });
});

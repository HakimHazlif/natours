const mongoose = require('mongoose');
const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
// const catchAsync = require('../utils/catchAsync');

exports.setTourUserIds = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.tourId)) {
    // check if id is 12-bit (Mongoose standards)
    return next(new AppError('Invalid ID format', 400));
  }
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.restrictReviewToBookedTour = catchAsync(async (req, res, next) => {
  const bookedTour = await Booking.findOne({
    tour: req.body.tour,
    user: req.body.user,
  });

  if (!bookedTour)
    return next(new AppError('You cannot review an unbooked tour', 403));

  next();
});

exports.getAllReviews = getAll(Review);
exports.getReview = getOne(Review);
exports.createReview = createOne(Review);
exports.updateReview = updateOne(Review);
exports.deleteReview = deleteOne(Review);

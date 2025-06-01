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

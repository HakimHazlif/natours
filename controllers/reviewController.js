const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});

// exports.createReview = catchAsync(async (req, res, next) => {
//   const newReview = await Review.create({
//     review: req.body.review,
//     rating: req.body.rating,
//     user: req.user.id,
//     tour: req.params.tourId,
//   });

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview,
//     },
//   });
// });

// exports.getAllUserReviews = catchAsync(async (req, res, text) => {
//   const reviews = await Review.findById(req.user.id);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });

//   text();
// });

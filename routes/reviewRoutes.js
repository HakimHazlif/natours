const express = require('express');
const {
  getAllReviews,
  createReview,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // to merge routes of this router with tour router

// POST /tours/:tourId/reviews
// Get /tours/reviews

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), createReview);

module.exports = router;

// router.get('/', protect, getAllUserReviews);
// router.post('/:tourId', protect, createReview);

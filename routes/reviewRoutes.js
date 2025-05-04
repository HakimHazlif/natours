const express = require('express');
const {
  getAllReviews,
  createReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // to merge routes of this router with tour router

// POST: /tours/:tourId/reviews
// GET: /tours/:tourId/reviews

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), createReview);

router.route('/:id').delete(deleteReview);

module.exports = router;

const express = require('express');
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // to merge routes of this router with tour router

// POST: /tours/:tourId/reviews
// GET: /tours/:tourId/reviews

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), setTourUserIds, createReview);

router.route('/:id').delete(deleteReview).patch(updateReview);

module.exports = router;

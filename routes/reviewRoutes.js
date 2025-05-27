const express = require('express');
const {
  getAllReviews,
  getReview,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  restrictReviewToBookedTour,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');
const { validIdParam } = require('../controllers/handlerFactory');

const router = express.Router({ mergeParams: true }); // to merge routes of this router with tour router

// POST: /tours/:tourId/reviews
// GET: /tours/:tourId/reviews

router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(
    restrictTo('user'),
    setTourUserIds,
    restrictReviewToBookedTour,
    createReview,
  );

router
  .route('/:id')
  .get(validIdParam, getReview)
  .patch(restrictTo('user', 'admin'), validIdParam, updateReview)
  .delete(restrictTo('user', 'admin'), validIdParam, deleteReview);

module.exports = router;

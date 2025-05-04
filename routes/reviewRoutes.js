const express = require('express');
const {
  getAllReviews,
  getReview,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');
const { validIdParam } = require('../controllers/handlerFactory');

const router = express.Router({ mergeParams: true }); // to merge routes of this router with tour router

// POST: /tours/:tourId/reviews
// GET: /tours/:tourId/reviews

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(validIdParam, getReview)
  .patch(validIdParam, updateReview)
  .delete(validIdParam, deleteReview);

module.exports = router;

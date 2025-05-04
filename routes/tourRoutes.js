const express = require('express');
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('./../controllers/authController');
const reviewRouter = require('./reviewRoutes');
const { validIdParam } = require('../controllers/handlerFactory');

const router = express.Router();

router.route('/top-5-cheap').get(aliasTopTours, getAllTours); // aliasTopTours is middleware that create some hide query by this route

// route of statistic
router.route('/tour-stats').get(getTourStats);
// route of monthly plan
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(validIdParam, getTour)
  .patch(protect, restrictTo('admin', 'lead-guide'), validIdParam, updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), validIdParam, deleteTour);

// router
//   .route('/:tourId/reviews')
//   .post(protect, restrictTo('user'), createReview); // instead of this we use middleware below
router.use('/:tourId/reviews', reviewRouter); // merge routes

module.exports = router;

// router.param('id', checkID); // param middleware

// use root route here, because we used mounting router down.. it's like '/api/v1/tours'
// router.route('/').get(getAllTours).post(checkBody, createTour);
// to make an optional param add ? to it (example: /:x?)

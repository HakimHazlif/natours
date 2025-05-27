const express = require('express');
const {
  getCheckoutSession,
  createBooking,
  getBooking,
  updateBooking,
  getAllBookings,
  deleteBooking,
} = require('../controllers/bookingController');
const { protect, restrictTo } = require('../controllers/authController');
// const { validIdParam } = require('../controllers/handlerFactory');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/checkout-session/:tourID', getCheckoutSession);

router.use(restrictTo('admin', 'lead-guide'));

router.route('/').get(getAllBookings).post(createBooking);

// router.use(validIdParam);

router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

module.exports = router;

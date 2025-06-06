const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
  getSignupForm,
  getAccount,
  updateUserData,
  getMyTours,
  getConfirmedEmail,
  checkConfirmEmail,
} = require('../controllers/viewController');
const {
  isLoggedIn,
  protect,
  verifyEmailToken,
} = require('../controllers/authController');
// const { createBookingCheckout } = require('../controllers/bookingController');

const router = express.Router();

// router.get('/', createBookingCheckout, isLoggedIn, getOverview);
router.get('/', isLoggedIn, getOverview);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/login', isLoggedIn, getLoginForm);
router.get('/signup', getSignupForm);
router.get('/check-email', checkConfirmEmail);
router.get('/confirm-email/:token', verifyEmailToken, getConfirmedEmail);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);

router.post('/submit-user-data', protect, updateUserData);

module.exports = router;

const express = require('express');
const {
  getAllUsers,
  getUser,
  updateMe,
  deleteMe,
  deleteUser,
  updateUser,
  createUser,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('./../controllers/userController');
const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} = require('./../controllers/authController');
const { validIdParam } = require('../controllers/handlerFactory');
const bookingRouter = require('./bookingRoutes');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protect); // use protect middleware for all the middlewares that come after this line

router.patch('/updateMyPassword', updatePassword);

router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);

router
  .route('/:id')
  .get(validIdParam, getUser)
  .patch(validIdParam, updateUser)
  .delete(validIdParam, deleteUser);

router.use('/:userId/bookings', bookingRouter);

module.exports = router;

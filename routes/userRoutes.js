const express = require('express');
const {
  getAllUsers,
  getUser,
  updateMe,
} = require('./../controllers/userController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
} = require('./../controllers/authController');

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getUser);

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.patch('/updateMyPassword', protect, updatePassword);

router.patch('/updateMe', protect, updateMe);

// router.route('/').get(getAllUsers).post(createUser);
// router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;

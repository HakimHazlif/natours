const crypto = require('crypto');
const { promisify } = require('util');

const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${process.env.JWT_COOKIE_EXPIRES_IN}d`,
  });

const createSendToken = (user, statusCode, req, res, sendResponse = true) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
    ),
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // is HTTP secure or so-called HTTPS
  });

  user.password = undefined;

  if (sendResponse) {
    res.status(statusCode).json({
      status: 'success',
      accessToken,
      data: {
        user,
      },
    });
  }
};

exports.refreshAccessToken = async (req, res) => {
  const token = req.cookies.jwt;

  if (!token) return res.status(401).json({ message: 'Refresh token missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token does no longer exist.',
      });
    }

    const newAccessToken = signAccessToken(currentUser._id);

    res.status(200).json({
      status: 'success',
      accessToken: newAccessToken,
    });
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  // if we need to add a new administrator to our systme we can then simply just create a new user normally. and then go into MongoDB compass, and basically edit that role in there, to admin the user manually

  const token = signAccessToken(newUser._id);

  const confirmationLink = `${req.protocol}://${req.get('host')}/confirm-email/${token}`;

  await new Email(newUser, confirmationLink).sendConfirmSignup();

  res.status(200).json({
    status: 'success',
    message: 'Check your email to confirm your account.',
  });
});

exports.verifyEmailToken = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return next(new AppError('User not found.', 404));

    user.isVerified = true;
    await user.save({ validateBeforeSave: false });

    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(user, url).sendWelcome();

    createSendToken(user, 200, req, res, false);

    res.user = user;
    next();
  } catch (err) {
    res.status = 'fail';
    res.message = 'Invalid or expired token.';
    next();
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // check if user exist && password is correct
  const user = await User.findOne({ email }).select('+password'); // select password to output from model

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401)); // we not really specifying what is incorrect here, for not helping attacker to focus on one of them by feeding it with random data
  }

  // if everthing ok, send token to client
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 + 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) getting token and check of it's there

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  // 2) verification token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_REFRESH_SECRET,
  );
  // console.log(decoded); // you will get {id: user id, iat: timestamp of the creation date, exp: timestamp of the expiation date}

  // 3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist!',
        401,
      ),
    );
  }

  // 4) check if user changed password after the token was issued
  if (currentUser.changesPasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password! Please log in again', 401),
    );

  // grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1. verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_REFRESH_SECRET,
      );
      // console.log(decoded); // you will get {id: user id, iat: timestamp of the creation date, exp: timestamp of the expiation date}

      // 2. check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3. check if user changed password after the token was issued
      if (currentUser.changesPasswordAfter(decoded.iat)) return next();

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

// who allowed to does actions with database
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='role'

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(new AppError('There is no user with email address.', 404));

  // 2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'Success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user base on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If token has not expired, and there is user, set the new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. Update changePasswordAt property for the user

  // 4. Log the user in, sent JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user.id).select('+password'); // req.user.id from protect middleware
  // User.findByIdAndUpdate will NOT work as intended!

  // 2. Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('You current password is wrong!', 401));

  // 3. If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4. Log user in, send JWT
  createSendToken(user, 200, req, res);
});

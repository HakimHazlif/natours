const Stripe = require('stripe');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const {
  createOne,
  getOne,
  updateOne,
  deleteOne,
  getAll,
} = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  if (!req.params.startDate)
    return next(new AppError('Booking must has start date', 404));

  // 1. get the currently booked tour
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const tour = await Tour.findById(req.params.tourID);

  // 2. create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}&startDate=${req.params.startDate}`, // it's not secure at all, but we will redirect it after using params
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
  });

  // 3. create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // this is only Temprorary, because it's unsecure everyone cane ,ake bookings without paying
  const { tour, user, price, startDate } = req.query;

  if (!tour || !user || !price || !startDate) return next();

  const targetTour = await Tour.findById(tour);
  if (!targetTour) {
    return next(new AppError('Tour not found', 404));
  }

  const queryDate = new Date(startDate);

  const dateObj = targetTour.startDates.find((d) => {
    const dbDate = d.date.toISOString().split('T')[0];
    const queryDateStr = queryDate.toISOString().split('T')[0];
    return dbDate === queryDateStr;
  });

  if (!dateObj) {
    // return next();
    return next(new AppError('Start date not found', 404));
  }

  dateObj.participants += 1;
  if (dateObj.participants >= targetTour.maxGroupSize) dateObj.soldOut = true;

  await targetTour.save();

  await Booking.create({ tour, user, price, startDate });

  res.redirect(req.originalUrl.split('?')[0]); // remove all params (query strings) for not show up on browser
});

exports.createBooking = createOne(Booking);
exports.getBooking = getOne(Booking);
exports.getAllBookings = getAll(Booking);
exports.updateBooking = updateOne(Booking);
exports.deleteBooking = deleteOne(Booking);

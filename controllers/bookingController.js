const Stripe = require('stripe');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
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

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  if (!req.params.startDate)
    return next(new AppError('Booking must has start date', 404));

  // 1. get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);

  // 2. create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}&startDate=${req.params.startDate}`, // it's not secure at all, but we will redirect it after using params
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            start_date: req.params.startDate,
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

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // this is only Temprorary, because it's unsecure everyone cane ,ake bookings without paying
//   const { tour, user, price, startDate } = req.query;

//   if (!tour || !user || !price || !startDate) return next();

//   const targetTour = await Tour.findById(tour);
//   if (!targetTour) {
//     return next(new AppError('Tour not found', 404));
//   }

//   const queryDate = new Date(startDate);

//   const dateObj = targetTour.startDates.find((d) => {
//     const dbDate = d.date.toISOString().split('T')[0];
//     const queryDateStr = queryDate.toISOString().split('T')[0];
//     return dbDate === queryDateStr;
//   });

//   if (!dateObj) {
//     // return next();
//     return next(new AppError('Start date not found', 404));
//   }

//   dateObj.participants += 1;
//   if (dateObj.participants >= targetTour.maxGroupSize) dateObj.soldOut = true;

//   await targetTour.save();

//   await Booking.create({ tour, user, price, startDate });

//   res.redirect(req.originalUrl.split('?')[0]); // remove all params (query strings) for not show up on browser
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].price_data.unit_amount / 100;
  const startDate = session.line_items[0].price_data.product_data.start_date;

  const targetTour = await Tour.findById(tour);
  // if (!targetTour) {
  //   return next(new AppError('Tour not found', 404));
  // }

  const queryDate = new Date(startDate);

  const dateObj = targetTour.startDates.find((d) => {
    const dbDate = d.date.toISOString().split('T')[0];
    const queryDateStr = queryDate.toISOString().split('T')[0];
    return dbDate === queryDateStr;
  });

  // if (!dateObj) {
  //   // return next();
  //   return next(new AppError('Start date not found', 404));
  // }

  dateObj.participants += 1;
  if (dateObj.participants >= targetTour.maxGroupSize) dateObj.soldOut = true;

  await targetTour.save();

  await Booking.create({ tour, user, price, startDate });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.eventNames.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout-session-complete') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ recieved: true });
};

exports.createBooking = createOne(Booking);
exports.getBooking = getOne(Booking);
exports.getAllBookings = getAll(Booking);
exports.updateBooking = updateOne(Booking);
exports.deleteBooking = deleteOne(Booking);

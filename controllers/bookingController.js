const Stripe = require('stripe');
const dotenv = require('dotenv');
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

dotenv.config({ path: './config.env' });

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
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
            ],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      start_date: req.params.startDate,
    },
  });

  // 3. create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

const createBookingCheckout = async (session) => {
  try {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.amount_total / 100;
    const startDate = session.metadata.start_date;

    const targetTour = await Tour.findById(tour);

    const queryDate = new Date(startDate);

    const dateObj = targetTour.startDates.find((d) => {
      const dbDate = d.date.toISOString().split('T')[0];
      const queryDateStr = queryDate.toISOString().split('T')[0];
      return dbDate === queryDateStr;
    });

    dateObj.participants += 1;
    if (dateObj.participants >= targetTour.maxGroupSize) dateObj.soldOut = true;

    await targetTour.save();

    await Booking.create({ tour, user, price, startDate });
  } catch (error) {
    console.error('Error:', error);
  }
};

exports.webhookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    await createBookingCheckout(session);
  }

  res.status(200).json({ received: true });
};

exports.createBooking = createOne(Booking);
exports.getBooking = getOne(Booking);
exports.getAllBookings = getAll(Booking);
exports.updateBooking = updateOne(Booking);
exports.deleteBooking = deleteOne(Booking);

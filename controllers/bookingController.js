const Stripe = require('stripe');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. get the currently booked tour
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const tour = await Tour.findById(req.params.tourID);

  // 2. create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`, // it's not secure at all, but we will redirect it after using params
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
  const { tour, user, price } = req.query;

  if (!tour || !user || !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]); // remove all params (query strings) for not show up on browser
});

/* eslint-disable */

// import stripe as Stripe from 'stripe'
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId, bookingDate) => {
  const stripe = Stripe(
    'pk_test_51RSyLcH7UHaPkmrdaiQtYJdB2ozzOOXA5B6uhrXT9i8rt3wdt09wZtPij8sO4J1MiDGUXOqQFYlbi9c9rLqfEs8p00jst2nCYp',
  );

  try {
    // 1. Get checkout session from API
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}/${bookingDate}`,
    );

    // 2. Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err.message);
  }
};

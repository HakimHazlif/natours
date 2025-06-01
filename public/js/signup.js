/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alert';
import { trim } from 'validator';

export const signup = async (data) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Sign up successfully!');
      window.setTimeout(() => {
        location.assign('/check-email');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const startCountdownRedirect = (page, seconds) => {
  const timerEl = document.getElementById('countdown-number');

  const timer = window.setInterval(() => {
    seconds--;
    timerEl.textContent = `${seconds} seconds`;

    if (seconds === 0) {
      clearInterval(timer);
      location.assign(page);
    }
  }, 1000);
};

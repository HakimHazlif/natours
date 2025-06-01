/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alert';

export const addReview = async (data) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/reviews',
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Review has been added successfully!');
      window.setTimeout(() => {
        location.reload();
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { signup, startCountdownRedirect } from './signup';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { selectBookingDate } from './booking';
import { showAlert } from './alert';
// import { displayMap } from './mapbox';

// const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logoutForm = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const popupButton = document.getElementById('open-booking');
const bookBtn = document.getElementById('book-tour');
const confirmEmailSuccess = document.getElementById('redirect-countdown');

// this worked well but I didn't know how to protect my mapTiler token
// if (mapBox) {
//   const locations = JSON.parse(mapBox.dataset.locations);
//   displayMap(locations);
// }

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });

if (signupForm)
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    signup({ name, email, password, passwordConfirm });
  });

if (confirmEmailSuccess) startCountdownRedirect('/', 5);

if (logoutForm) logoutForm.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const form = new FormData();

    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (popupButton) {
  const bookingPopup = document.getElementById('popup-overlay');
  const popupContainer = document.querySelector('.popup-container');

  popupButton.addEventListener('click', () => {
    bookingPopup.classList.remove('hidden');
    bookingPopup.classList.add('popup-overlay');
  });

  bookingPopup.addEventListener('mousedown', (e) => {
    if (!popupContainer.contains(e.target)) {
      bookingPopup.classList.add('hidden');
      bookingPopup.classList.remove('popup-overlay');
    }
  });

  selectBookingDate();
}

if (bookBtn) {
  bookBtn.addEventListener('click', async (e) => {
    const { tourId, bookingDate } = e.target.dataset;

    if (!bookingDate)
      return showAlert('error', "You didn't select a start date");

    e.target.textContent = 'Processing...';
    await bookTour(tourId, bookingDate);
  });
}

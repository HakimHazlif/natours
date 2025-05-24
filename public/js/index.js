/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { updateData } from './updateSettings';
// import { displayMap } from './mapbox';

// const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutForm = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');

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

if (logoutForm) logoutForm.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    updateData(name, email);
  });

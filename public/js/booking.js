/* eslint-disable */

export function selectBookingDate() {
  const dateButtons = document.querySelectorAll('.date-button-js');
  const bookBtn = document.getElementById('book-tour');

  if (!bookBtn) return;

  dateButtons.forEach((date) => {
    date.addEventListener('click', (e) => {
      const { startDate } = e.target.dataset;

      if (startDate) {
        bookBtn.dataset.bookingDate = startDate;

        dateButtons.forEach((b) => b.classList.remove('selected-date'));
        date.classList.add('selected-date');
      }
    });
  });
}

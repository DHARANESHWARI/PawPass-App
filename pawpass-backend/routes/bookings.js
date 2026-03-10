const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { bookAppointment, getMyBookings } = require('../controllers/bookingController');

// URL: /api/bookings/
router.post('/', auth, bookAppointment);

// URL: /api/bookings/my
router.get('/my', auth, getMyBookings);

module.exports = router;
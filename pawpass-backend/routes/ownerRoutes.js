const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getAllBookings } = require('../controllers/ownerController');

// Ensure this path matches the Dashboard's request
router.get('/bookings', auth, getAllBookings);

module.exports = router;
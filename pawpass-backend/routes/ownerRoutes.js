const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getOwnerDashboard, updateBookingStatus } = require('../controllers/ownerController');

// GET /api/owner/dashboard?date=...
router.get('/dashboard', auth, getOwnerDashboard);

// PATCH /api/owner/bookings/:id/status
router.patch('/bookings/:id/status', auth, updateBookingStatus);

module.exports = router;
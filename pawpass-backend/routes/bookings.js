const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const auth = require('../middleware/authMiddleware');

// GET all bookings with Pet Details (Populate is key here)
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('pet', 'name species breed') 
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching bookings" });
  }
});

// POST a new booking
router.post('/', auth, async (req, res) => {
  try {
    const { petId, service, date, time } = req.body;
    const newBooking = new Booking({
      user: req.user.id,
      pet: petId,
      service,
      date,
      time
    });
    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ msg: "Booking failed" });
  }
});

module.exports = router;
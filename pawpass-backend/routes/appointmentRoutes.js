const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');

router.post('/', auth, async (req, res) => {
  try {
    const { petId, petName, serviceMain, serviceSub, date, time } = req.body;
    const newAppointment = new Appointment({
      user: req.user.id,
      petId, petName, serviceMain, serviceSub, date, time
    });
    await newAppointment.save();
    res.status(201).json(newAppointment);
  } catch (err) {
    res.status(500).json({ msg: 'Booking Failed' });
  }
});

module.exports = router;

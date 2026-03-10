const Booking = require('../models/Booking');

exports.bookAppointment = async (req, res) => {
    try {
        const { petId, service, date, time } = req.body;
        const newBooking = new Booking({
            user: req.user.id,
            pet: petId,
            service,
            date, 
            time,
            status: 'Pending' 
        });
        await newBooking.save();
        res.status(201).json({ success: true, booking: newBooking });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('pet')
            .sort({ createdAt: -1 });
        
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching bookings" });
    }
};
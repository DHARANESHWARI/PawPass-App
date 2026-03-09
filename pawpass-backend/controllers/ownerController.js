const Booking = require('../models/Booking');

// Ensure the function name is exactly 'getAllBookings'
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'name email')
            .populate('pet', 'name')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};
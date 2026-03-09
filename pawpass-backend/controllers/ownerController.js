const Booking = require('../models/Booking');

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'name email') 
            // By NOT specifying fields, we fetch ALL fields (breed, age, vaccinationStatus, etc.)
            .populate('pet') 
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (err) {
        console.error("Owner Fetch Error:", err.message);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(booking);
    } catch (err) {
        res.status(500).json({ msg: "Server Error" });
    }
};
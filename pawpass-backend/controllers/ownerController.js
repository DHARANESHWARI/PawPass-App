const Booking = require('../models/Booking');

exports.getOwnerDashboard = async (req, res) => {
    try {
        const now = new Date();
        const dateOptions = { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' };
        let formattedToday = now.toLocaleDateString('en-US', dateOptions).replace(/,/g, '');
        
        // Use date from query (selected in calendar) or default to today
        const searchDate = req.query.date || formattedToday;

        // 1. Fetch all bookings for that day
        const dayBookings = await Booking.find({ date: searchDate })
            .populate('user', 'name')
            .populate('pet')
            .sort({ time: 1 });

        // 2. Filter QUEUE: Only 'Pending' status AND ONLY for the selected date
        const queue = await Booking.find({ 
            status: 'Pending', 
            date: searchDate 
        })
        .populate('user', 'name')
        .populate('pet')
        .sort({ createdAt: 1 });

        const stats = {
            total: dayBookings.length,
            pending: queue.length,
            confirmed: dayBookings.filter(b => b.status === 'Confirmed').length,
            inProcess: dayBookings.filter(b => b.status === 'In-Process').length,
        };

        res.json({ 
            success: true, 
            selectedDate: searchDate, 
            stats, 
            bookings: dayBookings, 
            queue 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('pet user');
        res.json(updatedBooking);
    } catch (err) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
};
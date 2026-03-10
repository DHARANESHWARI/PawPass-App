const Booking = require('../models/Booking');

exports.getOwnerDashboard = async (req, res) => {
    try {
        const searchDate = req.query.date;
        const dayBookings = await Booking.find({ date: searchDate })
            .populate('user', 'name')
            .populate('pet')
            .sort({ time: 1 });

        const stats = {
            queue: dayBookings.filter(b => b.status === 'Pending').length,
            confirmed: dayBookings.filter(b => b.status === 'Confirmed').length,
            active: dayBookings.filter(b => ['Checked-In', 'In-Process'].includes(b.status)).length,
            completed: dayBookings.filter(b => b.status === 'Completed').length,
        };

        res.json({ success: true, stats, bookings: dayBookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                rejectionReason: reason || "" 
            },
            { returnDocument: 'after' } 
        ).populate('pet user');
        
        res.json({ success: true, booking: updatedBooking });
    } catch (err) {
        res.status(500).json({ success: false, message: "Status update failed" });
    }
};
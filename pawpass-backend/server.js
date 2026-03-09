require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// MIDDLEWARE (Must come before routes)
app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

// ROUTE REGISTRATION
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/pets', require('./routes/petRoutes')); 
app.use('/api/bookings', require('./routes/bookings')); 

// THIS IS THE MISSING LINK
// Ensure the file path './routes/ownerRoutes' actually exists
app.use('/api/owner', require('./routes/ownerRoutes')); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
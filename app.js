const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const statusRoutes = require('./routes/statusRoutes');
const feedBackRoutes = require('./routes/feedBackRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const refferalRoutes = require('./routes/refferalRoutes');
require('./utility/cronJobs');

const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());
// Routes
app.use('/fapi/users', userRoutes);
app.use('/fapi/status', statusRoutes); // Mount the routes
app.use('/fapi/feedback', feedBackRoutes);
app.use('/fapi/booking', bookingRoutes);
app.use('/fapi/refferal', refferalRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

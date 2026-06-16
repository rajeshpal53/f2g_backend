const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const monitor = require('./sdk');
monitor.init({
  appName:    'F2G',
  apiKey:     process.env.API_KEY,
  serviceUrl: process.env.SERVICE_URL,
  serverName: process.env.SERVER_NAME,
  environment: process.env.NODE_ENV,
});

const userRoutes = require('./routes/userRoutes');
const statusRoutes = require('./routes/statusRoutes');
const feedBackRoutes = require('./routes/feedBackRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const refferalRoutes = require('./routes/refferalRoutes');
const applyForLoanRoutes = require('./routes/applyForLoanRoutes');

require('./utility/cronJobs');

const cors = require('cors');

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
app.use('/fapi/applyforloan', applyForLoanRoutes);

app.use(monitor.expressErrorHandler);

// Final JSON error response handler
app.use((err, req, res, next) => {
  console.log("error is:-", err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP'
  });
});
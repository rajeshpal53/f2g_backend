const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const statusRoutes = require('./routes/statusRoutes');
const feedBackRoutes = require('./routes/feedBackRoutes');

const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());
// Routes
app.use('/api/users', userRoutes);
app.use('/api/status', statusRoutes); // Mount the routes
app.use('/api/feedback', feedBackRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

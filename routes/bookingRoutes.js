const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authenticateToken = require('../middleware/auth');
const checkAdminRole = require('../middleware/checkAdminRole');

router.use(authenticateToken);

router.post('/', bookingController.createBooking); // Create
router.put('/:id', bookingController.updateBooking); // Update
router.delete('/:id', bookingController.deleteBooking); // Delete
router.get('/', bookingController.getBooking); // get
router.get('/getBookingStats', bookingController.getBookingStats);
router.get('/downloadBookings', bookingController.downloadBookings);

module.exports = router;

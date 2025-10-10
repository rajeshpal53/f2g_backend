const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

router.post('/statuses', statusController.createStatus); // Create
router.get('/statuses', statusController.getAllStatuses); // Read All
router.get('/statuses/:id', statusController.getStatusById); // Read One
router.put('/statuses/:id', statusController.updateStatus); // Update
router.delete('/statuses/:id', statusController.deleteStatus); // Delete

module.exports = router;

const express = require('express');
const router = express.Router();
const refferalController = require('../controllers/refferalController');
const authenticateToken = require('../middleware/auth');
const checkAdminRole = require('../middleware/checkAdminRole');

router.use(authenticateToken);

router.post('/', refferalController.createRefferal); // Create
router.put('/:id', refferalController.updateRefferal); // Update
router.delete('/:id', refferalController.deleteRefferal); // Delete
router.get('/', refferalController.getRefferal); // get

module.exports = router;

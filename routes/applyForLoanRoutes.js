const express = require('express');
const applyForLoanController = require('../controllers/applyForLoanController');
const router = express.Router();

router.post('/', applyForLoanController.createApplyForLoan);
router.put('/:id', applyForLoanController.updateApplyForLoan);
router.get('/getAll', applyForLoanController.getAllApplyForLoan);
router.get('/:id', applyForLoanController.getApplyForLoanById);
router.delete('/:id', applyForLoanController.deleteApplyForLoan);

module.exports = router;


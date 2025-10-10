const express = require('express');
const feedBackController = require('../controllers/feedBackController');
const router = express.Router();
const { upload, compressAndSaveImage } = require('../middleware/multer');

router.post('/createFeedBack', upload.fields([{ name: 'screenShotUrl', maxCount: 1 }]), compressAndSaveImage, feedBackController.createFeedBack);
router.put('/updateFeedback/:id', upload.fields([{ name: 'screenShotUrl', maxCount: 1 }]), compressAndSaveImage, feedBackController.updateFeedback);
router.get('/getAllFeedBack', feedBackController.getAllFeedBack);
router.get('/getAllResolvedByPagination', feedBackController.getAllResolvedByPagination);
router.get('/getAllUnResolvedByPagination', feedBackController.getAllUnResolvedByPagination);
router.get('/getFeedBackById/:id', feedBackController.getFeedBackById);
router.delete('/deleteFeedback/:id', feedBackController.deleteFeedback);

module.exports = router;


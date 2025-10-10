const express = require('express');
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');
const router = express.Router();
const { upload, compressAndSaveImage } = require('../middleware/multer');

router.post('/signUp', userController.signUp);
router.post('/idTokenValidate', userController.idTokenValidate);
router.post('/loginUser', userController.loginUser);
router.get('/', userController.getAllUsers);
router.get('/getUserByMobile/:mobile', userController.getUserByMobile);

router.post('/upsertOnlyUserProfileImg', upload.fields([
    { name: 'profilePicurl', maxCount: 1 },
    { name: 'aadharCardFronturl', maxCount: 1 },
    { name: 'aadharCardBackurl', maxCount: 1 },]), compressAndSaveImage, userController.upsertOnlyUserProfileImg);

router.get('/searchUser', userController.searchUser);
router.post('/logout', userController.logout);
router.get('/:id', userController.getUserById);
router.delete('/:id', userController.deleteUser);

module.exports = router;

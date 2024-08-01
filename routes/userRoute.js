const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../public/images'));
    },
    filename: function(req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const fileFilter = (req, file, cb) => {
    (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') ? 
    cb(null, true) : cb(null, false);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

const userController = require('../controllers/userController');
const { isAuthorize } = require('../middleware/auth')

router.post('/register', upload.single('employee_picture'), userController.register);
router.post('/login', userController.login);
router.get('/get-user', isAuthorize, userController.getUser)
router.post('/forget-password', userController.forgetPassword)
router.post('/update-profile', upload.single('employee_picture'), isAuthorize, userController.updateProfile)

module.exports = router;

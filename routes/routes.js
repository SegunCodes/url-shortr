const express = require("express")
const router = express.Router()
const authController = require('../controller/authController')
const urlController = require('../controller/urlController')

router.get('/', authController.homepage);
router.get('/404', authController.errorPage);
router.get('/register', authController.registerPage);
router.get('/login', authController.loginPage);
router.post('/register', authController.processRegistration);
router.get('/verify/:verificationToken', authController.verifyEmail);
router.post('/login', authController.processLogin);
router.get('/forgot-password', authController.forgotPasswordPage);
router.post('/forgot-password', authController.sendRecoveryLink);
router.get('/reset/:email/:resetToken', authController.resetPasswordPage);
router.post('/reset', authController.resetPassword);
router.get('/dashboard', authController.dashboard);
router.get('/logout', authController.logout);

router.post('/dashboard', urlController.shortenUrl);

router.get('/:slug', authController.slugPage);
module.exports = router
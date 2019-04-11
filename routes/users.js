const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const validateUser = require('../middlewares/validateUser');

router.post('/login', userController.authenticate);
router.post('/addToCart', validateUser, userController.addToCart);
router.post('/proceedWithPayment', validateUser, userController.proceedWithPayment);
router.get('/success', userController.purchaseSuccess);

module.exports = router;

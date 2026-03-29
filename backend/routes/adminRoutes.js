const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/destination', adminController.addDestination);
router.post('/hotel', adminController.addHotel);
router.post('/activity', adminController.addActivity);
router.post('/transport', adminController.addTransport);

module.exports = router;

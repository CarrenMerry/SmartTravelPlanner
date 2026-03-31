const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

router.get('/destinations', tripController.getDestinations);
router.get('/validate-destination', tripController.validateDestination);
router.post('/generate-trip', tripController.generateTrip);

module.exports = router;

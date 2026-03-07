const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const petController = require('../controllers/petController');

router.get('/', auth, petController.getPets);
router.post('/', auth, petController.addPet);
router.put('/:id', auth, petController.updatePet);
router.delete('/:id', auth, petController.deletePet); // Added delete route

module.exports = router;
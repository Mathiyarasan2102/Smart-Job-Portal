const express = require('express');
const savedJobController = require('../controllers/savedJobController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/toggle', savedJobController.toggleSaveJob);
router.get('/', savedJobController.getSavedJobs);

module.exports = router;

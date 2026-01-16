const express = require('express');
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (anyone can view jobs, but auth helps with "applied" status)
router.get('/', authMiddleware.optionalProtect, jobController.getAllJobs);
router.get('/:id', authMiddleware.optionalProtect, jobController.getJob);

// Protected routes
router.use(authMiddleware.protect);

// Recruiter only
router.post('/', authMiddleware.restrictTo('recruiter'), jobController.createJob);


module.exports = router;

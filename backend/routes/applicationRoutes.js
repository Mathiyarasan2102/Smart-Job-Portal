const express = require('express');
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

// Apply (Candidate)
router.post('/apply/:jobId', authMiddleware.restrictTo('candidate'), applicationController.uploadResume, applicationController.applyToJob);

// View Applications for a Job (Recruiter)
router.get('/job/:jobId', authMiddleware.restrictTo('recruiter'), applicationController.getJobApplications);

// Update Status (Recruiter)
router.patch('/:applicationId/status', authMiddleware.restrictTo('recruiter'), applicationController.updateStatus);


// View My Applications (Candidate)
router.get('/my-applications', authMiddleware.restrictTo('candidate'), applicationController.getCandidateApplications);

// Recruiter Stats
router.get('/stats', authMiddleware.restrictTo('recruiter'), applicationController.getRecruiterStats);

module.exports = router;

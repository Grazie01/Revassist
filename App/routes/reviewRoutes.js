const express = require('express');
const { getReviewQuestions, createReviewRecord, getStudentReview } = require('../controllers/ReviewController');
const reviewRouter = express.Router();

reviewRouter.get('/get-review-record/:studentId', getStudentReview)
reviewRouter.get('/:lessonId/:studentId', getReviewQuestions);
reviewRouter.post('/set-review-record', createReviewRecord);

module.exports = reviewRouter;
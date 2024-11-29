const express = require('express');
const { getReviewQuestions, createStudentReview, setReviewAnswer, updateRecordedScore, getReview } = require('../controllers/ReviewController');
const reviewRouter = express.Router();

reviewRouter.get('/get-review/:reviewId/:studentId', getReview);
reviewRouter.get('/:lessonId/:studentId', getReviewQuestions);
reviewRouter.post('/create-review-record', createStudentReview);
reviewRouter.post('/set-review-answer', setReviewAnswer);
reviewRouter.post('/update-score', updateRecordedScore);

module.exports = reviewRouter;
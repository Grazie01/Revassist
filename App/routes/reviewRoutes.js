const express = require('express');
const path = require('path');
const { getReviewQuestions, createStudentReview, setReviewAnswer, updateRecordedScore, getReview, getReviewRecords, getReviewRecord } = require(path.resolve(__dirname,'../controllers/ReviewController'));
const reviewRouter = express.Router();

reviewRouter.get('/get-review/:reviewId/:studentId', getReview);
reviewRouter.get('/get-review-records/:studentId', getReviewRecords);
reviewRouter.get('/get-review-record/:studentReviewId', getReviewRecord);
reviewRouter.get('/:lessonId/:studentId', getReviewQuestions);
reviewRouter.post('/create-review-record', createStudentReview);
reviewRouter.post('/set-review-answer', setReviewAnswer);
reviewRouter.post('/update-score', updateRecordedScore);

module.exports = reviewRouter;
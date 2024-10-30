const express = require('express');
const { getAssessment, getAllAssessments, checkAnswer, getAllStudentAssessments, addStudentAssessment, getLatestStudentAssessmentId, resetCurrentScore, updateRecordedScore, getNextAvailableId } = require('../controllers/AssessmentController');

const assRouter = express.Router();

assRouter.get('/get-next-available-id', getNextAvailableId)
assRouter.get('/', getAllAssessments);
assRouter.get('/:topicId', getAssessment);
assRouter.post('/check-answer', checkAnswer);
assRouter.post('/add-assessment-record', addStudentAssessment);
assRouter.get('/get-student-assessments/:studentId', getAllStudentAssessments);
assRouter.get('/latest/:studentId/:moduleId', getLatestStudentAssessmentId);
assRouter.post('/reset-score', resetCurrentScore);
assRouter.post('/update-score', updateRecordedScore)

module.exports = assRouter;
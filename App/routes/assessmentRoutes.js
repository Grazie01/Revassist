const express = require('express');
const { getAssessment, getAllAssessments, getAllStudentAssessments, addStudentAssessment, getLatestStudentAssessmentId, updateRecordedScore, getNextAvailableId, setAssessmentAnswer, getAssessmentAnswers } = require('../controllers/AssessmentController');

const assRouter = express.Router();

assRouter.get('/get-next-available-id', getNextAvailableId);
assRouter.get('/', getAllAssessments);
assRouter.get('/:topicId/:studentId', getAssessment);
assRouter.get('/get-answers/:assessmentId', getAssessmentAnswers);
assRouter.post('/add-assessment-record', addStudentAssessment);
assRouter.post('/update-score', updateRecordedScore);
assRouter.get('/get-student-assessments/:studentId', getAllStudentAssessments);
assRouter.get('/latest/:studentId/:moduleId', getLatestStudentAssessmentId);
assRouter.post('/send-answer', setAssessmentAnswer);

module.exports = assRouter;
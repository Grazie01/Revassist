const express = require('express');
const path = require('path');
const {  getAllAssessments,
    getAssessment,
    addStudentAssessment,
    getAllStudentAssessments,
    updateRecordedScore,
    getNextAvailableId,
    getAssessmentAnswers,
    setAssessmentAnswer,
    getLatestStudentAssessmentAPI,
    getAssessmentRecord, } = require(path.resolve(__dirname,'../controllers/AssessmentController'));

const assRouter = express.Router();
assRouter.get('/get-next-available-id', getNextAvailableId);
assRouter.get('/get-answers/:assessmentId', getAssessmentAnswers);
assRouter.get('/get-assessment-records/:studentId', getAllStudentAssessments);
assRouter.get('/get-assessment-record/:assessmentId', getAssessmentRecord);
assRouter.post('/add-assessment-record', addStudentAssessment);
assRouter.post('/update-score', updateRecordedScore);
assRouter.get('/get-student-assessments/:studentId', getAllStudentAssessments);
assRouter.get('/latest/:studentId/:topicId', getLatestStudentAssessmentAPI);
assRouter.post('/send-answer', setAssessmentAnswer);
assRouter.get('/:topicId/:studentId', getAssessment);
assRouter.get('/', getAllAssessments);


module.exports = assRouter;
const express = require('express');
const path = require('path');
const {     
    setSimRecord,
    getStudentSimulations,
    setSimAnswer,
    getSimulationAnswers,
} = require(path.resolve(__dirname,'../controllers/SimulationsController'));
const simRouter = express.Router();

simRouter.get('/get-simulation-records/:studentId', getStudentSimulations)
simRouter.get('/get-simulation-answers/:recordId', getSimulationAnswers)
simRouter.post('/set-sim-record', setSimRecord)
simRouter.post('/set-sim-answer', setSimAnswer)

module.exports = simRouter;
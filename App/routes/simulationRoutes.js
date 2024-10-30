const express = require('express');
const { getSimulations, getScenarioQuestions, setSimRecord, getStudentSimulation, getLatestId, getSpecificSimRecord, getCorrectDialogue, getEndingDialogue, updateSimRecord } = require('../controllers/SimulationsController');
const simRouter = express.Router();

simRouter.get('/get-latest-id/:studentId/:simulationId', getLatestId)
simRouter.get('/get-simulation-record/:studentId/:simulationrecordId', getSpecificSimRecord)
simRouter.get('/get-simulation-records/:studentId', getStudentSimulation)
simRouter.get('/get-correct-dialogue/:simulationDialogueId', getCorrectDialogue)
simRouter.get('/get-ending-dialogue/:scenario_key', getEndingDialogue)
simRouter.get('/:simulationId', getScenarioQuestions);
simRouter.put('/set-sim-record', setSimRecord)
simRouter.post('/update-record', updateSimRecord)
simRouter.get('/', getSimulations);

module.exports = simRouter;
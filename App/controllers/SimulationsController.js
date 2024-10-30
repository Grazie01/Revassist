const { Correctdialoguereplies } = require("../models/correctdialoguereplies");
const { Endingdialogue } = require("../models/endingdialogue");
const { Simulation } = require("../models/Simulation");
const { SimulationDialogue } = require("../models/Simulation_Dialogues");
const { Student } = require("../models/Student");
const { StudentSimulation } = require("../models/Student_Simulation");


async function getSimulations(req, res) { 
    try {
        const simulations = await Simulation.findAll({
            include: [
                {
                    model: SimulationDialogue, 
                    as: 'simulations_dialogues',
                },
            ],
        });

        if (!simulations) {
            return res.status(404).json({ error: 'simulations not found' });
        }

        res.json({ simulations });
    } catch (error) {
        res.status(500).json({ 
            error: 'Getting simulations failed', 
            details: error.message 
        });
    }
}

async function getScenarioQuestions(req, res) { 
    const { simulationId } = req.params;
    try {
        const simulation = await SimulationDialogue.findAll({
            where: {
                simulation_key: simulationId
            }
        });

        if (!simulation) {
            return res.status(404).json({ error: 'simulation scenario not found' });
        }

        res.json({ simulation });
    } catch (error) {
        res.status(500).json({ 
            error: 'Getting simulation scenario failed', 
            details: error.message 
        });
    }
}

async function setSimRecord(req, res) {
    const { simulationId, studentId } = req.body;

    try {
        if (!simulationId || !studentId) {
            return res.status(400).json({ error: 'Simulation ID and Student ID are required.' });
        }

        const simulationExists = await Simulation.findByPk(simulationId);
        const studentExists = await Student.findByPk(studentId);

        if (!simulationExists || !studentExists) {
            return res.status(404).json({ error: 'Simulation or Student not found.' });
        }

        const studentSimulation = await StudentSimulation.create({
            simulation_key: simulationId,
            student_key: studentId,
            score: 100,
        });

        res.status(201).json({
            message: 'Student simulation record created.',
            studentSimulation,
        });

    } catch (error) {
        console.error('Error creating student simulation record:', error);
        res.status(500).json({
            error: 'Setting simulation record failed',
            details: error.message,
        });
    }
}

async function updateSimRecord(req, res) {
    const { simulationId, studentId, score, simrecordId } = req.body;

    try {
        if (!simulationId || !studentId) {
            return res.status(400).json({ error: 'Simulation ID and Student ID are required.' });
        }

        const studentSimulation = await StudentSimulation.findOne({
            where: {
                simulation_key: simulationId,
                student_key: studentId,
                id: simrecordId
            },
        });

        if (!studentSimulation) {
            return res.status(404).json({ error: 'Student simulation record not found.' });
        }

        studentSimulation.score = score || studentSimulation.score;
        studentSimulation.submitted = 1;
        await studentSimulation.save(); 

        res.status(200).json({
            message: 'Student simulation record updated successfully.',
            studentSimulation,
        });
    } catch (error) {
        console.error('Error updating student simulation record:', error);
        res.status(500).json({
            error: 'Updating simulation record failed',
            details: error.message,
        });
    }
}


async function getStudentSimulation(req, res) {
    const { studentId } = req.params;

    try {
        const simulations = await StudentSimulation.findAll({
            where: { student_key: studentId, submitted: 1},
            include: [
                {
                    model: Simulation,
                    as: 'simulation',
                    attributes: ['id', 'title'],
                    include: [
                        {
                            model: SimulationDialogue,
                            as: 'simulations_dialogues',
                        },
                    ],
                },
            ],
        });

        if (simulations.length === 0) {
            return res.status(404).json({
                message: 'No simulation records found for this student.',
            });
        }

        const simulationsResults = [];

        for (const simulation of simulations) {
            const score = simulation.score || 0;
            const simulationKey = simulation.simulation_key || simulation.simulation.id;

            const totalDialogues = await SimulationDialogue.count({
                where: { simulation_key: simulationKey },
            });

            const averageScore = (totalDialogues > 0 ? score / totalDialogues : 0) * 100;
            const formattedAverageScore = Number(averageScore.toFixed(2));

            simulationsResults.push({
                ...simulation.toJSON(),
                averageScore: formattedAverageScore,
            });
        }

        res.status(200).json({
            message: 'Simulation records found',
            simulations: simulationsResults,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Fetching simulation records failed',
            details: error.message,
        });
    }
}

async function getLatestId(req, res) {
    const { studentId, simulationId } = req.params;

    try {
        // Find the latest unsubmitted simulation record
        let latestRecord = await StudentSimulation.findOne({
            where: {
                student_key: studentId,
                simulation_key: simulationId,
                submitted: 0,
            },
            order: [['createdAt', 'DESC']],
        });

        if (!latestRecord) {
            latestRecord = await StudentSimulation.create({
                student_key: studentId,
                simulation_key: simulationId,
                score: 100,
                submitted: 0,
            });

            console.log("New record created:", latestRecord);
        } else {
            console.log("Latest record found:", latestRecord);
        }

        res.status(200).json({
            latestSimulationId: latestRecord.id,
        });
    } catch (error) {
        console.error('Error retrieving or creating simulation record:', error);
        res.status(500).json({
            error: 'Failed to retrieve or create the latest simulation record',
            details: error.message,
        });
    }
}



async function getSpecificSimRecord(req, res){
    const { studentId, simulationrecordId } = req.params;

    try {
        const record = await StudentSimulation.findOne({
            where: {
                student_key: studentId,
                id: simulationrecordId,
            },
            order: [['createdAt', 'DESC']],
        });


        res.status(200).json({
            record: record,
        });
    } catch (error) {
        console.error('Error retrieving simulation record:', error);
        res.status(500).json({
            error: 'Failed to retrieve the simulation record',
            details: error.message,
        });
    }
}

async function getEndingDialogue(req, res){
    const { scenario_key } = req.params;
    console.log(scenario_key)

    try {
        const dialogue = await Endingdialogue.findOne({
            where: { scenario_key: scenario_key },
          });
          
        console.log(dialogue)

        res.status(200).json({
            dialogue: dialogue,
        });
    } catch (error) {
        console.error('Error retrieving dialogue:', error);
        res.status(500).json({
            error: 'Failed to retrieve the dialogue',
            details: error.message,
        });
    }
}

async function getCorrectDialogue(req, res){
    const { simulationDialogueId } = req.params;

    try {
        const dialogue = await Correctdialoguereplies.findOne({
            where: {
                simulation_dialogues_key: simulationDialogueId,
            },
            order: [['createdAt', 'DESC']],
        });


        res.status(200).json({
            dialogue: dialogue,
        });
    } catch (error) {
        console.error('Error retrieving dialogue:', error);
        res.status(500).json({
            error: 'Failed to retrieve the dialogue',
            details: error.message,
        });
    }
}


module.exports = { 
    getSimulations,
    getScenarioQuestions,
    setSimRecord,
    getStudentSimulation,
    getLatestId,
    getSpecificSimRecord,
    updateSimRecord,
    getCorrectDialogue,
    getEndingDialogue
};
const { SimulationAnswers } = require(path.resolve(__dirname,"../models/SimulationAnswers"));
const { Student } = require(path.resolve(__dirname,"../models/Student"));
const { StudentSimulation } = require(path.resolve(__dirname,"../models/Student_Simulation"));


async function setSimRecord(req, res) {
    const { studentId, score, title } = req.body;

    try {
        if (!studentId) {
            return res.status(400).json({ error: 'Student ID are required.' });
        }

        const studentExists = await Student.findByPk(studentId);

        if (!studentExists) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        const studentSimulation = await StudentSimulation.create({
            student_key: studentId,
            score: score,
            title: title
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

async function getStudentSimulations(req, res) {
    const { studentId } = req.params;
    try {
      const simulations = await StudentSimulation.findAll({
        where: {
          student_key: studentId,
        },
      });
  
      const groupedByTitle = simulations.reduce((acc, simulation) => {
        const title = simulation.title; 

        if (!acc[title]) {
          acc[title] = [];
        }

        acc[title].push(simulation);
  
        return acc;
      }, {});
  
      res.status(200).json(groupedByTitle);
    } catch (error) {
      res.status(500).json({
        error: "Getting simulation records failed",
        details: error.message,
      });
    }
  }
  


//========================= Answers ===========================//

async function setSimAnswer(req, res) {
    const { simulationKey, isCorrect, answer, question } = req.body;

    try {
        if (simulationKey === undefined || isCorrect === undefined || answer === undefined) {
            console.log(simulationKey, isCorrect, answer, question);
            return res.status(400).json({ error: 'simulationKey, isCorrect, and answer are required.' });
        }
        

        const simulation = await StudentSimulation.findByPk(simulationKey);

        if (!simulation) {
            return res.status(404).json({ error: 'Simulation record not found.' });
        }

        const studentAnswer = await SimulationAnswers.create({
            student_simulation_key: simulationKey,
            is_correct: isCorrect,
            answer: answer,
            question: question
        });

        res.status(201).json({
            message: 'Student simulation answer created.',
            studentAnswer,
        });

    } catch (error) {
        console.error('Error creating student simulation answer:', error);
        res.status(500).json({
            error: 'Setting simulation answer failed',
            details: error.message,
        });
    }
}

async function getSimulationAnswers(req, res) {
    const { recordId } = req.params;

    try {
        if (!recordId) {
            return res.status(400).json({ error: 'recordId is required.' });
        }

        const simulationRecord = await StudentSimulation.findOne({
            where: {
                id: recordId,
            },
            include: [
                {
                    model: SimulationAnswers,
                    as: 'simulation_answers', 
                },
            ],
        });

        if (!simulationRecord) {
            return res.status(404).json({ error: 'Simulation record not found.' });
        }
        
        const questionsAndAnswers = simulationRecord.simulation_answers.map((answer) => ({
            question: answer.question,
            answers: [{
                answer: answer.answer,
                isCorrect: answer.is_correct
            }]
        }));

        res.status(200).json({ questionsAndAnswers });
    } catch (error) {
        console.error('Error fetching student simulation record and answers:', error);
        res.status(500).json({
            error: 'Fetching simulation record and answers failed.',
            details: error.message,
        });
    }
}


module.exports = { 
    setSimRecord,
    setSimAnswer,
    getStudentSimulations,
    getSimulationAnswers
};
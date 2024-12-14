const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve(__dirname, './config/dbconfig'));
console.log('Resolved StudentSimulation Path:', path.resolve(__dirname, './App/models/Student_Simulation'));

const { DataTypes } = require('sequelize');
const sequelize = require(__dirname, './config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}
const { StudentSimulation } = require(path.resolve(__dirname, './App/models/Student_Simulation'));

const SimulationAnswers = sequelize.define('SimulationAnswers', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    student_simulation_key: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: StudentSimulation,
            key: 'id',
        },
    },
    question: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    is_correct: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, 
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
});

const createSimulationAnswersTable = async () => {
  try {
    await SimulationAnswers.sync();
    console.log("SimulationAnswers table created or already exists.");
  } catch (error) {
    console.error("Error creating SimulationAnswers table:", error);
  }
};

module.exports = {
    SimulationAnswers,
    createSimulationAnswersTable,
};

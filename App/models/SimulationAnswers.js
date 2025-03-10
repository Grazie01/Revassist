const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('../../config/dbconfig'));
console.log('Resolved StudentSimulation Path:', path.resolve(__dirname, './Student_Simulation'));

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}
const { StudentSimulation } = require(path.resolve(__dirname, './Student_Simulation'));

const SimulationAnswers = sequelize.define('simulationanswers', {
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

module.exports = {
    SimulationAnswers,
};

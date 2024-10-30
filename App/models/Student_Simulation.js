const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig');
const { Student } = require('./Student');
const { Simulation } = require('./Simulation');

const StudentSimulation = sequelize.define('StudentSimulation', {
  id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
  },
  score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
  },
  simulation_key: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
          model: Simulation,
          key: 'id',
      },
  },
  submitted: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  student_key: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
          model: Student,
          key: 'id',
      },
  }
});


const createStudentSimulationTable = async () => {
  try {
    await StudentSimulation.sync();
    console.log("StudentSimulation table created or already exists.");
  } catch (error) {
    console.error("Error creating StudentSimulation table:", error);
  }
};

module.exports = {
    StudentSimulation,
    createStudentSimulationTable,
};

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig');
const { Simulation } = require('./Simulation');

const SimulationDialogue = sequelize.define('SimulationDialogues', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  picture: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dialogue: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  correct_answer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  false_choice1: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  false_choice2: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  false_choice3: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  simulation_key: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: Simulation,
        key: 'id',
    },
  },
});

const createSimulationDialogueTable = async () => {
  try {
    await SimulationDialogue.sync();
    console.log("SimulationDialogue table created or already exists.");
  } catch (error) {
    console.error("Error creating SimulationDialogue table:", error);
  }
};

module.exports = {
    SimulationDialogue,
    createSimulationDialogueTable,
};

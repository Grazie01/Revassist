const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig');
const { SimulationDialogue } = require('./Simulation_Dialogues');

const Correctdialoguereplies = sequelize.define('Correctdialoguereplies', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    simulation_dialogues_key: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SimulationDialogue,
            key: 'id',
        },
    },
    picture_path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dialogue: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
});

const createCorrectdialoguerepliesTable = async () => {
  try {
    await Correctdialoguereplies.sync();
    console.log("Correctdialoguereplies table created or already exists.");
  } catch (error) {
    console.error("Error creating Correctdialoguereplies table:", error);
  }
};

module.exports = {
    Correctdialoguereplies,
    createCorrectdialoguerepliesTable,
};

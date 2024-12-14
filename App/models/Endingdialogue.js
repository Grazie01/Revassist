const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('../../config/dbconfig'));

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}

const { Simulation } = require('./Simulation');

const Endingdialogue = sequelize.define('Endingdialogue', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    scenario_key: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Simulation,
            key: 'id',
        },
    },
    ending_picture: {
      type: DataTypes.STRING,
      allowNull: false,
    },
}, {
    tableName: 'Endingdialogue',
});

const createEndingdialogueTable = async () => {
  try {
    await Endingdialogue.sync();
    console.log("Endingdialogue table created or already exists.");
  } catch (error) {
    console.error("Error creating Endingdialogue table:", error);
  }
};

module.exports = {
    Endingdialogue,
    createEndingdialogueTable,
};

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig');

const Simulation = sequelize.define('Simulations', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  place: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

const createSimulationsTable = async () => {
  try {
    await Simulation.sync();
    console.log("Simulations table created or already exists.");
  } catch (error) {
    console.error("Error creating Simulations table:", error);
  }
};

module.exports = {
    Simulation,
    createSimulationsTable,
};

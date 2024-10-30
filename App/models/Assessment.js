const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig');
const { Topic } = require('./Topic');

const Assessment = sequelize.define('Assessments', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    module_key: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Topic,
            key: 'id',
        },
    },
    test_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
});

const createAssessmentsTable = async () => {
  try {
    await Assessment.sync();
    console.log("Assessments table created or already exists.");
  } catch (error) {
    console.error("Error creating Assessments table:", error);
  }
};

module.exports = {
  Assessment,
  createAssessmentsTable,
};

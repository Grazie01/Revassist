const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig');
const { Assessment } = require('./Assessment');

const AssessmentQuestion = sequelize.define('AssessmentQuestions', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  query: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  answer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assessment_key: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: Assessment,
        key: 'id',
    },
  },
});

const createAssessmentQuestionsTable = async () => {
  try {
    await AssessmentQuestion.sync();
    console.log("AssessmentQuestions table created or already exists.");
  } catch (error) {
    console.error("Error creating AssessmentQuestions table:", error);
  }
};

module.exports = {
    AssessmentQuestion,
    createAssessmentQuestionsTable,
};

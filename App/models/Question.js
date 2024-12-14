const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('../../config/dbconfig'));
console.log('Resolved Assessment Path:', path.resolve('./Assessment'));

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}
const { Assessment } = require(path.resolve('../../App/models/Assessment'));

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

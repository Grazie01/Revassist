const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve(__dirname, './config/dbconfig'));
console.log('Resolved Question Path:', path.resolve(__dirname, './App/models/Question.js'));
console.log('Resolved StudentAssessment Path:', path.resolve(__dirname, './App/models/StudentAssessment.js'));

const { DataTypes } = require('sequelize');
const sequelize = require(__dirname, './config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}

const { AssessmentQuestion } = require(path.resolve(__dirname, './App/models/Question.js'));
const { StudentAssessment } = require(path.resolve(__dirname, './App/models/StudentAssessment.js'));

const AssessmentAnswers = sequelize.define('AssessmentAnswers', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    assessment_question_key: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: AssessmentQuestion, 
            key: 'id',
        },
    },
    assessment_id_key:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: StudentAssessment, 
            key: 'id',
        },
    },
    time_taken: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '00:00:00',
    },
    is_correct: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, 
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "answer"
    },
    confidence_level: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    }
});

const createAssessmentAnswersTable = async () => {
  try {
    await AssessmentAnswers.sync();
    console.log("AssessmentAnswers table created or already exists.");
  } catch (error) {
    console.error("Error creating AssessmentAnswers table:", error);
  }
};

module.exports = {
    AssessmentAnswers,
    createAssessmentAnswersTable,
};

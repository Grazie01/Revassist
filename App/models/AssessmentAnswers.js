const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('../../config/dbconfig'));
console.log('Resolved Question Path:', path.resolve(__dirname, './Question.js'));
console.log('Resolved StudentAssessment Path:', path.resolve(__dirname, './StudentAssessment.js'));

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}

const { AssessmentQuestion } = require(path.resolve(__dirname, './Question.js'));
const { StudentAssessment } = require(path.resolve(__dirname, './StudentAssessment.js'));

const AssessmentAnswers = sequelize.define('assessmentanswers', {
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


module.exports = {
    AssessmentAnswers,
};

const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('../../config/dbconfig'));
console.log('Resolved Flashcard_Questions Path:', path.resolve(__dirname, './Flashcard_Questions'));
console.log('Resolved StudentReview Path:', path.resolve(__dirname, './Student_Review'));

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}
const { ReviewQuestion } = require(path.resolve(__dirname,'./Flashcard_Questions'));
const { StudentReview } = require(path.resolve(__dirname,'./Student_Review'));

const ReviewAnswers = sequelize.define('reviewanswers', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    review_question_key: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ReviewQuestion,
            key: 'id',
        },
    },
    review_id_key:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: StudentReview, 
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
        defaultValue: "answer",
    },
    confidence_level: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    }
});

module.exports = {
    ReviewAnswers,
};

const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('../../config/dbconfig'));

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}
const { ReviewQuestion } = require('./Flashcard_Questions');
const { StudentReview } = require('./Student_Review');

const ReviewAnswers = sequelize.define('ReviewAnswers', {
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

const createReviewAnswersTable = async () => {
  try {
    await ReviewAnswers.sync();
    console.log("ReviewAnswers table created or already exists.");
  } catch (error) {
    console.error("Error creating ReviewAnswers table:", error);
  }
};

module.exports = {
    ReviewAnswers,
    createReviewAnswersTable,
};

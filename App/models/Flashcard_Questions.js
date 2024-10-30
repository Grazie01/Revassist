const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig');
const { Review } = require('./Flashcard_Review');

const ReviewQuestion = sequelize.define('ReviewQuestions', {
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
  flashcard_key: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: Review,
        key: 'id',
    },
  },
});

const createReviewQuestionsTable = async () => {
  try {
    await ReviewQuestion.sync();
    console.log("ReviewQuestions table created or already exists.");
  } catch (error) {
    console.error("Error creating ReviewQuestions table:", error);
  }
};

module.exports = {
    ReviewQuestion,
    createReviewQuestionsTable,
};

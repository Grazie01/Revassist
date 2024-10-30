const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig');
const { Lesson } = require('./Lesson');
const { ReviewQuestion } = require('./Flashcard_Questions');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  time: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 60,
  },
  lesson_key: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: Lesson,
        key: 'id',
    },
  },
});

const createReviewTable = async () => {
  try {
    await Review.sync();
    console.log("Review table created or already exists.");
  } catch (error) {
    console.error("Error creating Review table:", error);
  }
};

module.exports = {
    Review,
    createReviewTable,
};

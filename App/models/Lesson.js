const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig');
const { Topic } = require('./Topic');

const Lesson = sequelize.define('Lessons', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  videoID: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  topic_key: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: Topic,
        key: 'id',
    },
  },
});

const createLessonsTable = async () => {
  try {
    await Lesson.sync();
    console.log("Lessons table created or already exists.");
  } catch (error) {
    console.error("Error creating Lessons table:", error);
  }
};

module.exports = {
    Lesson,
    createLessonsTable,
};

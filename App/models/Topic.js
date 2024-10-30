const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig'); // Import sequelize instance
const { Lesson } = require('./Lesson');
const { Assessment } = require('./Assessment');

const Topic = sequelize.define('Topics', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

const createTopicTable = async () => {
  try {
    await Topic.sync();
    console.log("Topic table created or already exists.");
  } catch (error) {
    console.error("Error creating Topic table:", error);
  }
};

module.exports = {
  Topic,
  createTopicTable,
};

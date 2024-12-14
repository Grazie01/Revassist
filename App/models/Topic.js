const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('../../config/dbconfig'));

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}


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

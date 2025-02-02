const path = require('path');
console.log("path is: ", path)
console.log('Resolved dbconfig Path:', path.resolve('./config/dbconfig'));
console.log('Resolved Topic Model Path:', path.resolve(__dirname, './Topic.js'));

const { DataTypes } = require('sequelize');
const sequelize = require(path.resolve( './config/dbconfig')); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}

const { Topic } = require(path.resolve(__dirname, './Topic.js'));

const Lesson = sequelize.define('lessons', {  
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
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

module.exports = {
    Lesson,
};

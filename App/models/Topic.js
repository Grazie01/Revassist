const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('./config/dbconfig'));

const { DataTypes } = require('sequelize');
const sequelize = require(path.resolve('./config/dbconfig')); 

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

module.exports = {
  Topic,
};

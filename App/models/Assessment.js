const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('./config/dbconfig'));

const { DataTypes } = require('sequelize');
const sequelize = require(path.resolve('./config/dbconfig')); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}

const { Topic } = require(path.resolve(__dirname,  './Topic.js'));

const Assessment = sequelize.define('assessments', {
    id: {
      type: DataTypes.INTEGER,
      
      autoIncrement: true,
      primaryKey: true,
    },
    module_key: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Topic,
            key: 'id',
        },
    },
    test_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
});

module.exports = {
  Assessment
};

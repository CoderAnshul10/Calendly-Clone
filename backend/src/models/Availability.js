const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Availability = sequelize.define(
  'Availability',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 6 },
      comment: '0=Sun, 1=Mon, ... 6=Sat',
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'availability',
    timestamps: false,
    indexes: [{ fields: ['user_id', 'day_of_week'] }],
  }
);

module.exports = Availability;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DateOverride = sequelize.define(
  'DateOverride',
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
    override_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    is_unavailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'date_overrides',
    timestamps: false,
    indexes: [{ fields: ['user_id', 'override_date'] }],
  }
);

module.exports = DateOverride;

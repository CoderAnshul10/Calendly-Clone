const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EventType = sequelize.define(
  'EventType',
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
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(7),
      defaultValue: '#0069ff',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    buffer_before: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Buffer minutes before each booking',
    },
    buffer_after: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Buffer minutes after each booking',
    },
  },
  {
    tableName: 'event_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['user_id'] },
    ],
  }
);

module.exports = EventType;

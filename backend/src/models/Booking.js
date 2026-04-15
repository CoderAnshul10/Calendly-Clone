const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Booking = sequelize.define(
  'Booking',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    event_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'event_types', key: 'id' },
    },
    invitee_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    invitee_email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { isEmail: true },
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    timezone: {
      type: DataTypes.STRING(100),
      defaultValue: 'UTC',
    },
    status: {
      type: DataTypes.ENUM('confirmed', 'cancelled', 'rescheduled'),
      defaultValue: 'confirmed',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancel_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    buffer_before: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    buffer_after: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'bookings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['event_type_id'] },
      { fields: ['start_time', 'end_time'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = Booking;

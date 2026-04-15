const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BookingAnswer = sequelize.define(
  'BookingAnswer',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'bookings', key: 'id' },
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'booking_answers',
    timestamps: false,
    indexes: [{ fields: ['booking_id'] }],
  }
);

const EventTypeQuestion = sequelize.define(
  'EventTypeQuestion',
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
    question_text: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'event_type_questions',
    timestamps: false,
    indexes: [{ fields: ['event_type_id'] }],
  }
);

module.exports = { BookingAnswer, EventTypeQuestion };

const sequelize = require('../config/db');
const User = require('./User');
const EventType = require('./EventType');
const Availability = require('./Availability');
const DateOverride = require('./DateOverride');
const Booking = require('./Booking');
const { BookingAnswer, EventTypeQuestion } = require('./extras');

// User associations
User.hasMany(EventType, { foreignKey: 'user_id', as: 'eventTypes' });
User.hasMany(Availability, { foreignKey: 'user_id', as: 'availability' });
User.hasMany(DateOverride, { foreignKey: 'user_id', as: 'dateOverrides' });

EventType.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
EventType.hasMany(Booking, { foreignKey: 'event_type_id', as: 'bookings' });
EventType.hasMany(EventTypeQuestion, {
  foreignKey: 'event_type_id',
  as: 'questions',
});

Availability.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
DateOverride.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Booking.belongsTo(EventType, { foreignKey: 'event_type_id', as: 'eventType' });
Booking.hasMany(BookingAnswer, { foreignKey: 'booking_id', as: 'answers' });

BookingAnswer.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

EventTypeQuestion.belongsTo(EventType, {
  foreignKey: 'event_type_id',
  as: 'eventType',
});

module.exports = {
  sequelize,
  User,
  EventType,
  Availability,
  DateOverride,
  Booking,
  BookingAnswer,
  EventTypeQuestion,
};

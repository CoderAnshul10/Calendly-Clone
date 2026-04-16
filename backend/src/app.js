require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

const eventTypesRouter = require('./routes/eventTypes');
const availabilityRouter = require('./routes/availability');
const meetingsRouter = require('./routes/meetings');
const bookingsRouter = require('./routes/bookings');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Admin routes
app.use('/api/admin/event-types', eventTypesRouter);
app.use('/api/admin/availability', availabilityRouter);
app.use('/api/admin/meetings', meetingsRouter);

// Public routes
app.use('/api/public', bookingsRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');
    await sequelize.sync({ alter: false }); // Use migrations in production
    const { User } = require('./models');

    await User.findOrCreate({
      where: { id: 1 },
      defaults: {
      name: 'Admin',
      email: 'admin@example.com',
    },
});
    console.log('✅ Models synced.');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

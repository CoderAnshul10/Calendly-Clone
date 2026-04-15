const { Availability, DateOverride, sequelize } = require('../models');

const ADMIN_USER_ID = 1;

async function getAvailability(req, res, next) {
  try {
    const rows = await Availability.findAll({
      where: { user_id: ADMIN_USER_ID },
      order: [['day_of_week', 'ASC']],
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function updateAvailability(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const days = req.body; // Array of { day_of_week, start_time, end_time, is_active }

    // Upsert each day
    for (const day of days) {
      const existing = await Availability.findOne({
        where: { user_id: ADMIN_USER_ID, day_of_week: day.day_of_week },
        transaction: t,
      });
      if (existing) {
        await existing.update(
          { start_time: day.start_time, end_time: day.end_time, is_active: day.is_active },
          { transaction: t }
        );
      } else {
        await Availability.create(
          { user_id: ADMIN_USER_ID, ...day },
          { transaction: t }
        );
      }
    }

    await t.commit();
    const updated = await Availability.findAll({
      where: { user_id: ADMIN_USER_ID },
      order: [['day_of_week', 'ASC']],
    });
    res.json(updated);
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function getDateOverrides(req, res, next) {
  try {
    const overrides = await DateOverride.findAll({
      where: { user_id: ADMIN_USER_ID },
      order: [['override_date', 'ASC']],
    });
    res.json(overrides);
  } catch (err) {
    next(err);
  }
}

async function createDateOverride(req, res, next) {
  try {
    const { override_date, start_time, end_time, is_unavailable } = req.body;

    // Check if override already exists for this date
    const existing = await DateOverride.findOne({
      where: { user_id: ADMIN_USER_ID, override_date },
    });
    if (existing) {
      await existing.update({ start_time, end_time, is_unavailable });
      return res.json(existing);
    }

    const override = await DateOverride.create({
      user_id: ADMIN_USER_ID,
      override_date,
      start_time: is_unavailable ? null : start_time,
      end_time: is_unavailable ? null : end_time,
      is_unavailable: is_unavailable || false,
    });
    res.status(201).json(override);
  } catch (err) {
    next(err);
  }
}

async function deleteDateOverride(req, res, next) {
  try {
    const { id } = req.params;
    const override = await DateOverride.findOne({ where: { id, user_id: ADMIN_USER_ID } });
    if (!override) return res.status(404).json({ error: 'Override not found.' });
    await override.destroy();
    res.json({ message: 'Override deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAvailability, updateAvailability, getDateOverrides, createDateOverride, deleteDateOverride };

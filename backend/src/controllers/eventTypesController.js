const { EventType, EventTypeQuestion, User } = require('../models');
const { Op } = require('sequelize');

const ADMIN_USER_ID = 1;

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function buildUniqueSlug(baseSlug, excludeId = null) {
  const normalizedBaseSlug = slugify(baseSlug);
  let candidate = normalizedBaseSlug;
  let suffix = 2;

  while (true) {
    const existing = await EventType.findOne({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
    });

    if (!existing) return candidate;
    candidate = `${normalizedBaseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function getEventTypes(req, res, next) {
  try {
    const eventTypes = await EventType.findAll({
      where: { user_id: ADMIN_USER_ID },
      include: [{ model: EventTypeQuestion, as: 'questions', separate: true, order: [['sort_order', 'ASC']] }],
      order: [['created_at', 'ASC']],
    });
    res.json(eventTypes);
  } catch (err) {
    next(err);
  }
}

async function createEventType(req, res, next) {
  try {
    const { name, slug, duration_minutes, description, color, buffer_before, buffer_after } = req.body;

    const resolvedSlug = await buildUniqueSlug(slug || name);

    const eventType = await EventType.create({
      user_id: ADMIN_USER_ID,
      name,
      slug: resolvedSlug,
      duration_minutes,
      description,
      color: color || '#0069ff',
      buffer_before: buffer_before || 0,
      buffer_after: buffer_after || 0,
    });

    res.status(201).json(eventType);
  } catch (err) {
    next(err);
  }
}

async function updateEventType(req, res, next) {
  try {
    const { id } = req.params;
    const eventType = await EventType.findOne({ where: { id, user_id: ADMIN_USER_ID } });
    if (!eventType) return res.status(404).json({ error: 'Event type not found.' });

    const { name, slug, duration_minutes, description, color, is_active, buffer_before, buffer_after } = req.body;
    const nextSlug = slug ? slugify(slug) : eventType.slug;

    if (nextSlug && nextSlug !== eventType.slug) {
      const existing = await EventType.findOne({ where: { slug: nextSlug, id: { [Op.ne]: id } } });
      if (existing) return res.status(400).json({ error: 'Slug already in use.' });
    }

    await eventType.update({ name, slug: nextSlug, duration_minutes, description, color, is_active, buffer_before, buffer_after });
    const updated = await EventType.findByPk(id, {
      include: [{ model: EventTypeQuestion, as: 'questions', separate: true, order: [['sort_order', 'ASC']] }],
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteEventType(req, res, next) {
  try {
    const { id } = req.params;
    const eventType = await EventType.findOne({ where: { id, user_id: ADMIN_USER_ID } });
    if (!eventType) return res.status(404).json({ error: 'Event type not found.' });

    await eventType.destroy();
    res.json({ message: 'Event type deleted.' });
  } catch (err) {
    next(err);
  }
}

async function addQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const { question_text, is_required, sort_order } = req.body;

    const eventType = await EventType.findOne({ where: { id, user_id: ADMIN_USER_ID } });
    if (!eventType) return res.status(404).json({ error: 'Event type not found.' });

    const question = await EventTypeQuestion.create({
      event_type_id: id,
      question_text,
      is_required: is_required || false,
      sort_order: sort_order || 0,
    });
    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
}

async function deleteQuestion(req, res, next) {
  try {
    const { id, qid } = req.params;
    const question = await EventTypeQuestion.findOne({
      where: { id: qid, event_type_id: id },
    });
    if (!question) return res.status(404).json({ error: 'Question not found.' });
    await question.destroy();
    res.json({ message: 'Question deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getEventTypes, createEventType, updateEventType, deleteEventType, addQuestion, deleteQuestion };

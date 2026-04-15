const express = require('express');
const { param, body, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/bookingsController');

const router = express.Router();

// GET /api/public/booking/:id  — must come BEFORE /:slug to avoid collision
router.get('/booking/:id', [param('id').isInt()], validate, ctrl.getBooking);

router.put(
  '/booking/:id/cancel',
  [param('id').isInt(), body('reason').optional().isString()],
  validate,
  ctrl.cancelBooking
);

router.put(
  '/booking/:id/reschedule',
  [
    param('id').isInt(),
    body('new_start_time').isISO8601().withMessage('new_start_time must be a valid ISO datetime.'),
    body('timezone').optional().isString(),
  ],
  validate,
  ctrl.rescheduleBooking
);

// GET /api/public/:slug
router.get('/:slug', ctrl.getEventTypeBySlug);

// GET /api/public/:slug/slots
router.get(
  '/:slug/slots',
  [
    param('slug').notEmpty(),
    query('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD.'),
    query('timezone').optional().isString(),
  ],
  validate,
  ctrl.getSlots
);

// POST /api/public/:slug/book
router.post(
  '/:slug/book',
  [
    param('slug').notEmpty(),
    body('invitee_name').trim().notEmpty().withMessage('Name is required.'),
    body('invitee_email').isEmail().withMessage('A valid email is required.'),
    body('start_time').isISO8601().withMessage('start_time must be a valid ISO datetime.'),
    body('timezone').optional().isString(),
    body('notes').optional().isString(),
    body('answers').optional().isArray(),
  ],
  validate,
  ctrl.createBooking
);

module.exports = router;

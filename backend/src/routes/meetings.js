const express = require('express');
const { param, body } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/meetingsController');

const router = express.Router();

router.get('/', ctrl.getMeetings);

router.put(
  '/:id/cancel',
  [
    param('id').isInt(),
    body('reason').optional().isString(),
  ],
  validate,
  ctrl.cancelMeeting
);

router.put(
  '/:id/reschedule',
  [
    param('id').isInt(),
    body('new_start_time').isISO8601().withMessage('new_start_time must be a valid ISO 8601 datetime.'),
  ],
  validate,
  ctrl.rescheduleMeeting
);

module.exports = router;

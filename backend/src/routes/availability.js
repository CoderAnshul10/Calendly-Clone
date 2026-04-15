const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/availabilityController');

const router = express.Router();

router.get('/', ctrl.getAvailability);

router.put(
  '/',
  [
    body().isArray().withMessage('Body must be an array of availability objects.'),
    body('*.day_of_week').isInt({ min: 0, max: 6 }).withMessage('day_of_week must be 0-6.'),
    body('*.start_time').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('start_time must be HH:MM or HH:MM:SS.'),
    body('*.end_time').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('end_time must be HH:MM or HH:MM:SS.'),
    body('*.is_active').optional().isBoolean(),
  ],
  validate,
  ctrl.updateAvailability
);

router.get('/date-overrides', ctrl.getDateOverrides);

router.post(
  '/date-overrides',
  [
    body('override_date').isDate().withMessage('override_date must be YYYY-MM-DD.'),
    body('is_unavailable').optional().isBoolean(),
    body('start_time').optional().matches(/^\d{2}:\d{2}(:\d{2})?$/),
    body('end_time').optional().matches(/^\d{2}:\d{2}(:\d{2})?$/),
  ],
  validate,
  ctrl.createDateOverride
);

router.delete('/date-overrides/:id', [param('id').isInt()], validate, ctrl.deleteDateOverride);

module.exports = router;

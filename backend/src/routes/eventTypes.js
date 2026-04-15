const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/eventTypesController');

const router = express.Router();

router.get('/', ctrl.getEventTypes);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase letters, numbers, and hyphens only.'),
    body('duration_minutes').isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes.'),
    body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a valid hex code.'),
    body('buffer_before').optional().isInt({ min: 0 }),
    body('buffer_after').optional().isInt({ min: 0 }),
  ],
  validate,
  ctrl.createEventType
);

router.put(
  '/:id',
  [
    param('id').isInt(),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format.'),
    body('duration_minutes').optional().isInt({ min: 5 }),
    body('color').optional().matches(/^#[0-9a-fA-F]{6}$/),
    body('buffer_before').optional().isInt({ min: 0 }),
    body('buffer_after').optional().isInt({ min: 0 }),
  ],
  validate,
  ctrl.updateEventType
);

router.delete('/:id', [param('id').isInt()], validate, ctrl.deleteEventType);

// Questions (bonus)
router.post(
  '/:id/questions',
  [
    param('id').isInt(),
    body('question_text').trim().notEmpty().withMessage('Question text is required.'),
    body('is_required').optional().isBoolean(),
    body('sort_order').optional().isInt({ min: 0 }),
  ],
  validate,
  ctrl.addQuestion
);

router.delete('/:id/questions/:qid', [param('id').isInt(), param('qid').isInt()], validate, ctrl.deleteQuestion);

module.exports = router;

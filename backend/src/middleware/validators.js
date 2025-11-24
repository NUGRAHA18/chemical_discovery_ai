const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password min 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Name min 3 characters'),
  validate
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate
];

const discoveryValidation = [
  body('criteria')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Criteria min 10 characters'),
  validate
];

const favoriteValidation = [
  body('compoundData').isObject().withMessage('Compound data required'),
  body('tags').optional().isArray(),
  body('notes').optional().trim(),
  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  discoveryValidation,
  favoriteValidation
};
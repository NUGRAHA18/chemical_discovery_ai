const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

const registerValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password min 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Name min 3 characters"),
  validate,
];

const loginValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  validate,
];

const discoveryValidation = [
  body("inputMode")
    .optional()
    .isIn(["structured", "ai-prompt"])
    .withMessage('Input mode must be either "structured" or "ai-prompt"'),

  body("criteria")
    .if(body("inputMode").equals("ai-prompt"))
    .trim()
    .isLength({ min: 10 })
    .withMessage("Criteria must be at least 10 characters for AI prompt mode"),

  body("structuredData")
    .if(body("inputMode").equals("structured"))
    .isObject()
    .withMessage("Structured data must be an object"),

  body("structuredData.category")
    .optional()
    .isIn(["surfactant", "polymer", "solvent", "catalyst", "additive", "other"])
    .withMessage("Invalid category"),

  body("structuredData.boilingPoint.min")
    .optional()
    .isNumeric()
    .withMessage("Boiling point min must be a number"),

  body("structuredData.boilingPoint.max")
    .optional()
    .isNumeric()
    .withMessage("Boiling point max must be a number"),

  body("structuredData.viscosity.min")
    .optional()
    .isNumeric()
    .withMessage("Viscosity min must be a number"),

  body("structuredData.viscosity.max")
    .optional()
    .isNumeric()
    .withMessage("Viscosity max must be a number"),

  body("structuredData.thermalStability.min")
    .optional()
    .isNumeric()
    .withMessage("Thermal stability must be a number"),

  body("structuredData.additionalProperties")
    .optional()
    .isArray()
    .withMessage("Additional properties must be an array"),

  body("structuredData.notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),

  validate,
];

const favoriteValidation = [
  body("compoundData").isObject().withMessage("Compound data required"),
  body("tags").optional().isArray(),
  body("notes").optional().trim(),
  validate,
];

module.exports = {
  registerValidation,
  loginValidation,
  discoveryValidation,
  favoriteValidation,
};

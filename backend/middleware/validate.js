import { validationResult } from 'express-validator';

/**
 * Runs after express-validator's chain of check()/body() rules.
 * If validation failed, responds with 400 and a list of field errors.
 * Otherwise passes control to the controller.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
};

export default validate;

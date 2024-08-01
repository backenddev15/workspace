const { check } = require('express-validator')

exports.signUpValidation = [
    check('name_th', 'Name is required').not().isEmpty(),
    check('email', 'Please enter a valid mail').not().isEmail().normalizeEmail({ gmail_remove_dots:true }),
    check('password', 'Password is required').not().isLength({ min:6 }),
]
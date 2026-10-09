const { MulterError } = require('multer');
const { ValidationError } = require('../errorTypes.js');

module.exports = function(err, req, res, next) {
    console.error(err);
    if (err instanceof MulterError) {
        err = new ValidationError(err.field ? `${err.message}: ${err.field}` : err.message, { cause: err });
    }
    res.status(err.statusCode? err.statusCode : 500).json({ error: { message: err.expose ? err.message : 'An unexpected error occurred.' } });
    };

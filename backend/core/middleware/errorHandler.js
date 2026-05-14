module.exports = function(err, req, res, next) {
    console.error(err);
    res.status(err.statusCode? err.statusCode : 500).json({ error: { message: err.expose ? err.message : 'An unexpected error occurred.' } });
    };
const { ValidationError } = require('../../core/errorTypes.js');

function validateCollectionUpload (req) {
    const imageFile = req.files?.imageData?.[0];
    const audioFile = req.files?.audioData?.[0];

    if (!imageFile || !audioFile) {
        throw new ValidationError('Both imageData and audioData files are required');
    }

    return {
        imageData: imageFile.buffer,
        audioData: audioFile.buffer,
        location: req.body.location,
    };
}

module.exports = {
    validateCollectionUpload
};

const mongoose = require('mongoose');
const OperationalError = require('../functions/operational-error');

const updateDocument = Model => async (req, res, next) => {
    const { id } = req.params;
    const { unset, ...updates } = req.body;
    const updateOperation = { ...updates };

    try {
        if (unset) {
            updateOperation.$unset = {};
            unset.forEach(field => {
                updateOperation.$unset[field] = "";
            });
        }

        const options = { new: true, runValidators: true };

        const updatedDocument = await Model.findByIdAndUpdate(id, updateOperation, options);
        if (!updatedDocument) {
            return next(new OperationalError(`No document found with the id: ${id}`, 404));
        }

        res.json({
            success: true,
            message: `${Model.modelName} updated successfully`,
            data: updatedDocument
        });
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return next(new OperationalError(`Validation error while updating the document.`, 404));
        }
        next(error);
    }
};

module.exports = updateDocument;
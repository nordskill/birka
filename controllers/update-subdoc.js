const mongoose = require('mongoose');
const OperationalError = require('../functions/operational-error');

const updateSubDocument = (Model, subdocArrayPath) => async (req, res, next) => {
    const { docId, subdocId } = req.params;
    const { unset, ...updates } = req.body;

    let updateOperation = {};
    Object.keys(updates).forEach((key) => {
        updateOperation[`${subdocArrayPath}.$[elem].${key}`] = updates[key];
    });

    if (unset && Array.isArray(unset)) {
        unset.forEach((field) => {
            updateOperation[`${subdocArrayPath}.$[elem].${field}`] = "";
        });
    }

    const options = {
        new: true,
        runValidators: true,
        arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(subdocId) }],
    };

    try {
        const result = await Model.updateOne(
            { _id: docId, [`${subdocArrayPath}._id`]: new mongoose.Types.ObjectId(subdocId) },
            updateOperation,
            options
        );

        if (result.nModified === 0) {
            return next(new OperationalError(`No subdocument found with the id ${subdocId} in ${subdocArrayPath}`, 404));
        }

        const parentDocument = await Model.findById(docId);
        const updatedSubdoc = parentDocument[subdocArrayPath].id(subdocId);

        if (!updatedSubdoc) {
            return next(new OperationalError(`Updated subdocument not found`, 404));
        }

        res.json({
            success: true,
            message: `Subdocument updated successfully`,
            data: updatedSubdoc
        });

    } catch (error) {
        next(error);
    }
};

module.exports = updateSubDocument;

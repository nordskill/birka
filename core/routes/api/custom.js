const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const OperationalError = require('../../functions/operational-error');

// Create a new document
router.post('/:model', async (req, res, next) => {
    const modelName = req.params.model;
    const modelData = req.body;

    try {
        const Model = global.customModels[modelName].model;
        if (!Model) {
            return next(new OperationalError(`Model ${modelName} not found`, 404));
        }

        const newDoc = new Model(modelData);
        await newDoc.save();
        res.json({
            success: true,
            message: `${modelName} created successfully`,
            data: newDoc
        });
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new OperationalError(`Validation error while creating ${modelName}`, 400));
        }
        next(err);
    }
});

// Read a document by ID
router.get('/:model/:id', async (req, res, next) => {
    const { model, id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return next(new OperationalError(`Invalid ID ${id}`, 404));
    }

    try {
        const Model = global.customModels[model].model;
        if (!Model) {
            return next(new OperationalError(`Model ${model} not found`, 404));
        }

        const doc = await Model.findById(id);
        if (!doc) {
            return next(new OperationalError(`${model} not found with ID ${id}`, 404));
        }

        res.json(doc);
    } catch (err) {
        next(err);
    }
});

// Update a document by ID
router.patch('/:model/:id', async (req, res, next) => {
    const { model, id } = req.params;
    const { unset, ...updates } = req.body;
    const updateOperation = { ...updates };

    if (!mongoose.isValidObjectId(id)) {
        return next(new OperationalError(`Invalid ID ${id}`, 404));
    }

    try {
        const Model = global.customModels[model].model;
        if (!Model) {
            return next(new OperationalError(`Model ${model} not found`, 404));
        }

        if (unset) {
            updateOperation.$unset = {};
            unset.forEach(field => {
                updateOperation.$unset[field] = "";
            });
        }

        const updatedDoc = await Model.findByIdAndUpdate(id, updateOperation, { new: true, runValidators: true });

        if (!updatedDoc) {
            return next(new OperationalError(`${model} not found with ID ${id}`, 404));
        }

        res.json({
            success: true,
            message: `${model} updated successfully`,
            data: updatedDoc
        });
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new OperationalError(`Validation error while updating ${model}`, 400));
        }
        next(err);
    }
});

// Delete a document by ID
router.delete('/:model/:id', async (req, res, next) => {
    const { model, id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return next(new OperationalError(`Invalid ID ${id}`, 404));
    }

    try {
        const Model = global.customModels[model].model;
        if (!Model) {
            return next(new OperationalError(`Model ${model} not found`, 404));
        }

        const deletedDoc = await Model.findByIdAndDelete(id);
        if (!deletedDoc) {
            return next(new OperationalError(`${model} not found with ID ${id}`, 404));
        }

        res.json({
            success: true,
            message: `${model} deleted successfully`,
            data: deletedDoc
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

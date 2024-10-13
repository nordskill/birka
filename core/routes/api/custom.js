import express from 'express';
import mongoose from 'mongoose';

import OperationalError from '../../functions/operational-error.js';

const router = express.Router();

// Create a new document
router.post('/:model', async (req, res) => {
    const modelName = req.params.model;
    const modelData = req.body;

    const Model = global.customModels[modelName]?.model;
    if (!Model) {
        throw new OperationalError(`Model ${modelName} not found`, 404);
    }

    const newDoc = new Model(modelData);
    await newDoc.save();
    res.json({
        success: true,
        message: `${modelName} created successfully`,
        data: newDoc
    });
});

// Read a document by ID
router.get('/:model/:id', async (req, res) => {
    const { model, id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new OperationalError(`Invalid ID ${id}`, 404);
    }

    const Model = global.customModels[model]?.model;
    if (!Model) {
        throw new OperationalError(`Model ${model} not found`, 404);
    }

    const doc = await Model.findById(id);
    if (!doc) {
        throw new OperationalError(`${model} not found with ID ${id}`, 404);
    }

    res.json(doc);
});

// Update a document by ID
router.patch('/:model/:id', async (req, res) => {
    const { model, id } = req.params;
    const { unset, ...updates } = req.body;
    const updateOperation = { ...updates };

    if (!mongoose.isValidObjectId(id)) {
        throw new OperationalError(`Invalid ID ${id}`, 404);
    }

    const Model = global.customModels[model]?.model;
    if (!Model) {
        throw new OperationalError(`Model ${model} not found`, 404);
    }

    if (unset) {
        updateOperation.$unset = {};
        unset.forEach(field => {
            updateOperation.$unset[field] = "";
        });
    }

    const updatedDoc = await Model.findByIdAndUpdate(id, updateOperation, { new: true, runValidators: true });
    if (!updatedDoc) {
        throw new OperationalError(`${model} not found with ID ${id}`, 404);
    }

    res.json({
        success: true,
        message: `${model} updated successfully`,
        data: updatedDoc
    });
});

// Delete a document by ID
router.delete('/:model/:id', async (req, res) => {
    const { model, id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new OperationalError(`Invalid ID ${id}`, 404);
    }

    const Model = global.customModels[model]?.model;
    if (!Model) {
        throw new OperationalError(`Model ${model} not found`, 404);
    }

    const deletedDoc = await Model.findByIdAndDelete(id);
    if (!deletedDoc) {
        throw new OperationalError(`${model} not found with ID ${id}`, 404);
    }

    res.json({
        success: true,
        message: `${model} deleted successfully`,
        data: deletedDoc
    });
});

export default router;

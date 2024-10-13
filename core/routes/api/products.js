import express from 'express';
import mongoose from 'mongoose';

import Product from '../../models/product.js';
import OperationalError from '../../functions/operational-error.js';
import { addTags, removeTags } from '../../controllers/tag-controller.js';

const router = express.Router();

// get product by id
router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id)
            .populate([
                'attributes.image',
                'variants',
                'thumbnail',
                'categories',
                'tags',
                'cross_sells'
            ])
            .select('-__v')
            .lean();

        if (!product) {
            throw new OperationalError(`No product found with the id ${id}`, 404);
        }

        res.json({
            success: true,
            product
        });

    } catch (error) {
        next(error);
    }
});

// update product by id
router.patch('/:id', async (req, res, next) => {
    const { id } = req.params;
    const { unset, ...updates } = req.body;
    const updateOperation = { ...updates };

    try {

        if (unset) {
            updateOperation.$unset = {};
            unset.forEach(field => {
                updateOperation.$unset[field] = "";
            })
        }

        const options = { new: true, runValidators: true };

        const updatedDocument = await Product.findByIdAndUpdate(id,
            updateOperation,
            options
        );

        if (!updatedDocument) {
            throw new OperationalError(`No product found with the id ${id}`, 404);
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            updatedDocument
        })

    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return next(new OperationalError('Validation error while updating the product.', 400));
        }
        next(error);
    }
});

router.patch('/:id/tags', addTags(Product));
router.delete('/:id/tags', removeTags(Product));

export default router;

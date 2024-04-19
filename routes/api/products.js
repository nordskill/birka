const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../../models/product');
const OperationalError = require('../../functions/operational-error');

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
})

module.exports = router;

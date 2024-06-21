const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Member = require('../../models/member');
const OperationalError = require('../../functions/operational-error');

// Create a new member
router.post('/', async (req, res, next) => {
    
    const memberData = req.body;
    console.log(memberData);

    try {

        if (memberData.email) {
            // Check if email already exists in the database
            const existingMember = await Member.findOne({ email: memberData.email });
            if (existingMember) {
                return next(new OperationalError('Email already exists', 400));
            }
        }

        const newMember = new Member(memberData);
        await newMember.save();
        res.json({
            success: true,
            message: 'Member created successfully',
            data: newMember
        });
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new OperationalError('Validation error while creating member', 400));
        }
        next(err);
    }
});

// Read a member by ID
router.get('/:memberId', async (req, res, next) => {
    const { memberId } = req.params;

    // Check if memberId is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(memberId)) {
        return next(new OperationalError(`No member found with the id ${memberId}`, 404));
    }

    try {
        const member = await Member.findById(memberId);
        if (!member) {
            throw new OperationalError(`No member found with the id ${memberId}`, 404);
        }
        res.json(member);
    } catch (err) {
        next(err);
    }
});

// Update a member by ID
router.patch('/:memberId', async (req, res, next) => {
    const { memberId } = req.params;
    const { unset, ...updates } = req.body;
    const updateOperation = { ...updates };

    // Check if memberId is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(memberId)) {
        return next(new OperationalError(`No member found with the id ${memberId}`, 404));
    }

    try {
        if (unset) {
            updateOperation.$unset = {};
            unset.forEach(field => {
                updateOperation.$unset[field] = "";
            });
        }

        const updatedMember = await Member.findByIdAndUpdate(memberId,
            updateOperation,
            { new: true, runValidators: true }
        );

        if (!updatedMember) {
            throw new OperationalError(`No member found with the id ${memberId}`, 404);
        }

        res.json({
            success: true,
            message: 'Member updated successfully',
            data: updatedMember
        });
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new OperationalError('Validation error while updating member', 400));
        }
        next(err);
    }
});

// Delete a member by ID
router.delete('/:memberId', async (req, res, next) => {
    const { memberId } = req.params;

    // Check if memberId is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(memberId)) {
        return next(new OperationalError(`No member found with the id ${memberId}`, 404));
    }

    try {
        const deletedMember = await Member.findByIdAndDelete(memberId);

        if (!deletedMember) {
            throw new OperationalError(`No member found with the id ${memberId}`, 404);
        }

        res.json({
            success: true,
            message: 'Member deleted successfully',
            data: deletedMember
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;


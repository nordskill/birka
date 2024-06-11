const express = require('express');
const router = express.Router();
const Member = require('../../models/member');
const OperationalError = require('../../functions/operational-error');

router.get('/', async (req, res, next) => {
    try {
        const members = await Member.find().lean();
        res.json(members);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id).lean();
        if (!member) {
            return next(new OperationalError('Team member not found', 404));
        }
        res.json(member);
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req, res, next) => {
    const memberData = req.body;

    try {
        const member = new Member(memberData);
        await member.save();
        res.status(201).json({
            success: true,
            message: 'Team member created successfully',
            member
        });
    } catch (err) {
        next(err);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
        if (!member) {
            return next(new OperationalError('Member not found', 404));
        }
        res.json({
            success: true,
            message: 'Team member updated successfully',
            member
        });
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const member = await Member.findByIdAndDelete(req.params.id).lean();
        if (!member) {
            return next(new OperationalError('Member not found', 404));
        }
        res.json({
            success: true,
            message: 'Team member deleted successfully'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

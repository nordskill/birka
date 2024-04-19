const Tag = require('../models/tag');
const OperationalError = require('../functions/operational-error');
const slugify = require('../functions/slugify');

function addTags(Model) {
    return async (req, res, next) => {
        const { id } = req.params;
        const tagsToAdd = req.body; // Expecting the body to be an array of tags directly

        console.log('tagsToAdd', tagsToAdd);

        try {
            if (!Array.isArray(tagsToAdd) || tagsToAdd.length === 0) {
                throw new OperationalError('The request body must be an array of tags', 400);
            }

            // Ensure tags exist or create them if they don't
            const tagsToSet = await Promise.all(tagsToAdd.map(async tag => {
                const slug = slugify(tag);
                let tagDoc = await Tag.findOne({ slug }).exec();
                if (!tagDoc) {
                    tagDoc = new Tag({ name: tag, slug });
                    await tagDoc.save();
                }
                return tagDoc._id;
            }));

            const updatedDocument = await Model.findByIdAndUpdate(id, {
                $addToSet: { tags: { $each: tagsToSet } }
            }, { new: true }).populate('tags');

            if (!updatedDocument) {
                throw new OperationalError(`No document found with the id ${id}`, 404);
            }

            res.json({ success: true, message: 'Tags added successfully', data: updatedDocument });
        } catch (error) {
            next(error);
        }
    };
}

function removeTags(Model) {
    return async (req, res, next) => {
        const { id } = req.params;
        const slugsToRemove = req.body; // Assuming the body is an array of tag slugs (strings)

        try {
            if (!Array.isArray(slugsToRemove) || slugsToRemove.length === 0) {
                throw new OperationalError('No tags provided to remove', 400);
            }

            // Convert the slugs to ObjectIds
            const tagsToRemove = await Tag.find({ slug: { $in: slugsToRemove } }).select('_id').exec();
            const tagIdsToRemove = tagsToRemove.map(tag => tag._id);

            // Proceed to remove the tags by their ObjectIds
            const updatedDocument = await Model.findByIdAndUpdate(id, {
                $pull: { tags: { $in: tagIdsToRemove } }
            }, { new: true }).populate('tags');

            if (!updatedDocument) {
                throw new OperationalError(`No document found with the id ${id}`, 404);
            }

            res.json({ success: true, message: 'Tags removed successfully', data: updatedDocument });
        } catch (error) {
            next(error);
        }
    };
}


module.exports = { addTags, removeTags };

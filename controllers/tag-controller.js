const Tag = require('../models/tag');
const OperationalError = require('../functions/operational-error');
const slugify = require('../functions/slugify');

function addTags(Model) {
    return async (req, res, next) => {
        const { id } = req.params;
        const tagNamesToAdd = req.body;

        try {
            if (!Array.isArray(tagNamesToAdd) || tagNamesToAdd.length === 0) {
                throw new OperationalError('The request body must be an array of tag names', 400);
            }

            // Pair tag names with their slugs
            const tagsWithSlugs = tagNamesToAdd.map(tagName => {
                return { name: tagName.trim(), slug: slugify(tagName.trim()) };
            });

            // Determine which slugs already exist
            const slugs = tagsWithSlugs.map(tag => tag.slug);
            const existingTags = await Tag.find({ slug: { $in: slugs } });
            const existingSlugs = existingTags.map(tag => tag.slug);

            // Filter out tags that need to be created
            const newTagsData = tagsWithSlugs.filter(tag => !existingSlugs.includes(tag.slug));
            
            // Create non-existing tags
            const newTags = await Tag.insertMany(newTagsData, { ordered: false }).catch(err => {
                console.error('Error inserting new tags:', err);
                return [];
            });

            // Fetch all tags, including newly created ones
            const allRelevantTags = [...existingTags, ...newTags];

            // Update the document in the Model
            const modelUpdate = await Model.findByIdAndUpdate(id, {
                $addToSet: { tags: { $each: allRelevantTags.map(tag => tag._id) } }
            }, { new: true }).populate('tags');

            if (!modelUpdate) {
                throw new OperationalError(`No document found with the id ${id}`, 404);
            }

            res.json({ success: true, message: 'Tags added successfully', data: allRelevantTags });
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
            const tagsToRemove = await Tag.find({ slug: { $in: slugsToRemove } }).lean();
            const tagIdsToRemove = tagsToRemove.map(tag => tag._id);

            // Proceed to remove the tags by their ObjectIds
            const updatedDocument = await Model.findByIdAndUpdate(id, {
                $pull: { tags: { $in: tagIdsToRemove } }
            }, { new: true }).populate('tags');

            // get removed tag

            if (!updatedDocument) {
                throw new OperationalError(`No document found with the id ${id}`, 404);
            }

            res.json({ success: true, message: 'Tags removed successfully', data: tagsToRemove });
        } catch (error) {
            next(error);
        }
    };
}


module.exports = { addTags, removeTags };

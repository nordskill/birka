const models = require('../models');

/**
 * Loads data from a specified model with optional query parameters and options.
 * 
 * @param {string} modelName - The name of the model to load data from. 
 *                              Supported models: BlogPost, Category, File, Image, Video, Menu, Order, Page, 
 *                              Product, Settings, Tag, User, Status.
 * @param {Object} [query={}] - The query object to filter the documents. Default is an empty object.
 * @param {Object} [options={}] - The options to configure the query.
 * @param {Object} [options.sort] - The sort order for the documents.
 * @param {number} [options.limit] - The maximum number of documents to return.
 * @param {number} [options.skip] - The number of documents to skip.
 * @param {Object} [options.where] - Conditions to filter the documents.
 * @param {boolean} [options.count] - If true, returns the count of documents that match the query.
 * @param {boolean} [options.findOne] - If true, returns a single document that matches the query.
 * @param {Array} [options.and] - An array of conditions that must all be met.
 * @param {Array} [options.or] - An array of conditions where at least one must be met.
 * @returns {Promise<Object|Array>} - Returns a promise that resolves to the requested data.
 * 
 * @example
 * // Fetch a single Image document by ID
 * const image = await getData('Image',
 * { 
 *      _id: '60c72b2f9b1e8c2a6d8e4d3b'
 * },
 * {
 *      findOne: true
 * });
 * 
 * @example
 * // Fetch multiple BlogPost documents, sorted by date, limited to 10, excluding one with a specific ID
 * const blogPosts = await getData('BlogPost',
 * {
 *      _id: { $ne: '60c72b2f9b1e8c2a6d8e4d3b' }
 * },
 * {
 *      sort: { date: -1 },
 *      limit: 10
 * });
 * 
 * @example
 * // Fetch multiple Page documents, sorted by a field, limited to 5
 * const pages = await getData('Page', {},
 * {
 *      sort: { someField: 1 },
 *      limit: 5
 * });
 */
async function getData(modelName, query = {}, options = {}) {
    const {
        sort,
        limit,
        skip,
        where,
        count,
        and,
        or,
        distinct,
        tagName,
        populate
    } = options;

    const findOne = query._id ? true : options.findOne;

    try {
        let model = get_model(modelName);
        if (!model) return null;

        let queryBuilder = model.find(query);

        apply_query_options(queryBuilder, {
            where,
            and,
            or,
            distinct,
            sort,
            skip,
            limit
        });

        if (modelName === 'User') {
            queryBuilder = queryBuilder.select('-account_details.password');
        }

        handle_tag_filtering(queryBuilder, model, tagName);

        apply_populate(queryBuilder, populate);

        if (count) return await queryBuilder.countDocuments();
        if (findOne) return await queryBuilder.findOne().lean();

        return await queryBuilder.lean();
    } catch (error) {
        console.error(`Error loading data for model ${modelName}:`, error);
        return [];
    }
}

function get_model(modelName) {
    if (models[modelName]) {
        return models[modelName];
    } else if (global.customModels && global.customModels[modelName]) {
        return global.customModels[modelName].model;
    }
    return null;
}

function apply_query_options(queryBuilder, options) {
    const { where, and, or, distinct, sort, skip, limit } = options;

    if (where) queryBuilder.where(where);
    if (and) queryBuilder.and(and);
    if (or) queryBuilder.or(or);
    if (distinct) queryBuilder.distinct(distinct);
    if (sort) queryBuilder.sort(sort);
    if (skip) queryBuilder.skip(skip);
    if (limit) queryBuilder.limit(limit);
}

async function handle_tag_filtering(queryBuilder, model, tagName) {
    if (tagName && model.schema.paths.tags) {
        const tag = await models['Tag'].findOne({ name: tagName }, '_id');
        if (tag) {
            queryBuilder.where('tags', tag._id);
        }
    }
}

function apply_populate(queryBuilder, populate) {
    if (!populate) return;

    if (typeof populate === 'string') {
        queryBuilder.populate(populate);
    } else if (Array.isArray(populate)) {
        populate.forEach(popObj => {
            if (typeof popObj === 'string') {
                queryBuilder.populate(popObj);
            } else if (typeof popObj === 'object' && popObj.path) {
                queryBuilder.populate(popObj);
            }
        });
    } else if (typeof populate === 'object' && populate.path) {
        queryBuilder.populate(populate);
    }
}

module.exports = getData;
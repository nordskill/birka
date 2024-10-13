/**
 * Generates an SVG icon with specified options, utilizing a cache to prevent
 * duplicate work.
 *
 * @function
 * @param {Object} options - The options for generating the icon.
 * @param {string} options.name - The icon name, corresponding to a key in
 *                                the global.ico object.
 * @param {string} [options.class] - An optional class for the SVG element.
 * @param {string} [options.id] - An optional id for the SVG element.
 * @returns {string} - The SVG element as a string, with specified class and
 *                     id attributes if provided.
 *
 * @example
 * // Returns: '<svg class="icon" id="icon1">...</svg>' if global.ico['home'] = 
 * //          '<svg>...</svg>'
 * icon({ name: 'home', class: 'icon', id: 'icon1' });
 */

const iconCache = new Map();

function icon(options) {
    const { name, class: className, id } = options;
    const cacheKey = JSON.stringify(options);

    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey);
    }

    let svg = global.ico[name] || global.ico['no_icon'];

    const classAttr = className ? `class="${className}"` : '';
    const idAttr = id ? `id="${id}"` : '';

    svg = svg.replace('<svg', `<svg ${classAttr} ${idAttr}`);

    iconCache.set(cacheKey, svg);
    return svg;
}

export default icon;
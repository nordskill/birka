/**
 * Generates an HTML img tag with responsive image sizes.
 * 
 * @param {Object} imageData - The image data object.
 * @param {Object} options - Optional parameters.
 * @param {string} [options.sizes="100vw"] - Sizes attribute value.
 * @param {number} [options.maxWidth=1024] - Maximum width for the src attribute.
 * @param {number} [options.size] - Specific width size for the img tag.
 * @returns {string} - The generated HTML img tag.
 * 
 * @example
 * const imageData = {
 *     _id: '661306ed44f5f71262d46d6c',
 *     type: 'image',
 *     description: 'Survival gear like a fire starter and compass',
 *     file_name: '22_Survival_gear_like_a_fire_starter_compass',
 *     mime_type: 'image/png',
 *     extension: 'png',
 *     hash: '32c7775eb349d1d5f26894cd98014d416e20d6fbadf657b08f9d7a0931d302d4',
 *     tags: ['661306ba44f5f71262d46d4a', '661306ba44f5f71262d46d4b'],
 *     used: 0,
 *     __t: 'Image',
 *     height: 1856,
 *     width: 2464,
 *     alt: 'Survival gear',
 *     sizes: [150, 300, 600, 1500, 1024, 2048, 2464],
 *     optimized_format: 'webp',
 *     status: 'optimized'
 * };
 * 
 * const options = {
 *     sizes: '100vw',
 *     maxWidth: 1024,
 *     size: 800
 * };
 * 
 * const imgTag = getImgTag(imageData, options);
 * console.log(imgTag);
 */
function getImgTag(imageData, options = {}) {
    const {
        figureTag = false,
        caption,
        sizes,
        maxWidth = 1024,
        size,
        attributes = {}
    } = options;

    if (!imageData || !imageData.hash || !imageData.file_name) {
        console.error('Missing required image data');
        return '';
    }

    const baseUrl = `/files/${imageData.hash.slice(0, 2)}`;
    const {
        file_name,
        extension,
        optimized_format,
        sizes: imageSizes,
        alt,
        width,
        height
    } = imageData;

    // Escape function for attribute values
    const escape_attr_value = (str) => {
        return str.replace(/&/g, '&amp;')
                  .replace(/'/g, '&#39;')
                  .replace(/"/g, '&quot;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/\s+/g, ' '); // Replace multiple spaces with a single space
    };

    // Check if the image is an SVG
    if (extension === 'svg') {
        const src = `${baseUrl}/${file_name}.${extension}`;
        const additionalAttributes = getAdditionalAttributes(attributes, escape_attr_value);

        return `<img src="${src}" alt="${escape_attr_value(alt || '')}" ${additionalAttributes}/>`;
    }

    let srcset = '';
    let largestSrc = '';
    let selectedSize = size || Math.min(maxWidth, Math.max(...imageSizes));

    if (Array.isArray(imageSizes) && imageSizes.length > 0) {
        srcset = imageSizes.map(size => {
            return `${baseUrl}/${size}/${file_name}.${optimized_format} ${size}w`;
        }).join(', ');

        if (size) {
            selectedSize = imageSizes.includes(size) ? size : getClosestSize(size, imageSizes);
        } else {
            const largestAvailableSize = Math.min(maxWidth, Math.max(...imageSizes));
            largestSrc = `${baseUrl}/${largestAvailableSize}/${file_name}.${optimized_format}`;
        }
    }

    if (!largestSrc) {
        largestSrc = `${baseUrl}/${selectedSize}/${file_name}.${optimized_format}`;
    }

    const additionalAttributes = getAdditionalAttributes(attributes, escape_attr_value);
    const sizesAttribute = sizes ? `sizes="${escape_attr_value(sizes)}"` : '';

    const imgTag = `<img src="${largestSrc}" srcset="${escape_attr_value(srcset)}" ${sizesAttribute} alt="${escape_attr_value(alt || '')}" width="${selectedSize}" height="${selectedSize ? Math.round((selectedSize / width) * height) : height || ''}" ${additionalAttributes}/>`;

    if (figureTag || caption != null) {
        let figureContent = '<figure>' + imgTag;
        if (caption != null) {
            figureContent += `<figcaption>${escape_attr_value(caption)}</figcaption>`;
        }
        figureContent += '</figure>';
        return figureContent;
    }

    return imgTag;
}


/**
 * Finds the closest size in the array to the target size.
 * 
 * @param {number} targetSize - The target size.
 * @param {number[]} sizesArray - The array of available sizes.
 * @returns {number} - The closest size.
 */
function getClosestSize(targetSize, sizesArray) {
    return sizesArray.reduce((prev, curr) =>
        Math.abs(curr - targetSize) < Math.abs(prev - targetSize) ? curr : prev
    );
}

/**
 * Generates a string of additional HTML attributes from an object.
 * 
 * @param {Object} attributes - An object of attribute key-value pairs.
 * @returns {string} - A string of HTML attributes.
 */
function getAdditionalAttributes(attributes) {
    return Object.entries(attributes)
        .filter(([key, value]) => value !== false)
        .map(([key, value]) => value === true ? key : `${key}="${value}"`)
        .join(' ');
}



module.exports = getImgTag;
function slugify(str) {
    return str
        .toLowerCase() // Convert to lower case
        .trim() // Remove spaces from both ends
        .replace(/[^a-z0-9]+/g, '-') // Replace spaces and non-alphanumeric characters with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

module.exports = slugify;
function slugify(input) {
    return String(input)
        .normalize('NFKD')  // Normalize Unicode characters
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
        .replace(/[^\p{L}\p{N}-]+/gu, '')  // Remove all non-alphanumeric characters except hyphens
        .replace(/-+/g, '-')  // Replace multiple hyphens with a single hyphen
        .replace(/^-+|-+$/g, '');  // Remove leading and trailing hyphens
}

module.exports = slugify;
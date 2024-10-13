/**
 * Searches for a custom field by name within the `custom` property of a page data object.
 *
 * @param {Object} pageData - The complete page data object that includes a `custom` array of field objects.
 * @param {string} fieldName - The name of the field to search for within the `custom` fields.
 * @returns {Array|string|undefined} - Returns an array of values for checked checkboxes, a single value for other field types, or undefined if no field is found.
 * 
 * @example
 * // Usage example
 * const feature = getField(pageData, 'feature');
 */
function getField(pageData, fieldName) {
    const { custom } = pageData;

    function collectValues(fields, name) {
        const results = [];

        fields.forEach(field => {
            if (field.element === 'fieldset') {
                // Recursively collect values from nested fieldsets
                results.push(...collectValues(field.content, name));
            } else if (field.name === name) {
                
                if (field.type === 'checkbox' && field.checked) {
                    // Collect only checked checkboxes
                    results.push(field.value);
                } else if (field.type === 'radio' && field.checked) {
                    // Radio fields should only add the first checked occurrence
                    if (!results.length) results.push(field.value);
                } else if (field.type !== 'checkbox' && field.type !== 'radio') {
                    if (field.element === 'textarea') {
                        // For textarea fields, add the content property
                        results.push(field.content);
                    } else {
                        // Directly add the value for other input types
                        results.push(field.value);
                    }
                }
            }
        });

        return results;
    }

    const result = collectValues(custom, fieldName);

    return result.length === 1 ? result[0] : (result.length > 0 ? result : undefined);
}

export default getField;
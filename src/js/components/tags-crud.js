/**
 * Manages CRUD operations for tags within an e-commerce platform. This class can be initialized
 * either from an existing DOM element with predefined markup or dynamically where it creates the
 * necessary HTML structure and appends it to a specified parent container. It handles adding and
 * removing tags by interacting with a backend API, and updates the UI correspondingly.
 *
 * @class
 * @param {string|object} options - If a string is provided, it is treated as the selector for the
 *                                  existing DOM element. If an object is provided, it specifies
 *                                  the container where the new element will be appended, along with
 *                                  necessary data such as the endpoint URL, initial tags, and CSRF token.
 * @property {HTMLElement} element - The main element of the component, containing all UI elements for the tag CRUD.
 * @property {string} endpoint - The API endpoint for server communication.
 * @property {Array} tags - Initial array of tag objects.
 * @property {string} token - CSRF token for secure API requests.
 *
 * @example
 * // Initialize from an existing element
 * const tagsCRUD = new TagsCRUD('.tags_crud');
 *
 * @example
 * // Initialize dynamically with options
 * const tagsCRUD = new TagsCRUD({
 *   container: '.some_container', // Selector for the parent container
 *   endpoint: '/api/products/:id/tags', // API endpoint
 *   tags: [{ _id: '123', name: 'Example Tag', slug: 'example-tag', used: 10 }], // Initial tags
 *   token: 'abc123' // CSRF token
 * });
 */

class TagsCRUD {
    constructor(options) {
        if (typeof options === 'string') { // Initialize from existing DOM element
            
            this.element = document.querySelector(options);
            this.endpoint = this.element.dataset.endpoint;
            this.token = this.element.dataset.token;
            
            this.tags = Array.from(this.element.querySelectorAll('.badge_tag')).map(tag => ({
                name: tag.querySelector('span').textContent,
                slug: tag.dataset.slug
            }));

        } else { // Initialize dynamically within specified container
            
            this.endpoint = options.endpoint;
            this.tags = Array.isArray(options.tags) ? options.tags : [];
            this.token = options.token;

            const parentContainer = document.querySelector(options.container);
            this.element = document.createElement('div');
            this.element.className = `card tags_crud ${options.additionalClass || ''}`;
            this.element.dataset.endpoint = this.endpoint;
            this.element.innerHTML = this.generateMarkup(this.tags);
            parentContainer.appendChild(this.element);
        }

        this.bindEvents();
    }

    generateMarkup(tags) {
        const tagsHTML = tags.length ? tags.map(tag => `
            <span class="badge_tag" data-slug="${tag.slug}">
                <span class="text-truncate">${tag.name}</span>
                <button type="button" title="remove this tag" class="btn-close bg-transparent"></button>
            </span>
        `).join('') : '<p class="empty">No Tags</p>';

        return `
            <div class="card-header fs-6">
                Tags
            </div>
            <div class="card-body">
                <div class="input-group mb-3">
                    <input type="text" class="form-control">
                    <button class="btn btn-outline-secondary" type="button" id="button-addon2" title="Add tags">Add</button>
                </div>
                <div class="d-flex flex-wrap gap-1 tags_container">
                    ${tagsHTML}
                </div>
            </div>
        `;
    }

    bindEvents() {
        const addButton = this.element.querySelector('.btn-outline-secondary');
        const input = this.element.querySelector('.form-control');

        addButton.onclick = () => {
            this.processInput(input);
        };

        input.onchange = ev => {
            this.processInput(ev.target);
        };

        this.element.onclick = ev => {
            if (ev.target.classList.contains('btn-close')) {
                const tagElement = ev.target.closest('.badge_tag');
                const tagSlug = tagElement.dataset.slug;
                this.removeTag(tagSlug);
            }
        };
    }

    processInput(inputElement) {
        const inputString = inputElement.value;
        const tagNames = inputString
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        if (tagNames.length) {
            this.addTags(tagNames);
            inputElement.value = '';
        }
    }

    async addTags(tagNames) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.token
                },
                body: JSON.stringify(tagNames)
            });
            if (!response.ok) throw new Error('Failed to add tags');
            const result = await response.json();
            if (result.success) {
                this.updateTagsUI(result.data);
            }
        } catch (error) {
            alert(error.message);
        }
    }

    async removeTag(tagSlug) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.token
                },
                body: JSON.stringify([tagSlug])
            });
            if (!response.ok) throw new Error('Failed to remove tag');
            const result = await response.json();
            if (result.success) {
                const slugsToRemove = result.data.map(tag => tag.slug);
                this.updateTagsUI(this.tags, slugsToRemove);
            }
        } catch (error) {
            alert(error.message);
        }
    }


    updateTagsUI(tags, tagSlugToRemove = null) {
        const tagsContainer = this.element.querySelector('.tags_container');

        if (tagSlugToRemove) {

            tagSlugToRemove.forEach(slug => {
                const tagElements = tagsContainer.querySelectorAll(`[data-slug="${slug}"]`);
                for (const elem of tagElements) {
                    elem.remove();
                    this.tags = this.tags.filter(tag => tag.slug !== slug);
                }
            });

        } else {
            tags.forEach(tag => {
                if (!this.tags.some(t => t.slug === tag.slug)) {
                    this.tags.push(tag);
                    tagsContainer.insertAdjacentHTML('beforeend', `
                        <span class="badge_tag" data-slug="${tag.slug}">
                            <span class="text-truncate">${tag.name}</span>
                            <button type="button" title="remove this tag" class="btn-close bg-transparent"></button>
                        </span>
                    `);
                }
            });

        }
    }
}


export default TagsCRUD;
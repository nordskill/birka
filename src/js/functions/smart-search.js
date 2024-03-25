import Debouncer from './debouncer';

/**
 * SmartSearch class for creating a debounced search input field.
 * @class
 * @param {HTMLElement} field - The input field element.
 * @param {string} csrfToken - The CSRF token for the request.
 *
 * @example
 * const searchField = document.querySelector('#search-field');
 * const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
 * const smartSearch = new SmartSearch(searchField, csrfToken);
 *
 * // Update the search endpoint
 * searchField.dataset.search = '/api/new-search-endpoint';
 * smartSearch.update();
 */
// import SmartSearch from './smart-search.js';
class SmartSearch {
    constructor(field, csrfToken) {
        this.field = field;
        this.token = csrfToken;
        this.resultsContainer = null;

        this.debouncer = new Debouncer({
            field_element: field,
            endpoint: field.dataset.search,
            token: this.token,
            method: 'GET',
            success_callback: this._show_results.bind(this),
            error_callback: this._show_error.bind(this),
            min_chars: 3
        });

        this.field.addEventListener('focus', () => this.init_results_container());
        // Updated to remove direct hiding on blur
        this.field.addEventListener('blur', () => setTimeout(() => this.hide_results_container(), 300)); // Delay hiding to allow for click event

        // Binding this context to ensure proper handling
        this.hide_results_container_immediately = this.hide_results_container_immediately.bind(this);
    }

    update() {
        this.debouncer.update_options({
            endpoint: this.field.dataset.search
        });
    }

    init_search() {
        this.debouncer.handle_input();
    }

    init_results_container() {
        if (!this.resultsContainer) {
            this.resultsContainer = document.createElement('div');
            this.resultsContainer.classList.add('search-results');
            document.body.appendChild(this.resultsContainer); // Append to body to avoid overflow issues
        }

        const rect = this.field.getBoundingClientRect();
        this.resultsContainer.style.position = 'absolute';
        this.resultsContainer.style.top = `${rect.bottom + window.scrollY}px`;
        this.resultsContainer.style.left = `${rect.left + window.scrollX}px`;
        this.resultsContainer.style.width = `${rect.width}px`;
        this.resultsContainer.style.display = 'block'; // Make sure the container is visible when field is focused
    }

    hide_results_container() {
        if (this.resultsContainer) {
            this.resultsContainer.style.display = 'none'; // Hide container when field loses focus
        }
    }

    // New method to immediately hide the results container
    hide_results_container_immediately() {
        if (this.resultsContainer) {
            this.resultsContainer.style.display = 'none';
        }
    }

    _show_results(fieldElem, data) {
        this.init_results_container(); // Ensure the results container is initialized

        this.resultsContainer.innerHTML = ''; // Clear previous results

        const eventResults = new CustomEvent('smartsearch:results', { detail: data });
        document.dispatchEvent(eventResults);

        if (data.length === 0) {
            this.resultsContainer.innerHTML = '<div class="no-results">No results found.</div>';
            return;
        }

        const ul = document.createElement('ul');
        data.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.name; // Prevent XSS and display only the name
            li.style.cursor = 'pointer';
            li.onclick = () => {
                const eventPick = new CustomEvent('smartsearch:pick', { detail: item });
                document.dispatchEvent(eventPick);
                this.hide_results_container_immediately(); // Hide container immediately after selection
            };
            ul.appendChild(li);
        });
        this.resultsContainer.appendChild(ul);
    }

    _show_error(fieldElem, message) {
        console.error(message);
    }

    _sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
}

export default SmartSearch;

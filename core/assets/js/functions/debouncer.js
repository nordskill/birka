/**
 * Debouncer class for debouncing user input and making requests to a specified endpoint.
 * @class
 * @param {Object} options - Configuration options for the debouncer.
 * @param {HTMLElement} options.field_element - The input field element.
 * @param {string} options.endpoint - The endpoint to send requests to.
 * @param {string} [options.token=''] - The CSRF token for the request.
 * @param {number} [options.min_chars=0] - The minimum number of characters to trigger the debouncer.
 * @param {Function} options.success_callback - The callback function to execute on successful response.
 * @param {Function} options.error_callback - The callback function to execute on error response.
 * @param {Function} options.input_callback - The callback function to execute on input event.
 *
 * @example
 * // Create a new instance of Debouncer
 * const debouncer = new Debouncer({
 *   field_element: document.getElementById('inputField'),
 *   endpoint: '/api/search',
 *   token: 'csrf_token',
 *   min_chars: 3,
 *   success_callback: (field, response) => {
 *     console.log('Success:', response);
 *   },
 *   error_callback: (field, errorMessage) => {
 *     console.error('Error:', errorMessage);
 *   },
 *   input_callback: (field) => {
 *     console.log('Input event:', field.value);
 *   }
 * });
 *
 * // Update the options of the debouncer
 * debouncer.update_options({
 *   min_chars: 2,
 *   success_callback: (field, response) => {
 *     console.log('Updated Success:', response);
 *   }
 * });
 */
class Debouncer {
    constructor(options) {
        this.set_options(options);
        this.debounce_timer = null;
        this.DELAY = 500;
        this._init();
    }

    set_options(options) {
        // Initialize default values if they don't exist, or retain old value if not provided new ones
        this.field_element = options.field_element || this.field_element;
        this.endpoint = options.endpoint || this.endpoint || '';
        this.method = options.method || this.method || 'GET';
        this.token = options.token || this.token || '';
        this.min_chars = (options.min_chars !== undefined) ? options.min_chars : (this.min_chars || 0);
        this.success_callback = options.success_callback || this.success_callback;
        this.error_callback = options.error_callback || this.error_callback;
        this.input_callback = options.input_callback || this.input_callback;
    }

    update_options(newOptions) {
        this._detach(); // Remove old event listeners and timer
        this.set_options(newOptions);
        this._init(); // Re-initialize with new options
    }

    handle_input = () => {
        if (this.input_callback) this.input_callback(this.field_element);
        if (this.field_element.value.length >= this.min_chars) {
            clearTimeout(this.debounce_timer);
            this.debounce_timer = setTimeout(() => this._send_request(), this.DELAY);
        }
    }

    _init() {
        // Ensure this.field_element exists before adding event listeners or initializing
        if (this.field_element) {
            // Protect against multiple initializations
            if (!this.field_element.debouncerInitialized) {
                this.field_element.addEventListener('input', this.handle_input);
                this.field_element.debouncerInitialized = true;
            }

            // Setup a mutation observer to detect if the element is removed from the DOM
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.removedNodes.length > 0) {
                        if ([...mutation.removedNodes].includes(this.field_element)) {
                            this._detach();
                            observer.disconnect();
                        }
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            console.error('Debouncer initialization failed: field_element is undefined.');
        }
    }

    async _send_request() {
        const isCheckbox = this.field_element.type === 'checkbox';
        const value = isCheckbox ? this.field_element.checked : this.field_element.value;
        const name = this.field_element.name;
        let response;

        try {
            if (this.method.toUpperCase() === 'GET') {
                const url = new URL(this.endpoint, window.location.origin);
                url.searchParams.set(name, value);
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'X-CSRF-Token': this.token
                    }
                });
            } else { // For methods other than GET
                response = await fetch(this.endpoint, {
                    method: this.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': this.token
                    },
                    body: JSON.stringify({ [name]: value })
                });
            }

            if (response.ok) {
                if (!this.success_callback) return;
                const json = await response.json();
                this.success_callback(this.field_element, json);
            } else {
                if (!this.error_callback) return;
                const errorData = await response.json();
                this.error_callback(this.field_element, errorData.message);
            }
        } catch (error) {
            if (!this.error_callback) return;
            this.error_callback(this.field_element, error.message);
        }
    }

    _detach() {
        if (this.field_element) {
            this.field_element.removeEventListener('input', this.handle_input);
            this.field_element.debouncerInitialized = false;
        }
        clearTimeout(this.debounce_timer);
    }

}

export default Debouncer;

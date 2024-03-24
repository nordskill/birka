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
 */
class Debouncer {
    constructor(options) {
        this.field_element = options.field_element;
        this.endpoint = options.endpoint;
        this.token = options.token || '';
        this.min_chars = options.min_chars || 0;
        this.success_callback = options.success_callback;
        this.error_callback = options.error_callback;
        this.input_callback = options.input_callback;
        this.debounce_timer = null;
        this.DELAY = 500;
        this.init();
    }

    init() {
        this.field_element.addEventListener('input', () => {
            this.input_callback(this.field_element);

            if (this.field_element.value.length >= this.min_chars) {
                clearTimeout(this.debounce_timer);
                this.debounce_timer = setTimeout(() => this.sendRequest(), this.DELAY);
            }
        });
    }

    async sendRequest() {
        const value = this.field_element.value;
        const name = this.field_element.name;

        try {
            const response = await fetch(this.endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.token
                },
                body: JSON.stringify({ [name]: value })
            });

            if (response.ok) {
                const json = await response.json();
                this.success_callback(this.field_element, json);
            } else {
                const errorData = await response.json();
                this.error_callback(this.field_element, errorData.message);
            }
        } catch (error) {
            this.error_callback(error.message);
        }
    }
}

export default Debouncer;


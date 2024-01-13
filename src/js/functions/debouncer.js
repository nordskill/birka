/**
 * Debouncer class for debouncing input events and sending requests to a specified
 * endpoint.
 * @class
 * 
 * @example
 * // Create a new Debouncer instance
 * const inputField = document.querySelector('#myInputField');
 * const debouncer = new Debouncer(inputField, '/api/endpoint');
 * 
 * // Now, the input field will debounce input events and send requests to
 * // '/api/endpoint'
 */
class Debouncer {
    /**
     * Creates a new Debouncer.
     * @param {HTMLElement} fieldElement - The input field element to debounce.
     * @param {string} endpoint - The endpoint to send requests to when the input event
     * is debounced.
     */
    constructor(fieldElement, endpoint) {
        this.fieldElement = fieldElement;
        this.endpoint = endpoint;
        this.csrfToken = document.querySelector('meta[name="csrf"]').content;
        this.debounceTimer = null;
        this.init();
    }

    init() {
        this.fieldElement.addEventListener('input', () => {

            this.fieldElement.classList.remove('is-valid', 'is-invalid');
            const invalidFeedback = this.fieldElement.nextElementSibling;
            invalidFeedback.style.display = 'none';

            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.sendRequest(), 500);
        });
    }

    async sendRequest() {
        const value = this.fieldElement.value;
        const name = this.fieldElement.name;

        try {
            const response = await fetch(this.endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken
                },
                body: JSON.stringify({ [name]: value })
            });

            if (response.ok) {
                this.handleSuccess();
            } else {
                const errorData = await response.json();
                this.handleError(errorData.message);
            }
        } catch (error) {
            this.handleError(error.message);
        }
    }

    handleSuccess() {
        this.fieldElement.classList.add('is-valid');
    }

    handleError(errorMessage) {
        this.fieldElement.classList.add('is-invalid');
        const invalidFeedback = this.fieldElement.nextElementSibling;
        invalidFeedback.style.display = 'block';
        invalidFeedback.textContent = errorMessage;
    }
}

export default Debouncer;
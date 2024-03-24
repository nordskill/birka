import Debouncer from '../functions/debouncer';

/**
 * FileDetails class for handling file details in a modal.
 * 
 * @example
 * const fileDetails = new FileDetails();
 * fileDetails.open('fileId123'); // Opens the modal with details for the file with id 'fileId123'
 * fileDetails.close(); // Closes the modal
 * 
 * @property {HTMLElement} element - The modal element.
 */
class FileDetails {

    constructor() {
        this.modal = document.createElement('div');
        this.modal.className = 'file_details';
        this.win = document.createElement('div');
        this.win.className = 'window';
        this.modal.appendChild(this.win);
        this.modal.setAttribute('hidden', '');
        this._opened = false;
        document.body.appendChild(this.modal);

        // Close window
        this.modal.addEventListener('click', event => {
            if (event.target.closest('.closer') || event.target === this.modal) {
                this.close();
            }
        });
        document.addEventListener('keydown', event => {
            if (event.key == 'Escape') this.close();
        });
    }

    /**
     * Opens the modal and fetches the file details.
     * 
     * @param {string} id - The id of the file to fetch details for.
     * @returns {Promise<void>}
     */
    async open(id) {
        try {
            this.modal.removeAttribute('hidden');
            this._opened = true;
            const response = await fetch(`/api/files/${id}`);
            const data = await response.json();
            const html = this._compileTemplate(data);
            this.win.innerHTML = html;
            this._initFieldUpdates(id);
        } catch (error) {
            console.error('Error fetching file details:', error);
        }
    }

    close() {
        this.modal.setAttribute('hidden', '');
        this.win.innerHTML = '';
        this._opened = false;
    }

    get element() {
        return this.modal;
    }

    get opened() {
        return this._opened;
    }

    _compileTemplate(data) {

        const { type, file_name, extension, hash } = data;

        let fileName = `${file_name}.${extension}`;
        const folder = `/files/${hash.slice(0, 2)}/`;
        const originalFile = folder + fileName;
        let filePath = '';
        let media = '';
        let altField = '';
        let dimensions = `
            <div>
                <span>Dimensions:</span>
                <pre>${data.width} × ${data.height} px</pre>
            </div>`;

        if (type == 'image') {

            const { optimized_format, alt, title } = data;
            const IMG_SIZE = Math.max(...data.sizes);
            fileName = file_name + '.' + optimized_format;
            filePath = folder + IMG_SIZE + '/' + fileName;
            media = `<img src="${filePath}" alt="${alt}">`;

            if (data.mime_type === 'image/svg+xml') {

                dimensions = '';

                altField = `
                    <div class="pb-2">
                        <label for="file_title" class="form-label">Image title:</label>
                        <input type="text" class="form-control" id="file_title" name="title" value="${title ?? ''}">
                        <div class="invalid-feedback"></div>
                    </div>`;

            } else {

                altField = `
                <div class="pb-2">
                    <label for="file_alt" class="form-label">Image alt:</label>
                    <input type="text" class="form-control" id="file_alt" name="alt" value="${alt ?? ''}">
                    <div class="invalid-feedback"></div>
                </div>`;

            }

        } else {

            media = `<video src="${originalFile}" controls></video>`;

        }

        return `
            <div class="media">
               ${media}
            </div>
            <section class="info">
                <header>
                    <h5>${fileName}</h5>
                    <svg class="closer" viewBox="0 0 14 14">
                        <path d="m8.746 7.001 4.888-4.888A1.236 1.236 0 0 0 11.888.364L7.001 5.25 2.112.362a1.237 1.237 0 1 0-1.75 1.75L5.25 7.001.362 11.888a1.237 1.237 0 0 0 1.749 1.749l4.89-4.888 4.888 4.888a1.237 1.237 0 0 0 1.749-1.749Z"></path>
                    </svg>
                </header>
                <div class="meta">
                    <div>
                        <span>Id.:</span>
                        <pre>${data._id}</pre>
                    </div>
                    <div>
                        <span>Uploaded:</span>
                        <pre>${data.createdAt}</pre>
                    </div>
                    <div>
                        <span>Size:</span>
                        <pre>${data.size}</pre>
                    </div>
                    <div>
                        <span>MIME type:</span>
                        <pre>${data.mime_type}</pre>
                    </div>
                    ${dimensions}
                    <div>
                        <span>Original file:</span>
                        <pre>${originalFile}</pre>
                    </div>
                </div>
                <main>
                    ${altField}
                    <div class="pb-2">
                        <label for="file_description" class="form-label">Description:</label>
                        <textarea class="form-control" id="file_description" rows="3" name="description">${data.description ?? ''}</textarea>
                        <div class="invalid-feedback"></div>
                    </div>
                </main>
            </section>`;
    }

    _initFieldUpdates(id) {
        const fields = this.win.querySelectorAll('input, textarea');
        const endpoint = `/api/files/${id}`;
        const token = document.querySelector('meta[name="csrf"]').content;

        const onSuccess = (fieldElem) => {
            fieldElem.classList.add('is-valid');
        };
        const onError = (fieldElem, message) => {
            fieldElem.classList.add('is-invalid');
            const invalidFeedback = fieldElem.nextElementSibling;
            invalidFeedback.style.display = 'block';
            invalidFeedback.textContent = message;
        };
        const onInput = (fieldElem) => {
            fieldElem.classList.remove('is-valid', 'is-invalid');
            const invalidFeedback = fieldElem.nextElementSibling;
            invalidFeedback.style.display = 'none';
        };

        fields.forEach(field => {
            new Debouncer({
                field_element: field,
                endpoint,
                token,
                success_callback: onSuccess,
                error_callback: onError,
                input_callback: onInput
            });
        });
    }



}

export default FileDetails;
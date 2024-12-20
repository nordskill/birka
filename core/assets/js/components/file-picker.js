import FileManager from './file-manager.js';
import EventBus from '../../../utils/events.js';

const csrfToken = document.querySelector('meta[name="csrf"]').content;

class FilePicker {
    constructor() {
        this._generate_template();

        this.modal = document.querySelector('.file_picker');
        this.win = this.modal.querySelector('.win');
        this.selectBtn = this.win.querySelector('.select-btn');
        this.cancelBtn = this.win.querySelector('.cancel-btn');
        this.file_details_opened = false;
        this.setupEventListeners();
        
    }

    setupEventListeners() {
        this.cancelBtn.addEventListener('click', this.close);

        window.fileDetailsEvents = new EventBus();
        window.fileDetailsEvents.on('file-details:open', () => {
            this.file_details_opened = true;
        });

        this.modal.addEventListener('click', event => {
            if (event.target === this.modal) this.close();
        });
    }

    open(settings) {

        const options = {
            token: csrfToken,
            target: '.win .items',
        }

        if (settings) {
            options.settings = settings;
        }

        this.fileManager = new FileManager(options);

        document.addEventListener('file-selection:update', this._handleFileSelectionUpdate);
        document.addEventListener('keydown', this._handle_keys);

        this.modal.removeAttribute('hidden');

        return new Promise((resolve) => {
            this.selectBtn.onclick = () => {
                const selectedFiles = this.fileManager.selected;
                this.close();
                resolve(selectedFiles.length > 0 ? selectedFiles : []);
            };

            this.cancelBtn.onclick = () => {
                this.close();
                resolve([]);
            };
        });
    }

    close = () => {
        this.modal.setAttribute('hidden', '');
        this.win.querySelector('.items').innerHTML = '';
        if (this.fileManager) this.fileManager.destroy();
    }

    _generate_template() {
        const html = `
            <div class="file_picker" hidden>
                <div class="win rounded">
                    <div class="items">

                    </div>
                    <div class="bg-secondary-subtle d-flex justify-content-end p-3 rounded-bottom">
                        <button class="btn btn-primary me-2 select-btn" disabled>Select files</button>
                        <button class="btn btn-danger cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    _handleFileSelectionUpdate = (event) => {
        const selectedFiles = event.detail;
        this.selectBtn.disabled = selectedFiles.length === 0;
    }

    _handle_keys = (e) => {

        if (e.key == 'Escape') {

            // second Escpa press closes the file details
            if (this.file_details_opened) {
                this.file_details_opened = false;
            } else {
                this.close();
            }

        }

    }
}

export default FilePicker;
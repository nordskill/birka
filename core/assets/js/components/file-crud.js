import findClosestNumber from '../functions/find-closest-number';
import FilePicker from './file-picker';

class FileCRUD {
    constructor(options) {
        this.picker = new FilePicker();
        this.buttons = this._init_buttons();
        this.is_empty = true;

        if (options instanceof HTMLElement) {
            this._init_from_element(options);
        } else if (typeof options === 'object') {
            this._init_from_object(options);
        } else {
            throw new Error('Invalid options provided to FileCRUD');
        }

        this._init_component();
    }

    _init_buttons() {
        return {
            add: {
                title: 'Add file',
                icon: `<svg class='icon blue' viewBox="0 0 14 14"><g fill="none" stroke="#0d6efd" stroke-linecap="round" stroke-width="2"><path d="M7 1v12"/><path d="M13 7H1"/></g></svg>`,
                onclick: () => this._handle_picker()
            },
            replace: {
                title: 'Replace file',
                icon: `<svg class='icon blue' viewBox='0 0 13.712 16'><path d='m11.312 2.4 2.4-2.4v6.48h-6.48L9.68 4.032a4.366 4.366 0 0 0-2.816-.992 4.422 4.422 0 0 0-3.1 1.216A4.408 4.408 0 0 0 2.3 7.232H.016A6.575 6.575 0 0 1 2.144 2.64 6.642 6.642 0 0 1 6.864.768 6.7 6.7 0 0 1 11.312 2.4ZM6.864 12.96a4.394 4.394 0 0 0 3.088-1.216 4.421 4.421 0 0 0 1.456-2.976H13.7a6.575 6.575 0 0 1-2.128 4.592 6.623 6.623 0 0 1-4.7 1.872A6.723 6.723 0 0 1 2.4 13.6L0 16V9.52h6.48l-2.448 2.448a4.43 4.43 0 0 0 2.832.992Z'/></svg>`,
                onclick: () => this._handle_picker()
            },
            delete: {
                title: 'Delete file',
                icon: `<svg class='icon red' viewBox='0 0 13.714 16'><g fill='#ff0014'><path d='M4.571 5.714h1.143v6.857H4.571Z' /><path d='M8 5.714h1.143v6.857H8Z' /><path d='M0 2.286v1.143h1.143v11.428A1.143 1.143 0 0 0 2.286 16h9.143a1.143 1.143 0 0 0 1.143-1.143V3.429h1.143V2.286Zm2.286 12.571V3.429h9.143v11.428Z' /><path d='M4.571 0h4.571v1.143H4.571Z' /></g></svg>`,
                onclick: () => this._remove_preview()
            }
        };
    }

    _init_from_element(element) {
        this.element = element;
        this.container = element.parentElement;
        this._get_options_from_dataset();
    }

    _init_from_object(options) {
        this._validate_options(options);
        this.container = this._get_container(options.container);
        this.files_api = options.files_api;
        this.endpoint = options.endpoint;
        this.field_name = options.field_name;
        this.file = options.file;
        this.file_id = options.file_id || this.file?._id || "";
        this.size = options.size || "";
        this._insert_template();
    }

    _validate_options(options) {
        if (!options.container) {
            throw new Error('container is required.');
        }
    }

    _get_container(container) {
        return container instanceof HTMLElement ? container : document.querySelector(container);
    }

    _get_options_from_dataset() {
        const dataset = this.element.dataset;
        this.files_api = dataset.filesApi;
        this.endpoint = dataset.endpoint;
        this.field_name = dataset.fieldName;
        this.file_id = dataset.fileId;
        this.size = parseInt(dataset.size) || "";
    }

    _insert_template() {
        this.container.innerHTML = `
            <div class="file_crud position-relative static">
                <div class="fc_wrapper">
                    <div class="file_preview"></div>
                    <svg viewBox="0 0 21 18.373">
                        <path d="M18.375 0H2.626A2.624 2.624 0 0 0 0 2.622v13.127a2.624 2.624 0 0 0 2.624 2.624h15.751A2.625 2.625 0 0 0 21 15.749V2.624A2.625 2.625 0 0 0 18.375 0M2.626 1.312h15.749a1.313 1.313 0 0 1 1.313 1.312v8.208l-4.743-2.445a.686.686 0 0 0-.8.129l-5.114 5.117-3.667-2.445a.687.687 0 0 0-.869.085L1.314 14.1V2.624a1.313 1.313 0 0 1 1.312-1.312" />
                        <path d="M5.908 7.874a1.969 1.969 0 1 0-1.97-1.968 1.969 1.969 0 0 0 1.97 1.968" />
                    </svg>
                    <div class="icons">
                        <ul class="list_meta_icons d-flex justify-content-center position-absolute list-unstyled d-flex bottom-0 start-0 end-0">
                        </ul>
                    </div>
                </div>
            </div>`;
    }

    _init_component() {
        this.preview_container = this.container.querySelector('.fc_wrapper > .file_preview');
        this.buttons_container = this.container.querySelector('.fc_wrapper > .icons > ul');

        if (this.file) {
            this._generate_img_from_file_data(this.file);
        } else if (this.file_id) {
            this._generate_img_from_id(this.file_id);
        } else {
            this.is_empty = true;
        }

        this._insert_buttons();
    }

    _insert_buttons() {
        const buttons = this.is_empty ? [this.buttons.add] : [this.buttons.replace, this.buttons.delete];
        buttons.forEach(button => {
            const li = document.createElement('li');
            li.className = 'px-1';
            li.innerHTML = `<button type="button" title='${button.title}' class='btn circle_btn bg-white rounded-circle'>${button.icon}</button>`;
            li.onclick = button.onclick;
            this.buttons_container.appendChild(li);
        });
    }

    async _generate_img_from_id(id) {
        if (!this.files_api) return;
        try {
            const response = await fetch(`${this.files_api}/${id}`);
            const file_data = await response.json();
            this._generate_img_from_file_data(file_data);
        } catch (error) {
            console.error('Error fetching file data:', error);
        }
    }

    _generate_img_from_file_data(file_data) {
        const { file_name, hash, optimized_format, sizes, alt, extension, mime_type } = file_data;
        let file_size, path;

        if (mime_type === 'image/svg+xml') {
            path = `/files/${hash.slice(0, 2)}/${file_name}.${extension}`;
        } else {
            file_size = this.size ? findClosestNumber(this.size, sizes) : sizes[0];
            const folder = `/files/${hash.slice(0, 2)}`;
            const file_name_with_ext = `${file_name}.${optimized_format}`;
            path = `${folder}/${file_size}/${file_name_with_ext}`;
        }

        this.preview_container.innerHTML = `
            <picture>
                <img class='card-img-top' src='${path}' alt='${alt}'>
            </picture>`;
        this.is_empty = false;
    }

    async _remove_preview() {
        if (confirm('Are you sure you want to remove the preview?')) {
            if (this.endpoint && this.field_name) {
                const success = await this._send_update({ [this.field_name]: null });
                if (success) {
                    this._clear_preview();
                } else {
                    console.error('Deleting file preview failed.');
                }
            } else {
                this._clear_preview();
            }
        }
    }

    _clear_preview() {
        this.preview_container.innerHTML = '';
        this.is_empty = true;
        this._update_buttons();
    }

    async _handle_picker() {
        const [id] = await this.picker.open({ type: 'image', single: true });
        if (id) {
            const file_data = await this._fetch_file_data(id);
            if (file_data) {
                await this._update_file(id, file_data);
            }
        }
    }

    async _fetch_file_data(id) {
        if (!this.files_api) return null;
        try {
            const response = await fetch(`${this.files_api}/${id}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching file data:', error);
            return null;
        }
    }

    async _update_file(id, file_data) {
        let success = true;
        if (this.endpoint && this.field_name) {
            success = await this._send_update({ [this.field_name]: id });
        }
        if (success) {
            this._generate_img_from_file_data(file_data);
            this._update_buttons();
        } else {
            alert('Error occurred. Try again.');
        }
    }

    _update_buttons() {
        this.buttons_container.innerHTML = '';
        this._insert_buttons();
    }

    async _send_update(data) {
        if (!this.endpoint) return true;
        try {
            const response = await fetch(this.endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error updating data:', error);
            return false;
        }
    }
}

export default FileCRUD;
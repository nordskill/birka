import findClosestNumber from '../functions/find-closest-number';
import FilePicker from './file-picker';

const picker = new FilePicker();

class FileCRUD {
    constructor(options) {

        this.BUTTONS = {
            add: {
                title: 'Add file',
                icon: `
                    <svg class='icon blue' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
                        <g fill="none" stroke="#0d6efd" stroke-linecap="round" stroke-width="2">
                            <path d="M7 1v12"/>
                            <path d="M13 7H1"/>
                        </g>
                    </svg>
                `,
                onclick: this._handle_picker
            },
            replace: {
                title: 'Replace file',
                icon: `
                    <svg class='icon blue' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 13.712 16'>
                        <path d='m11.312 2.4 2.4-2.4v6.48h-6.48L9.68 4.032a4.366 4.366 0 0 0-2.816-.992 4.422 4.422 0 0 0-3.1 1.216A4.408 4.408 0 0 0 2.3 7.232H.016A6.575 6.575 0 0 1 2.144 2.64 6.642 6.642 0 0 1 6.864.768 6.7 6.7 0 0 1 11.312 2.4ZM6.864 12.96a4.394 4.394 0 0 0 3.088-1.216 4.421 4.421 0 0 0 1.456-2.976H13.7a6.575 6.575 0 0 1-2.128 4.592 6.623 6.623 0 0 1-4.7 1.872A6.723 6.723 0 0 1 2.4 13.6L0 16V9.52h6.48l-2.448 2.448a4.43 4.43 0 0 0 2.832.992Z'/>
                    </svg>
                `,
                onclick: this._handle_picker
            },
            delete: {
                title: 'Delete file',
                icon: `
                    <svg class='icon red' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 13.714 16'>
                        <g fill='#ff0014'>
                            <path d='M4.571 5.714h1.143v6.857H4.571Z' />
                            <path d='M8 5.714h1.143v6.857H8Z' />
                            <path d='M0 2.286v1.143h1.143v11.428A1.143 1.143 0 0 0 2.286 16h9.143a1.143 1.143 0 0 0 1.143-1.143V3.429h1.143V2.286Zm2.286 12.571V3.429h9.143v11.428Z' />
                            <path d='M4.571 0h4.571v1.143H4.571Z' />
                        </g>
                    </svg>
                `,
                onclick: this._remove_preview
            }
        }

        this.isEmpty = false;

        if (typeof options === 'string') {
            this.element = document.querySelector(options);
            this.container = this.element.parentElement;
            this._get_options_from_dataset(options);
        } else if (options instanceof HTMLElement) {
            this.element = options;
            this.container = this.element.parentElement;
            this._get_options_from_dataset(options);
        } else {
            this.container = undefined;
            if (options.container instanceof HTMLElement) {
                this.container = options.container;
            } else {
                this.container = document.querySelector(options.container);
            }
            this._get_options_from_object(options);
            this._insert_template();
        }
        
        this.previewContainer = this.container.querySelector('.container > .file_preview');
        this.buttonsContainer = this.container.querySelector('.container > .icons > ul');

        if (!this.file) {
            if (this.fileId == '') {
                this.isEmpty = true;
            } else {
                this._generate_img_from_id(this.fileId)
            }
        } else {
            this._generate_img_from_file_data(this.file);
        }

        this._insert_buttons();
    }

    _get_options_from_object = (options) => {
        const keysToCheck = ['container', 'files_api', 'endpoint'];

        try {
            keysToCheck.forEach(key => {
                if (options[key] === undefined) {
                    throw new Error(`${key} is undefined.`)
                }
            })

            this.filesApi = options.files_api;
            this.endpoint = options.endpoint;
            this.fieldName = options.field_name;
            this.file = options.file;
            this.fileId = options.file_id || this.file?._id || "";
            this.size = options.size || "";

        } catch (err) {
            console.error('Provide required information. ', err);
        }
    }

    _get_options_from_dataset = () => {
        try {
            const componentsInfo = this.element.dataset;
            const keysToCheck = ['filesApi', 'endpoint', 'fileId', 'size'];

            keysToCheck.forEach(key => {
                if (componentsInfo[key] === undefined) {
                    throw new Error(`'${key}' is undefined.`)
                }
            });

            this.filesApi = componentsInfo.filesApi;
            this.endpoint = componentsInfo.endpoint;
            this.fieldName = componentsInfo.fieldName;
            this.fileId = componentsInfo.fileId;
            this.size = parseInt(componentsInfo.size);

        } catch (error) {
            console.error('Provide required information. ', error);
        }
    }

    _insert_template = () => {
        this.container.innerHTML = `
            <div class="file_crud position-relative static">
                <div class="container">
                    <div class="file_preview"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 18.373">
                        <path d="M18.375 0H2.626A2.624 2.624 0 0 0 0 2.622v13.127a2.624 2.624 0 0 0 2.624 2.624h15.751A2.625 2.625 0 0 0 21 15.749V2.624A2.625 2.625 0 0 0 18.375 0M2.626 1.312h15.749a1.313 1.313 0 0 1 1.313 1.312v8.208l-4.743-2.445a.686.686 0 0 0-.8.129l-5.114 5.117-3.667-2.445a.687.687 0 0 0-.869.085L1.314 14.1V2.624a1.313 1.313 0 0 1 1.312-1.312" />
                        <path d="M5.908 7.874a1.969 1.969 0 1 0-1.97-1.968 1.969 1.969 0 0 0 1.97 1.968" />
                    </svg>
                    <div class="icons">
                        <ul class="list_meta_icons d-flex justify-content-center position-absolute list-unstyled d-flex bottom-0 start-0 end-0">
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    _insert_buttons = () => {
        this.addBtn = this._get_button(this.BUTTONS.add);
        this.replaceBtn = this._get_button(this.BUTTONS.replace);
        this.deleteBtn = this._get_button(this.BUTTONS.delete);

        if (this.isEmpty) {
            this.buttonsContainer.insertAdjacentElement('beforeend', this.addBtn);
        } else {
            this.buttonsContainer.insertAdjacentElement('beforeend', this.replaceBtn);
            this.buttonsContainer.insertAdjacentElement('beforeend', this.deleteBtn);
        }
    }

    _get_button = ({ title, icon, onclick }) => {
        const container = document.createElement('li');
        container.className = 'px-1';
        container.onclick = onclick;

        container.innerHTML = `
            <button title='${title}' class='btn circle_btn bg-white rounded-circle'>
                ${icon}
            </button>
        `;

        return container;
    }

    _generate_img_from_id = async (id) => {
        const res = await fetch(this.filesApi + '/' + id)
        const fileData = await res.json();

        this._generate_img_from_file_data(fileData);
    }

    _generate_img_from_file_data = (fileData) => {
        const { file_name, hash, optimized_format, sizes, alt, extension, mime_type } = fileData;

        let fileSize, path;

        if (mime_type === 'image/svg+xml') {
            path = `/files/${hash.slice(0, 2)}/${file_name}.${extension}`;
        } else {
            if (this.size === '') {
                fileSize = sizes[0];
            } else {
                fileSize = findClosestNumber(this.size, sizes);
            }
    
            const folder = `/files/${hash.slice(0, 2)}`;
            const fileName = file_name + '.' + optimized_format;
            path = folder + '/' + fileSize + '/' + fileName;
        }

        this.previewContainer.innerHTML = `
            <img class='card-img-top' src='${path}' alt='${alt}'>`;
    }

    _remove_preview = async (e) => {
        e.preventDefault();
        const decision = confirm('Are you sure you want to remove the preview?');

        if (decision) {
            const req = await this._send_update(this.endpoint, {
                [this.fieldName]: null
            });

            const res = await req.json();

            if (res.success) {
                this.previewContainer.innerHTML = '';
                this._update_buttons('no preview');
            } else {
                console.error('Deleting file preview went wrong.');
            }
        }
    }

    _handle_picker = async (e) => {
        e.preventDefault();

        const [id] = await picker.open({
            type: 'image',
            single: true
        });

        if (id) {
            const res = await fetch(this.filesApi + '/' + id)
            const fileData = await res.json();

            if (fileData._id) {
                this.previewContainer.innerHTML = '';
                const req = await this._send_update(this.endpoint, {
                    [this.fieldName]: id
                });

                const res = await req.json();

                if (res.success) {
                    this._generate_img_from_id(fileData._id);
                    this._update_buttons();
                } else {
                    alert('Error occured. Try again.');
                }
            }
        }
    }

    _update_buttons(state) {

        this.buttonsContainer.innerHTML = '';

        switch (state) {
            case 'no preview':
                this.buttonsContainer.append(this.addBtn);
                break;
            default:
                this.buttonsContainer.append(this.replaceBtn, this.deleteBtn);
                break;
        }
    }

    _send_update = async (url, data) => {
        return await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }
}

export default FileCRUD;
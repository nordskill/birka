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

        this.isDefaultFile = false;

        if (typeof options === 'string') {
            this._get_options_from_dataset(options);

            this.fileContainer = this.component.querySelector('.container > .file_preview');
            this.buttonsContainer = this.component.querySelector('.container > .icons > ul');

            this.file = this.fileContainer.querySelector(':scope > img')

            if (!this.file) {
                this._handle_lack_of_file();
            }
        } else {
            // to be written
        }

        this._insert_buttons();

    }

    _insert_buttons = () => {
        this.addBtn = this._get_button(this.BUTTONS.add);
        this.replaceBtn = this._get_button(this.BUTTONS.replace);
        this.deleteBtn = this._get_button(this.BUTTONS.delete);

        if (this.isDefaultFile) {
            this.buttonsContainer.insertAdjacentElement('beforeend', this.addBtn);
        } else {
            this.buttonsContainer.insertAdjacentElement('beforeend', this.replaceBtn);
            this.buttonsContainer.insertAdjacentElement('beforeend', this.deleteBtn);
        }
    }

    _get_button = ({title, icon, onclick}) => {
        const container = document.createElement('li');
        container.className = 'px-1';

        const btn = document.createElement('button');

        btn.title = title;
        btn.innerHTML = icon;
        btn.onclick = onclick;
        btn.className = 'btn circle_btn bg-white rounded-circle';

        container.appendChild(btn);

        return container;
    }

    _switch_icons = (btn) => {
        this.buttonsContainer.querySelector('li > button > svg').innerHTML = btn.icon;
    }

    _get_options_from_dataset = (selector) => {
        this.component = document.querySelector(selector + ' .file_crud');

        try{
            const componentsInfo = this.component.dataset;
            const keysToCheck = ['filesApi', 'endpoint', 'fileId', 'size'];

            keysToCheck.forEach( key => {
                if (componentsInfo[key] === undefined) {
                    throw new Error(`'${key}' is undefined.`)
                }
            })

            this.filesApi = componentsInfo.filesApi;
            this.endpoint = componentsInfo.endpoint;
            this.fileId = componentsInfo.fileId;
            this.size = parseInt(componentsInfo.size);

        } catch (error) {
            console.error('Provide required information. ', error)
        }
    }

    _handle_lack_of_file = () => {
        if (this.fileId == '') {
            this.isDefaultFile = true;
        } else {
            this._generate_img_from_id(this.fileId)
        }
    }

    _create_img = (className, src, alt) => {
        const img = document.createElement('img');
        img.className = className;
        img.src = src;
        img.alt = alt;

        return img;
    }

    _generate_img_from_id = async (id) => {
        const res = await fetch(this.filesApi + '/' + id)
        const fileData = await res.json();

        const { file_name, hash, optimized_format, sizes, alt } = fileData;

        let fileSize;

        if (this.size === '') {
            fileSize = sizes[0];
        } else {
            fileSize = findClosestNumber(this.size, sizes);
        }

        const folder = `/files/${hash.slice(0, 2)}`;
        const fileName = file_name + '.' + optimized_format;
        const path = folder + '/' + fileSize + '/' + fileName;

        const img = this._create_img('card-img-top', path, alt);

        this.fileContainer.insertAdjacentElement('beforeend', img);
    }

    _remove_preview = async (e) => {
        e.preventDefault();
        const decision = confirm('Are you sure you want to remove the preview?');

        if (decision) {
            const req = await this._update_blogpost(this.endpoint, {
                img_preview: null
            });

            const res = await req.json();

            if (res.success) {
                this.fileContainer.innerHTML = '';
                this._remove_delete_btn();
                this._switch_icons(this.BUTTONS.add);
            } else {
                console.error('Deleting file preview went wrong.');
            }
        }
    }

    _remove_delete_btn = () => {
        this.deleteBtn.remove();
    }

    _show_delete_btn = () => {
        this.buttonsContainer.insertAdjacentElement('beforeend', this.deleteBtn);
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
                this.fileContainer.innerHTML = '';

                const req = await this._update_blogpost(this.endpoint, {
                    img_preview: id
                });

                const res = await req.json();

                if (res.success) {
                    this._generate_img_from_id(fileData._id);
                    this._switch_icons(this.BUTTONS.replace);
                    this._show_delete_btn();
                } else {
                    alert('Error occured. Try again.');
                }
            }
        }
    }

    _update_blogpost = async (url, data) => {
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
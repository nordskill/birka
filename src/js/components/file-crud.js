import findClosestNumber from "../functions/find-closest-number";

class FileCRUD {
    constructor(options) {
        if (typeof options === 'string') {
            this._get_options_from_dataset(options);

            this.fileContainer = this.component.querySelector('.container > .file_preview');
            this.file = this.fileContainer.querySelector(':scope > img')
            this.isDefaultFile = false;

            if (!this.file) {
                this._handle_lack_of_file();
            }
        } else {
            // to be written
        }

        this._get_icons();
        this._init_logic();
    }

    _get_icons = () => {
        const buttons = this.component.querySelectorAll('.list_meta_icons > li');

        this.filePickerBtnContainer = buttons[0];
        this.deleteBtnContainer = buttons[1];

        this.uploadIcon = `
            <svg class="icon blue" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M14 16H2a1.927 1.927 0 0 1-1.414-.586A1.927 1.927 0 0 1 0 14v-1.5a.961.961 0 0 1 .3-.7.961.961 0 0 1 .7-.3.961.961 0 0 1 .7.3.961.961 0 0 1 .3.7v.5a.987.987 0 0 0 1 1h10a.987.987 0 0 0 1-1v-.5a1 1 0 0 1 2 0V14a2 2 0 0 1-2 2Zm-.328-10H10v5a.987.987 0 0 1-1 1H7a.987.987 0 0 1-1-1V6H2.313q-.234 0-.289-.094t.133-.3L7.484.219a.717.717 0 0 1 1.031 0l5.328 5.391q.188.2.125.3t-.296.09Z"/>
             </svg>
        `;

        this.replaceIcon = `
            <svg class="icon blue" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.712 16">
                <path d="m11.312 2.4 2.4-2.4v6.48h-6.48L9.68 4.032a4.366 4.366 0 0 0-2.816-.992 4.422 4.422 0 0 0-3.1 1.216A4.408 4.408 0 0 0 2.3 7.232H.016A6.575 6.575 0 0 1 2.144 2.64 6.642 6.642 0 0 1 6.864.768 6.7 6.7 0 0 1 11.312 2.4ZM6.864 12.96a4.394 4.394 0 0 0 3.088-1.216 4.421 4.421 0 0 0 1.456-2.976H13.7a6.575 6.575 0 0 1-2.128 4.592 6.623 6.623 0 0 1-4.7 1.872A6.723 6.723 0 0 1 2.4 13.6L0 16V9.52h6.48l-2.448 2.448a4.43 4.43 0 0 0 2.832.992Z"/>
            </svg>
        `;

        this.deleteIcon = `
            <svg class="icon red" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.714 16">
                <g fill="#ff0014">
                    <path d="M4.571 5.714h1.143v6.857H4.571Z" />
                    <path d="M8 5.714h1.143v6.857H8Z" />
                    <path d="M0 2.286v1.143h1.143v11.428A1.143 1.143 0 0 0 2.286 16h9.143a1.143 1.143 0 0 0 1.143-1.143V3.429h1.143V2.286Zm2.286 12.571V3.429h9.143v11.428Z" />
                    <path d="M4.571 0h4.571v1.143H4.571Z" />
                </g>
            </svg>
        `;

        this._switch_icons();
    }

    _switch_icons = () => {

        const getButton = (svg, title, on_click) => {
            const btn = document.createElement('button');

            btn.title = title;
            btn.onclick = on_click;
            btn.innerHTML = svg;
            btn.className = "btn circle_btn bg-white rounded-circle";

            return btn;
        }

        this.filePickerBtnContainer.innerHTML = '';

        if (this.isDefaultFile) {
            const btnToReplace = getButton(this.uploadIcon, "Upload file", () => console.log('upload file'));
            this.filePickerBtnContainer.insertAdjacentElement('beforeend', btnToReplace);

        } else {
            const btnToReplace = getButton(this.replaceIcon, "Replace file", () => console.log('replace file'));
            this.filePickerBtnContainer.insertAdjacentElement('beforeend', btnToReplace);
        }


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
        if (this.fileId == "") {
            this.isDefaultFile = true;
            this._show_default_file();
        } else {
            this._generate_img_tag()
        }
    }

    _show_default_file = () => {
        const defaultImg = '<img class="card-img-top" src="/img/no-image_v01.webp" alt=""/>'
        this.fileContainer.insertAdjacentHTML('beforeend', defaultImg);
    }

    _generate_img_tag = async () => {
        const getFileData = async () => {
            const req = await fetch(this.filesApi + '/' + this.fileId)
            const res = await req.json();
            return res
        }

        const fileData = await getFileData();
        const { file_name, hash, optimized_format, sizes, alt } = fileData;

        let fileSize;

        if (this.size === "") {
            fileSize = sizes[0];
        } else {
            fileSize = findClosestNumber(this.size, sizes);
        }

        const folder = `/files/${hash.slice(0, 2)}`;
        const fileName = file_name + '.' + optimized_format;
        const path = folder + '/' + fileSize + '/' + fileName;

        const html = `<img class="card-img-top" src="${path}" alt="${alt}"/>`

        this.fileContainer.insertAdjacentHTML('beforeend', html);

    }

    _init_logic = () => {
        console.log('logic initialized!')
    }
}

export default FileCRUD;
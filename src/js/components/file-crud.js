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
        const icons = this.component.querySelectorAll('.list_meta_icons > li > button');

        this.uploadIcon = icons[0];
        this.replaceIcon = icons[1];
        this.deleteIcon = icons[2];

        this._switch_icons();
    }

    _switch_icons = () => {
        if (this.isDefaultFile) {
            this.uploadIcon.parentNode.style.display = "";
            this.replaceIcon.parentNode.style.display = "none";
        } else {
            this.uploadIcon.parentNode.style.display = "none";
            this.replaceIcon.parentNode.style.display = "";
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
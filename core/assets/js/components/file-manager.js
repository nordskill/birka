import FilesSelectionManager from "../functions/file-selection-manager";
import findClosestNumber from '../functions/find-closest-number';

class FileManager {
    constructor({ token, target, settings }) {

        this.token = token;
        this.target = document.querySelector(target);

        if (!this.target) {
            return;
        }

        this.settings = settings || {};

        this._generate_template();

        if (this.settings?.type) {
            document.querySelector('.file-types').remove();
        }

        this.files = this.target.querySelector('.files');
        this.containerToScroll = document.querySelector('.files_container');

        this.maxPages = 0 //default value
        this.nextPage = 1;
        this.typeOfFilesToShow = this.settings?.type || "";
        this.blockScrollEvent = false;

        this._get_files();

        document.addEventListener('files-loaded', this._ajax_scroll, { once: true });

        this._init_files_upload();
        this._init_files()

    }

    get selected() {
        const selectedFiles = Array.from(this.selectionManager.selectedItems);
        return selectedFiles.map(file => file.dataset.id);
    }

    destroy() {
        // Remove event listeners that might not be automatically cleaned up
        if (this.containerToScroll) {
            this.containerToScroll.removeEventListener('scroll', this._ajax_scroll);
        }

        // Clear references to DOM elements
        this.target = null;
        this.files = null;
        this.containerToScroll = null;

        // Additional cleanup for event listeners
        if (this.filters) {
            this.filters.forEach(filter => filter.removeEventListener('click', this._handle_filter_change));
        }

    }

    _ajax_scroll = () => {
        const DISTANCE_TO_PAGE_BOTTOM = 500;

        const handleLackOfFiles = async () => {
            while (getDistanceToPageBottom() < DISTANCE_TO_PAGE_BOTTOM && this.nextPage <= this.maxPages) {
                await loadFiles();
            }
        }

        const handleScroll = async () => {

            if (this.blockScrollEvent) return;

            if (getDistanceToPageBottom() < DISTANCE_TO_PAGE_BOTTOM) {
                this.containerToScroll.removeEventListener("scroll", handleScroll);

                const filterBtns = document.querySelectorAll('.file-types button');
                filterBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.containerToScroll.addEventListener('scroll', handleScroll)
                    })
                })

                await loadFiles()
                if (getDistanceToPageBottom() > DISTANCE_TO_PAGE_BOTTOM) {
                    this.containerToScroll.addEventListener('scroll', handleScroll)
                }
            }
        }

        const loadFiles = async () => {
            return new Promise(async (resolve, reject) => {
                if (this.nextPage <= this.maxPages) {
                    const req = await fetch(`/api/files?type=${this.typeOfFilesToShow}&page=` + this.nextPage);

                    if (req.ok) {
                        const response = await req.json();
                        this._generate_content(response)
                        this.nextPage += 1;

                        resolve();
                    } else {
                        reject(req);
                    }
                }
            });
        }

        const getDistanceToPageBottom = () => {
            const bottom = this.files.getBoundingClientRect().bottom;
            const gap = bottom - this.containerToScroll.getBoundingClientRect().height;
            return gap;
        }

        handleLackOfFiles();
        this.containerToScroll.addEventListener('scroll', handleScroll);
    }

    _init_files_upload = () => {

        const fileInput = document.querySelector('#file_input');

        let loadedFiles, loadedFilesData, amountOfFiles;

        fileInput.onchange = function (event) {
            event.preventDefault();

            const files = event.target.files;

            loadedFiles = [];
            loadedFilesData = [];
            amountOfFiles = files.length;

            for (const file of files) {
                switch (file.type.split('/')[0]) {
                    case 'image':
                        handleFile({
                            type: 'image',
                            file: file,
                            object: new Image(),
                            event: 'onload'
                        });
                        break;

                    case 'video':
                        handleFile({
                            type: 'video',
                            file: file,
                            object: document.createElement('VIDEO'),
                            event: 'onloadedmetadata'
                        });
                        break;

                    default: break;
                }
            }
        }

        const handleFile = ({ type, file, object, event }) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                object[event] = function () {
                    loadedFiles.push(file);

                    if (type == 'image') {
                        loadedFilesData.push({
                            name: file.name,
                            width: object.naturalWidth,
                            height: object.naturalHeight
                        })
                    } else {
                        loadedFilesData.push({
                            name: file.name,
                            width: object.videoWidth,
                            height: object.videoHeight,
                            fps: object.fps,
                            duration: object.duration
                        })
                    }

                    if (loadedFiles.length == amountOfFiles) sendFiles();
                }

                object.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }

        const sendFiles = () => {

            for (let i = 0; i < loadedFiles.length; i++) {
                const formData = new FormData();

                formData.append('file', loadedFiles[i]);
                formData.append('fileData', JSON.stringify(loadedFilesData[i]));

                fetch('/api/files', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-Token': this.token
                    },
                    body: formData
                })
                    .then(res => res.json())
                    .then(res => {
                        if (res.success) {
                            this._add_file(res.file);
                            this._check_state(res.file._id);

                            incrementFileAmount('button.all_files_btn span');
                            incrementFileAmount(`button.${res.file.type}s-btn span`);
                        } else {
                            console.error(res.message);
                        }
                    })
                    .catch(err => console.error(err));
            }

        }

        function incrementFileAmount(selector) {
            const filter = document.querySelector(selector);
            const oldValue = +filter.innerHTML;
            filter.innerHTML = oldValue + 1;
        }

    }

    _init_files = () => {
        this._detect_processing_files();
        this.selectionManager = new FilesSelectionManager({ token: this.token, parent: this.target, single: this.settings?.single });
    }

    _add_file(file) {

        const filesContainer = document.querySelector('.files');
        const { _id, type } = file;

        const html = `
        <div class="file" data-id="${_id}" data-type="${type}">
            <div class="spinner"></div>
        </div>`;

        filesContainer.insertAdjacentHTML('afterbegin', html);

    }

    _check_state(id) {
        const fileElement = document.querySelector(`.file[data-id="${id}"]`);

        const interval = setInterval(() => {
            fetch(`/api/files/${id}`)
                .then(res => res.json())
                .then(file => {
                    if (file.status !== 'processing') {
                        clearInterval(interval);
                        this._add_file_preview(fileElement, file);
                    }
                })
                .catch(err => console.error(err));
        }, 2000);

    }

    _add_file_preview(targetElement, file) {

        const { type, file_name, hash, optimized_format } = file;

        const folder = `/files/${hash.slice(0, 2)}/`;
        const IMG_SIZE = 300;
        const fileName = decodeURIComponent(file_name) + '.' + optimized_format;
        const filePath = folder + IMG_SIZE + '/' + fileName;

        let html;

        switch (type) {
            case 'image':
                let filePath = '';
                if (file.mime_type === 'image/svg+xml') {
                    filePath = `/files/${file.hash.slice(0, 2)}/${file.file_name}.${file.extension}`;
                } else {
                    const size = findClosestNumber(300, file.sizes);
                    const fileName = decodeURIComponent(file.file_name) + '.' + file.optimized_format;
                    filePath = `/files/${file.hash.slice(0, 2)}/${size}/${fileName}`;
                }
                html = `<img src="${filePath}" alt="${file.alt}">`;
                break;

            case 'video':
                html = `
                <svg viewBox="0 0 32 24">
                    <g>
                        <path d="M13.58 6.186a1 1 0 0 0-1.58.811v10a1 1 0 0 0 1.58.814l7-5a1 1 0 0 0 0-1.628Z"></path>
                        <path d="M0 4a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4Zm30 0a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2Z"></path>
                    </g>
                </svg>
                `;
                break;

            default: break;
        }

        targetElement.innerHTML = html;
    }

    _detect_processing_files() {

        const files = document.querySelectorAll('.file');

        files.forEach(file => {
            if (file.querySelector('.spinner')) {
                this._check_state(file.dataset.id);
            }
        });

    }

    _generate_template() {
        this.target.innerHTML = `
            <div class="file_manager">
                <div class="m-0">
                    <div class="d-flex justify-content-between bg-light p-3 rounded-top">
                        <div class="col-auto d-flex">
                            <form action="" id="sendFiles">
                                <label for="file_input" class="btn btn-primary me-2">Upload</label>
                                <input type="file" name="" class="d-none" id="file_input" accept="image/*, video/*" multiple>
                            </form>
                            <button class="btn btn-danger me-2 delete-btn" hidden>Delete <var></var> selected files</button>
                            <button class="btn btn-secondary deselect-btn" hidden>Deselect</button>
                        </div>
                        <div class="col-auto">
                            <form class="d-flex ms-auto" role="search">
                                <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
                                <button class="btn btn-outline-success" type="submit">Search</button>
                            </form>
                        </div>
                    </div>
                    <div class="d-flex align-items-center bg-secondary-subtle p-3 rounded-bottom file-types"></div>
                </div>
                <div class="mt-4 p-2 files_container">
                    <div class="files">
                    </div>
                </div>
            </div>`;
    }

    async _get_files() {
        try {
            const req = await fetch(`/api/files?page=1&type=${this.typeOfFilesToShow}`, {
                method: 'GET',
                headers: {
                    'X-CSRF-Token': this.token
                }
            });

            const res = await req.json();

            const AMOUNT_OF_FILES_PER_PAGE = 30;
            this.maxPages = Math.ceil(res.totalCount / AMOUNT_OF_FILES_PER_PAGE);

            this._generate_content(res);
            this.settings?.type || this._generate_markup_for_filter(res);
            this.nextPage++;

            if (this.blockScrollEvent) this.blockScrollEvent = false;

            const event = new CustomEvent('files-loaded');
            document.dispatchEvent(event);

        } catch (error) {
            console.error('Error in fetching files: ', error);
        }
    }

    _generate_content(res) {
        const { files } = res;

        let filesMarkup = '';

        files.forEach(file => {
            let fileMarkup;

            if (file.type === 'image') {
                if (file.status === 'processing') {
                    fileMarkup = '<div class="spinner"></div>';
                } else {
                    let path = '';
                    if (file.mime_type === 'image/svg+xml') {
                        path = `/files/${file.hash.slice(0, 2)}/${file.file_name}.${file.extension}`;
                    } else {
                        const size = findClosestNumber(300, file.sizes);
                        const fileName = decodeURIComponent(file.file_name) + '.' + file.optimized_format;
                        path = `/files/${file.hash.slice(0, 2)}/${size}/${fileName}`;
                    }
                    fileMarkup = `<img src="${path}" alt="${file.alt}">`;
                }
            } else if (file.type === 'video') {
                fileMarkup = `
                    <svg viewBox="0 0 32 24">
                        <g>
                            <path d="M13.58 6.186a1 1 0 0 0-1.58.811v10a1 1 0 0 0 1.58.814l7-5a1 1 0 0 0 0-1.628Z"></path>
                            <path d="M0 4a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4Zm30 0a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2Z"></path>
                        </g>
                    </svg>
                `
            }

            filesMarkup += `
                <div class="file" data-id="${file._id}" data-type="${file.type}">
                    ${fileMarkup}
                </div>
            `;
        })

        this.files.insertAdjacentHTML('beforeend', filesMarkup);
    }

    _generate_markup_for_filter(res) {

        const { countsByType, totalCount } = res;

        let filterMarkup = '';

        filterMarkup = `
            <button class="btn btn-light me-2 all_files_btn" data-type="">All <span class="text-black-50 all_files_amount">${totalCount}</span></button>
        `;

        countsByType.forEach(type => {
            filterMarkup += `<button class="btn btn-light me-2 ${type._id}s-btn" data-type="${type._id}">${type._id[0].toUpperCase() + type._id.slice(1)}s <span class="text-black-50">${type.count}</span></button>`
        })

        this.target.querySelector('.file-types').innerHTML = filterMarkup;

        this.filters = document.querySelectorAll('.file-types button');

        this.filters.forEach(filter => {
            filter.addEventListener('click', this._handle_filter_change);
        })
    }

    _handle_filter_change = (e) => {
        this.blockScrollEvent = true;
        this.typeOfFilesToShow = e.target.closest('button').dataset.type;
        this.files.innerHTML = '';
        this.nextPage = 1;

        this._hide_control_buttons();
        this._get_files();
    }

    _hide_control_buttons() {
        this.target.querySelector('.delete-btn').setAttribute('hidden', '')
        this.target.querySelector('.deselect-btn').setAttribute('hidden', '')
    }
}

export default FileManager;
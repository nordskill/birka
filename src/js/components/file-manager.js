import FilesSelectionManager from "../functions/fileSelectionManager";

class FileManager {
    constructor({ token, target, destination }) {
        this.token = token;
        this.target = document.querySelector(target);

        if (!this.target) {
            return;
        }

        this.destination = destination || 'page';
        this._generateTemplate();

        this.files = this.target.querySelector('.files');
        this.containerToScroll = this.destination == 'picker' ? document.querySelector('.files_container') : window;

        this.maxPages = 0
        this.nextPage = 2;
        this.typeToShow = '';
        this.blockScrollEvent = false;

        this._getFiles();
        this._ajax_scroll();
        this._initFilesUpload();

        if (destination != 'picker') {
            document.addEventListener('DOMContentLoaded', this._initFiles);
        } else {
            this._initFiles()
        }
    }

    _ajax_scroll = () => {
        const DISTANCE_TO_PAGE_BOTTOM = this.destination == 'picker' ? 400 : 600;

        const handleScroll = async () => {

            if(this.blockScrollEvent) return;

            if (getDistanceToPageBottom() < DISTANCE_TO_PAGE_BOTTOM) {
                this.containerToScroll.removeEventListener("scroll", handleScroll);

                const filterBtns = document.querySelectorAll('.file-types button');
                filterBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.containerToScroll.addEventListener('scroll', handleScroll)
                    })
                })

                loadPosts().then(() => {
                    if (getDistanceToPageBottom() > DISTANCE_TO_PAGE_BOTTOM) {
                        this.containerToScroll.addEventListener('scroll', handleScroll)
                    }
                });
            }
        }

        const loadPosts = () => {

            return new Promise((resolve) => {
                if (this.nextPage <= this.maxPages) {
                    fetch(`/api/files?type=${this.typeToShow}&page=` + this.nextPage)
                        .then((req) => {
                            if (req.ok) {
                                return req.json();
                            }
                            return Promise.reject(req);
                        })
                        .then((response) => {
                            this._generateContent(response)
                            this.nextPage += 1;

                            resolve();
                        });
                }
            });
        }

        const getDistanceToPageBottom = () => {
            const bottom = this.files.getBoundingClientRect().bottom;
            const gap = bottom - (this.destination == 'picker' ? document.querySelector('.files_container').getBoundingClientRect().height : window.innerHeight);
            return gap;
        }

        this.containerToScroll.addEventListener('scroll', handleScroll);

    }

    _initFilesUpload = () => {

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
                            this._addFile(res.file);
                            this._checkState(res.file._id);
                        } else {
                            console.error(res.message);
                        }
                    })
                    .catch(err => console.error(err));
            }

        }

    }

    _initFiles = () => {
        this._detectProcessingFiles();
        new FilesSelectionManager({token: this.token, parent: this.target});
    }

    _addFile(file) {

        const filesContainer = document.querySelector('.files');
        const { _id, type } = file;

        const html = `
        <div class="file" data-id="${_id}" data-type="${type}">
            <div class="spinner"></div>
        </div>`;

        filesContainer.insertAdjacentHTML('afterbegin', html);

    }

    _checkState(id) {
        const fileElement = document.querySelector(`.file[data-id="${id}"]`);

        const interval = setInterval(() => {
            fetch(`/api/files/${id}`)
                .then(res => res.json())
                .then(file => {
                    if (file.status == 'optimized') {
                        clearInterval(interval);
                        this._addFilePreview(fileElement, file);
                    }
                })
                .catch(err => console.error(err));
        }, 2000);

    }

    _addFilePreview(targetElement, file) {

        const { type, file_name, hash, optimized_format } = file;

        const folder = `/files/${hash.slice(0, 2)}/`;
        const IMG_SIZE = 300;
        const fileName = file_name + '.' + optimized_format;
        const filePath = folder + IMG_SIZE + '/' + fileName;

        let html;

        switch (type) {
            case 'image':
                html = `<img src="${filePath}" alt="">`;
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

    _detectProcessingFiles() {

        const files = document.querySelectorAll('.file');

        files.forEach(file => {
            if (file.querySelector('.spinner')) {
                this._checkState(file.dataset.id);
            }
        });

    }

    _generateTemplate() {
        this.target.innerHTML = `
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
                <div class="py-4 ${this.destination == 'picker' ? 'px-2': ''} files_container">
                    <div class="files">
                    </div>
                </div>
        `
    }

    async _getFiles() {

        try {
            const req = await fetch(`/api/files?page=1&type=${this.typeToShow}`, {
                method: 'GET',
                headers: {
                    'X-CSRF-Token': this.token
                }
            });

            const res = await req.json();

            const AMOUNT_OF_FILES_PER_PAGE = 30;
            this.maxPages = Math.ceil(res.totalCount / AMOUNT_OF_FILES_PER_PAGE);

            this._generateContent(res);
            this._generateMarkupForFilter(res);

            if (this.blockScrollEvent) this.blockScrollEvent = false;

        } catch (error) {
            console.error('Error in fetching files: ', error);
        }
    }

    _generateContent(res) {
        const { files } = res;

        let filesMarkup = '';
        let fileTypeMarkup = '';

        files.forEach(file => {
            let fileMarkup;

            if (file.type === 'image') {
                if (file.status === 'processing') {
                    fileMarkup = '<div class="spinner"></div>';
                } else {
                    let path = `/files/${file.hash.slice(0, 2)}/300/${file.file_name}.${file.optimized_format}`
                    fileMarkup = `<img src=${path} alt="${file.alt}">`
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



        // this.target.querySelector('.file-types').innerHTML = fileTypeMarkup
        this.files.insertAdjacentHTML('beforeend', filesMarkup);
    }

    _generateMarkupForFilter(res) {

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
            filter.addEventListener('click', this._handleFilterChange);
        })
    }

    _handleFilterChange = (e) => {
        this.blockScrollEvent = true;
        this.typeToShow = e.target.closest('button').dataset.type;
        this.files.innerHTML = '';
        this.nextPage = 2;

        this._getFiles();
    }
}

export default FileManager;
initFilesUpload();
document.addEventListener('DOMContentLoaded', initFiles);

function initFilesUpload() {

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

    function handleFile({ type, file, object, event }) {
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

    function sendFiles() {

        for (let i = 0; i < loadedFiles.length; i++) {
            const formData = new FormData();

            formData.append('file', loadedFiles[i]);
            formData.append('fileData', JSON.stringify(loadedFilesData[i]));

            fetch('/api/files', {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        addFile(res.file);
                        checkState(res.file._id);
                    } else {
                        console.error(res.message);
                    }
                })
                .catch(err => console.error(err));
        }

    }

}

class FileDetailsModal {

    constructor() {
        this.modal = document.createElement('div');
        this.modal.className = 'file_details';
        this.win = document.createElement('div');
        this.win.className = 'window';
        this.modal.appendChild(this.win);
        this.modal.style.display = 'none'; // Initially hidden
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

    async open(id) {
        try {
            this.modal.style.display = 'block'; // Show the modal
            const response = await fetch(`/api/files/${id}`);
            const data = await response.json();
            const html = this._compileTemplate(data);
            this.win.innerHTML = html;
        } catch (error) {
            console.error('Error fetching file details:', error);
        }
    }

    close() {
        this.modal.style.display = 'none';
        this.win.innerHTML = '';
    }

    _compileTemplate(data) {

        const { type, file_name, extension, hash } = data;

        let filePath = '';
        let media = '';
        let fileName = `${file_name}.${extension}`;
        let altField = '';
        let dimensions = `
            <div>
                <span>Dimensions:</span>
                <pre>${data.width} × ${data.height} px</pre>
            </div>`;

        const folder = `/files/${hash.slice(0, 2)}/`;

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
                        <input type="text" class="form-control" id="file_title" value="${title ?? ''}">
                    </div>`;

            } else {

                altField = `
                <div class="pb-2">
                    <label for="file_alt" class="form-label">Image alt:</label>
                    <input type="text" class="form-control" id="file_alt" value="${alt ?? ''}">
                </div>`;

            }

        } else {

            filePath = folder + fileName;
            media = `<video src="${filePath}" controls></video>`;

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
                        <pre>${data.date_created}</pre>
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
                </div>
                <main>
                    ${altField}
                    <div class="pb-2">
                        <label for="file_description" class="form-label">Description:</label>
                        <textarea class="form-control" id="file_description" rows="3">${data.description ?? ''}</textarea>
                    </div>
                </main>
            </section>`;
    }

}

class FilesSelectionManager {
    constructor() {
        this.btnDelete = document.querySelector('.delete-btn');
        this.delNumber = this.btnDelete.querySelector('var');
        this.btnDeselect = document.querySelector('.deselect-btn');
        this.filesContainer = document.querySelector('.files');
        this.lastSelected = null;
        this.selectedItems = new Set();

        this.attachEventListeners();
    }

    attachEventListeners() {
        this.filesContainer.addEventListener('click', this.onFileClick.bind(this));
        this.filesContainer.addEventListener('dblclick', this.onFileDoubleClick.bind(this));
        this.btnDeselect.addEventListener('click', this.deselectAll.bind(this));
        this.btnDelete.addEventListener('click', this.deleteSelected.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    onFileClick(event) {

        if (!event.target.classList.contains('file')) return;

        const isModifierPressed = event.ctrlKey || event.metaKey;
        const isShiftPressed = event.shiftKey;
        const clickedItem = event.target;

        if (isShiftPressed && this.lastSelected) {
            let inRange = false;
            for (const item of this.filesContainer.querySelectorAll('.file')) {
                if (item === this.lastSelected || item === clickedItem) {
                    inRange = !inRange;
                    item.classList.add('selected');
                    this.selectedItems.add(item);
                }

                if (inRange) {
                    item.classList.add('selected');
                    this.selectedItems.add(item);
                }
            }
        } else if (isModifierPressed) {
            clickedItem.classList.toggle('selected');
            if (clickedItem.classList.contains('selected')) {
                this.selectedItems.add(clickedItem);
            } else {
                this.selectedItems.delete(clickedItem);
            }
        } else {
            this.selectedItems.forEach(item => item.classList.remove('selected'));
            this.selectedItems.clear();
            clickedItem.classList.add('selected');
            this.selectedItems.add(clickedItem);
        }

        this.lastSelected = clickedItem;
        if (this.selectedItems.size > 0) {
            this.showControlButtons();
        } else {
            this.hideControlButtons();
        }

    }

    onFileDoubleClick(event) {
        if (!event.target.classList.contains('file')) return;
        fileDetailsModal.open(event.target.dataset.id);
    }

    deselectAll() {
        this.selectedItems.forEach(item => item.classList.remove('selected'));
        this.selectedItems.clear();
        this.hideControlButtons();
    }

    deleteSelected() {
        this.btnDelete.setAttribute('disabled', '');

        const ids = [];
        this.selectedItems.forEach(item => ids.push(item.dataset.id));

        fetch('/api/files', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ids)
        })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    location.reload();
                } else {
                    console.error(res.message);
                }
            })
            .catch(err => console.error(err));
    }

    showControlButtons() {
        this.delNumber.innerText = this.selectedItems.size;
        this.btnDelete.removeAttribute('hidden');
        this.btnDeselect.removeAttribute('hidden');
    }

    hideControlButtons() {
        this.btnDelete.setAttribute('hidden', '');
        this.btnDeselect.setAttribute('hidden', '');
    }

    onKeyDown(event) {
        if (event.key == 'Delete') this.deleteSelected();
        if (event.key == 'Escape') this.deselectAll();
        if (event.key == 'a' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.filesContainer.querySelectorAll('.file').forEach(item => {
                item.classList.add('selected');
                this.selectedItems.add(item);
            });
            this.showControlButtons();
        }
    }
}

const fileDetailsModal = new FileDetailsModal();

function initFiles() {
    detectProcessingFiles();
    new FilesSelectionManager();
}

function open(id) {
    console.log(`Opening`, id);

}

function addFile(file) {

    const filesContainer = document.querySelector('.files');
    const { _id, type } = file;

    const html = `
        <div class="file" data-id="${_id}" data-type="${type}">
            <div class="spinner"></div>
        </div>`;

    filesContainer.insertAdjacentHTML('afterbegin', html);

}

function checkState(id) {

    const fileElement = document.querySelector(`.file[data-id="${id}"]`);

    const interval = setInterval(() => {
        fetch(`/api/files/${id}`)
            .then(res => res.json())
            .then(file => {
                if (file.status == 'optimized') {
                    clearInterval(interval);
                    addFilePreview(fileElement, file);
                }
            })
            .catch(err => console.error(err));
    }, 2000);

}

function addFilePreview(targetElement, file) {

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

function detectProcessingFiles() {

    const files = document.querySelectorAll('.file');

    files.forEach(file => {
        if (file.querySelector('.spinner')) {
            checkState(file.dataset.id);
        }
    });

}


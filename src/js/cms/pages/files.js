import FileDetails from '../../functions/file-details';

const fileDetails = new FileDetails();

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

        const wrapper = event.target.closest('.file');
        if (!wrapper) return;

        const isModifierPressed = event.ctrlKey || event.metaKey;
        const isShiftPressed = event.shiftKey;
        const clickedItem = wrapper;

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
        const wrapper = event.target.closest('.file');
        if (!wrapper) return;
        fileDetails.open(wrapper.dataset.id);
    }

    selectAll(event) {

        if (fileDetails.opened) return;

        event.preventDefault();
        this.filesContainer.querySelectorAll('.file').forEach(item => {
            item.classList.add('selected');
            this.selectedItems.add(item);
        });
        this.showControlButtons();

    }

    deselectAll() {
        this.selectedItems.forEach(item => item.classList.remove('selected'));
        this.selectedItems.clear();
        this.hideControlButtons();
    }

    deleteSelected() {

        if (fileDetails.opened) return;

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
        if (event.key == 'a' && (event.ctrlKey || event.metaKey)) this.selectAll(event);
    }
}

export default function () {

    initFilesUpload();
    document.addEventListener('DOMContentLoaded', initFiles);

}

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

function initFiles() {
    detectProcessingFiles();
    new FilesSelectionManager();
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

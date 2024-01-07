initFilesUpload();
document.addEventListener('DOMContentLoaded', initFilesSelection);

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
                        location.reload();
                    } else {
                        console.error(res.message);
                    }
                })
                .catch(err => console.error(err));
        }

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
        open(event.target.dataset.id);
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

function initFilesSelection() {
    new FilesSelectionManager();
}

function open(id) {
    console.log(`Opening`, id);
}
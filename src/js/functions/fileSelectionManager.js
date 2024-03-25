import FileDetails from "../components/file-details";

const fileDetails = new FileDetails();

class FilesSelectionManager {
    constructor({token, parent}) {
        this.token = token;
        this.btnDelete = parent.querySelector('.delete-btn');
        this.delNumber = this.btnDelete.querySelector('var');
        this.btnDeselect = parent.querySelector('.deselect-btn');
        this.filesContainer = parent.querySelector('.files');
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
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.token
            },
            body: JSON.stringify(ids)
        })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    const deletedFiles = res.deletedFiles;
                    
                    deletedFiles.forEach(fileId => {
                        this.filesContainer.querySelector(`[data-id="${fileId}"]`).remove();
                    })
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

export default FilesSelectionManager;
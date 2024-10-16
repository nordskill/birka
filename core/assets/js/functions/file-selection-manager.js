import FileDetails from '../components/file-details.js';

class FilesSelectionManager {

    constructor({token, parent, single}) {
        this.token = token;
        this.parent = parent;
        this.single = single;
        this.btnDelete = parent.querySelector('.delete-btn');
        this.delNumber = this.btnDelete.querySelector('var');
        this.btnDeselect = parent.querySelector('.deselect-btn');
        this.filesContainer = parent.querySelector('.files');
        this.lastSelected = null;
        this.selectedItems = new Set();

        this.fileDetails = new FileDetails({ token });

        this.attachEventListeners();
    }

    attachEventListeners = () => {
        this.filesContainer.addEventListener('click', this.onFileClick.bind(this));
        this.filesContainer.addEventListener('dblclick', this.onFileDoubleClick.bind(this));
        this.btnDeselect.addEventListener('click', this.deselectAll.bind(this));
        this.btnDelete.addEventListener('click', this.deleteSelected.bind(this));
        this.parent.querySelector('.file-types')?.addEventListener('click', this.handleFilterchange.bind(this));

        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    handleFilterchange(e) {
        if (e.target.closest('button')) {
            this.selectedItems.clear();
            this.dispatchFileSelectionUpdate();
        }
    }

    onFileClick(event) {

        const wrapper = event.target.closest('.file');
        if (!wrapper) return;

        const isModifierPressed = event.ctrlKey || event.metaKey;
        const isShiftPressed = event.shiftKey;
        const clickedItem = wrapper;

        if (isShiftPressed && this.lastSelected && !this.single) {
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
        } else if (isModifierPressed && !this.single) {
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

        this.dispatchFileSelectionUpdate();

    }

    onFileDoubleClick(event) {
        const wrapper = event.target.closest('.file');
        if (!wrapper) return;
        this.fileDetails.open(wrapper.dataset.id);
    }

    selectAll(event) {

        if (this.fileDetails.opened) return;

        event.preventDefault();
        if (this.single) return;

        this.filesContainer.querySelectorAll('.file').forEach(item => {
            item.classList.add('selected');
            this.selectedItems.add(item);
        });
        this.showControlButtons();
        this.dispatchFileSelectionUpdate();

    }

    deselectAll() {
        this.selectedItems.forEach(item => item.classList.remove('selected'));
        this.selectedItems.clear();
        this.hideControlButtons();
        this.dispatchFileSelectionUpdate();
    }

    deleteSelected() {

        if (this.fileDetails.opened) return;

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
                    this.selectedItems.clear();

                    deletedFiles.forEach(fileId => {
                        const deletedFile = this.filesContainer.querySelector(`[data-id="${fileId}"]`)
                        const fileType = deletedFile.dataset.type;

                        decrementFileAmount(`button.${fileType}s-btn span`);
                        decrementFileAmount('button.all_files_btn span');
                        this.hideControlButtons();

                        this.btnDelete.removeAttribute('disabled');
                        deletedFile.remove();
                    });

                    this.dispatchFileSelectionUpdate();

                } else {
                    console.error(res.message);
                }
            })
            .catch(err => console.error(err));

            function decrementFileAmount(selector) {
                const filter = document.querySelector(selector);
                const oldValue = +filter.innerHTML;
                filter.innerHTML = oldValue - 1;
            }
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

    // Method to dispatch the custom event
    dispatchFileSelectionUpdate = () => {
        const event = new CustomEvent('file-selection:update', {
            detail: [...this.selectedItems]
        });
        document.dispatchEvent(event);
    }
}

export default FilesSelectionManager;
class AJAXTable {
    constructor(element, dropdownOptions, csrfToken) {
        this.element = element;
        this.dropdownOptions = dropdownOptions;
        this.token = csrfToken;
        this._attachEventListeners();
    }

    _attachEventListeners() {
        // Delegated event listener for all actions within the element
        this.element.addEventListener('click', (e) => {

            const row = e.target.closest('tr');
            if (!row) return;

            if (e.target.closest('.edit_item')) {
                this._edit_row(row);
            } else if (e.target.closest('.delete_item')) {
                this._delete_row(row);
            } else if (e.target.closest('.cancel_item_edit')) {
                this._cancel_edit(row);
            } else if (e.target.closest('.save_item_edit')) {
                this._save_edit(row);
            }

        });
    }

    _edit_row(row) {
        const id = row.dataset.id;

        row.classList.add('table-active');

        // Toggle buttons visibility
        row.querySelector('.edit_item').style.display = 'none';
        row.querySelector('.save_item_edit').style.display = 'inline-block';
        row.querySelector('.cancel_item_edit').style.display = 'inline-block';

        // Transform cells into editable state
        Array.from(row.cells).forEach((cell, index) => {
            if (index === 0 || index === row.cells.length - 1) { // Skip the checkbox and the action buttons
                return;
            }

            const dataField = cell.getAttribute('data-field');
            const originalContent = cell.innerHTML.trim();
            const isLink = originalContent.includes('href');

            cell.setAttribute('data-original-content', originalContent);

            if (dataField && this.dropdownOptions[dataField]) {
                const select = document.createElement('select');
                select.className = 'form-select';
                select.innerHTML = this.dropdownOptions[dataField].map(option =>
                    `<option value="${option.value}" ${originalContent.includes(option.label) ? 'selected' : ''}>${option.label}</option>`
                ).join('');
                cell.innerHTML = '';
                cell.appendChild(select);
            } else {
                const value = isLink ? cell.querySelector('a').getAttribute('href') : originalContent;
                cell.innerHTML = '';
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control form-control-sm';
                input.value = value.replace(/"/g, '&quot;');
                input.placeholder = dataField || '';
                cell.appendChild(input);
            }
        });

    }

    _save_edit(row) {
        const id = row.dataset.id;

    }

    _cancel_edit(row) {
        row.classList.remove('table-active');

        // Toggle buttons visibility
        row.querySelector('.edit_item').style.display = 'inline-block';
        row.querySelector('.save_item_edit').style.display = 'none';
        row.querySelector('.cancel_item_edit').style.display = 'none';

        // Revert cells to original state
        Array.from(row.cells).forEach((cell, index) => {
            if (index === 0 || index === row.cells.length - 1) { // Skip the checkbox and the action buttons
                return;
            }

            // Revert the cell to its original content
            const originalContent = cell.getAttribute('data-original-content');
            cell.innerHTML = originalContent;
        });
    }

    async _delete_row(row) {
        const id = row.dataset.id;

        const response = await fetch(`/menus/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.token
            },
            credentials: 'include'
        });

        if (!response.ok) {
            console.error('Error deleting item:', response.statusText);
            return;
        }

        row.remove();

    }

}

export default AJAXTable;
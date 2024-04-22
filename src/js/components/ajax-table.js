class AJAXTable {
    constructor(element, fieldsList, dropdownOptions, csrfToken) {
        this.element = element;
        this.table = element.querySelector('table');
        this.btnAddItem = element.querySelector('.add_item');
        this.fieldsList = fieldsList;
        this.dropdownOptions = dropdownOptions;
        this.token = csrfToken;
        this._attachEventListeners();

        this.btnAddItem.addEventListener('click', this.add_row);
    }

    add_row = () => {

        const row = this.table.insertRow();
        row.className = 'new_row';
        row.insertCell().innerHTML = '<input class="form-check-input" type="checkbox">';
        
        this.fieldsList.forEach(field => {
            const cell = row.insertCell();
            cell.dataset.field = field;
        });
        
        row.insertCell().innerHTML = `
            <button class="btn btn-link btn-sm edit_item">
                <svg class="icon">
                <use xlink:href="#pencil"></use>
                </svg>
            </button>
            <button class="btn btn-link btn-sm save_item_edit">
                <svg class="icon">
                <use xlink:href="#check"></use>
                </svg>
            </button>
            <button class="btn btn-link btn-sm cancel_item_edit">
                <svg class="icon">
                <use xlink:href="#cancel"></use>
                </svg>
            </button>
            <button class="btn btn-link btn-sm delete_item">
                <svg class="icon">
                <use xlink:href="#trash"></use>
                </svg>
            </button>`;


        this._edit_row(row);
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

            if (dataField && this.dropdownOptions?.[dataField]) {
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
                input.name = dataField;
                input.className = 'form-control form-control-sm';
                input.value = value.replace(/"/g, '&quot;');
                input.placeholder = dataField || '';
                cell.appendChild(input);
            }
        });

        const editEvent = new CustomEvent('ajaxtable:row-edit', { detail: { row } });
        this.element.dispatchEvent(editEvent);

    }

    async _save_edit(row) {

        const id = row.dataset.id;
        const url = this.element.dataset.endpoint + (id ? '/' + id : '');
        const method = id ? 'PATCH' : 'POST';

        const data = Array.from(row.cells).reduce((acc, cell, index) => {
            if (index === 0 || index === row.cells.length - 1) { // Skip the checkbox and the action buttons
                return acc;
            }

            const input = cell.querySelector('input, select');
            const key = input.name || cell.getAttribute('data-field');
            const value = input.value;

            acc[key] = value;
            return acc;
        }, {});

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.token
            },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            console.error('Error saving item:', response.statusText);
            return;
        }

        const savedItem = await response.json();
        console.log(savedItem);
        row.classList.remove('new_row', 'table-active');
        row.dataset.id = savedItem._id;

        // Toggle buttons visibility
        row.querySelector('.edit_item').style.display = 'inline-block';
        row.querySelector('.save_item_edit').style.display = 'none';
        row.querySelector('.cancel_item_edit').style.display = 'none';

        // add data from the savedItem to the corresponding cells
        Array.from(row.cells).forEach((cell, index) => {
            if (index === 0 || index === row.cells.length - 1) { // Skip the checkbox and the action buttons
                return;
            }

            const dataField = cell.getAttribute('data-field');
            const value = savedItem[dataField] !== undefined ? savedItem[dataField] + '' : '';
            const isLink = value.includes('http') || dataField === 'url';

            if (dataField && this.dropdownOptions?.[dataField]) {
                cell.innerHTML = this.dropdownOptions[dataField].find(option => option.value === value).value;
            } else {
                cell.innerHTML = isLink ? `<a href="${value}">${value}</a>` : value;
            }
        });
        
    }

    _cancel_edit(row) {

        if (row.classList.contains('new_row')) {
            row.remove();
            return;
        }

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

        if (row.classList.contains('new_row')) {
            row.remove();
            return;
        }

        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }

        const id = row.dataset.id;
        const url = this.element.dataset.endpoint + '/' + id;

        const response = await fetch(url, {
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
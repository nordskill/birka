const csrfToken = document.head.querySelector('meta[name="csrf"]').content;

export default async function () {

    const createMenuBtn = document.getElementById('create_menu');
    const deleteMenuBtn = document.getElementById('delete_menu');

    const table = document.querySelector('.table');
    const tableBody = table.querySelector('tbody');

    let checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');

    createMenuBtn.onclick = createMenu;
    deleteMenuBtn.onclick = deleteMenu;

    assignCheckboxListeners();
    tableBody.addEventListener('DOMNodeInserted', assignCheckboxListeners);

    function assignCheckboxListeners() {
        checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.onchange = toggleDeleteMenuBtn);
    }

    function toggleDeleteMenuBtn() {
        const checked = [...checkboxes].some(checkbox => checkbox.checked);
        deleteMenuBtn.style.display = checked ? 'inline-block' : 'none';
    }

    async function deleteMenu() {
        if (!confirm('Are you sure you want to delete the selected menus?')) {
            return;
        }

        const checked = [...checkboxes].filter(checkbox => checkbox.checked);
        const ids = checked.map(checkbox => checkbox.closest('tr').dataset.id);

        const promises = ids.map(id => fetch(`/api/menus/${id}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-Token': csrfToken
            }
        }));
        const responses = await Promise.all(promises);

        responses.forEach(async (response, index) => {
            if (response.ok) {
                const id = ids[index];
                const row = tableBody.querySelector(`tr[data-id="${id}"]`);
                row.remove();
            } else {
                const data = await response.json();
                alert(data.message);
            }
        });

        this.style.display = 'none';
        checkboxes.forEach(checkbox => checkbox.checked = false);

    }

}

async function createMenu() {

    // prompt window to ask for menu name
    const menuName = prompt('Enter the menu name:');

    const resp = await fetch('/api/menus/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ name: menuName })
    });

    const data = await resp.json();

    if (!resp.ok) {
        alert(data.message);
        return;
    }

    addTableRow(data);

}

function addTableRow(data) {

    const table = document.querySelector('.table');
    const tableBody = table.querySelector('tbody');

    const row = `
        <tr data-id="${data._id}">
            <td><input class="form-check-input" type="checkbox" aria-label="select row"></td>
            <td><a href="/cms/menus/${data._id}">${data.name}</a></td>
        </tr>`;

    tableBody.insertAdjacentHTML('beforeend', row);
}
export default async function () {

    const btnCreate = document.querySelector('#create_custom_item');
    const btnDelete = document.querySelector('#delete_custom_items');

    const model = JSON.parse(document.querySelector('main[data-model]').dataset.model);
    const token = document.querySelector('meta[name="csrf"]').content;

    const table = document.querySelector('#custom_model_items');
    const tableBody = table.querySelector('tbody');
    
    let checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');

    assignCheckboxListeners();
    tableBody.addEventListener('DOMNodeInserted', assignCheckboxListeners);

    btnCreate.onclick = async () => {
        const title = prompt('Enter title (can be changed later):', 'Title');
        if (!title) return;
        const item = await createItem(model.modelName, title, token);
        window.location.href = `/cms/custom/${model.slug}/${item.data._id}`;
    };

    btnDelete.onclick = async () => {
        const marked = tableBody.querySelectorAll('input[type="checkbox"]:checked');
        const ids = Array.from(marked).map(checkbox => checkbox.closest('tr').dataset.id);
        deleteItems(model.modelName, ids, token, tableBody);
    };

    function assignCheckboxListeners() {
        checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.onchange = toggleDeleteMenuBtn);
    }

    function toggleDeleteMenuBtn() {
        const checked = [...checkboxes].some(checkbox => checkbox.checked);
        btnDelete.style.display = checked ? 'inline-block' : 'none';
    }

    async function createItem(modelName, title, token) {

        const response = await fetch(`/api/custom/${modelName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': token
            },
            body: JSON.stringify({ title })
        });
    
        let json;
    
        try {
            json = await response.json();
        } catch (error) {
            console.log('Response is not avalid JSON.');
        }
    
        if (!response.ok) {
            if (json) console.log(json);
            throw new Error('Failed to create item');
        }
    
        return json;
    
    }

    async function deleteItems(modelName, ids, token) {

        if (!confirm('Are you sure you want to delete the selected items?')) {
            return;
        }
    
        const promises = ids.map(id => fetch(`/api/custom/${modelName}/${id}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-Token': token
            }
        }));
    
        const responses = await Promise.all(promises);
    
        responses.forEach(async (response, index) => {
            if (response.ok) {
                const id = ids[index];
                const row = tableBody.querySelector(`tr[data-id="${id}"]`);
                row.remove();
                btnDelete.style.display = 'none';
            } else {
                const data = await response.json();
                alert(data.message);
            }
        });
    
    }
    

}
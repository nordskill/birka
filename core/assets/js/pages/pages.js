const slugify = require('../../../functions/slugify');

const csrfToken = document.head.querySelector('meta[name="csrf"]').content;



export default async function () {

    const table = document.querySelector('table[name="pages"]');
    const tableBody = table.querySelector('tbody');
    const addPageButton = document.querySelector('#add_page');
    const deletePageButton = document.querySelector('#delete_page');

    let checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');

    addPageButton.onclick = addNewPage;
    deletePageButton.onclick = deletePage;

    assignCheckboxListeners();
    tableBody.addEventListener('DOMNodeInserted', assignCheckboxListeners);

    function assignCheckboxListeners() {
        checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.onchange = toggleDeleteMenuBtn);
    }

    function toggleDeleteMenuBtn() {
        const checked = [...checkboxes].some(checkbox => checkbox.checked);
        deletePageButton.style.display = checked ? 'inline-block' : 'none';
    }

    async function addNewPage() {

        const type = document.querySelector('#page_submodels').value;
        const pageName = prompt('Enter the page name:');
    
        if (!pageName) {
            return;
        }
    
        const pageData = {
            type,
            name: pageName,
            slug: slugify(pageName)
        };
    
        const resp = await fetch('/api/pages/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify(pageData)
        });
    
        const data = await resp.json();
    
        if (data.success) {
            window.location.href = `pages/${data.page._id}`;
        }
    
        if (!resp.ok) {
            alert(data.message);
            return;
        }
    
    }
    
    async function deletePage() {
    
        const checked = [...checkboxes].filter(checkbox => checkbox.checked);
        const ids = checked.map(checkbox => checkbox.closest('tr').dataset.id);
    
        const promises = ids.map(id => fetch(`/api/pages/${id}`, {
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


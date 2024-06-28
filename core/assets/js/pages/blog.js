export default async function () {

   const csrfToken = document.head.querySelector('meta[name="csrf"]').content;

   const table = document.querySelector('table[name="model_items"]');
   const tableBody = table.querySelector('tbody');
   const addItemButton = document.querySelector('#add_item');
   const deleteItemButton = document.querySelector('#delete_item');

   let checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');

   addItemButton.onclick = addNewItem;
   deleteItemButton.onclick = deleteItem;

   assignCheckboxListeners();
   tableBody.addEventListener('DOMNodeInserted', assignCheckboxListeners);

   function assignCheckboxListeners() {
      checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => checkbox.onchange = toggleDeleteMenuBtn);
   }

   function toggleDeleteMenuBtn() {
      const checked = [...checkboxes].some(checkbox => checkbox.checked);
      deleteItemButton.style.display = checked ? 'inline-block' : 'none';
   }

   async function addNewItem() {

      const data = {
         type: '',
         title: 'New Post Draft'
      };

      const resp = await fetch('/api/blog/', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
         },
         body: JSON.stringify(data)
      });

      const responseData = await resp.json();

      if (responseData.success) {
         window.location.href = `blog/${responseData.data._id}`;
      }

      if (!resp.ok) {
         alert(responseData.message);
         return;
      }

   }

   async function deleteItem() {

      const checked = [...checkboxes].filter(checkbox => checkbox.checked);
      const ids = checked.map(checkbox => checkbox.closest('tr').dataset.id);

      const promises = ids.map(id => fetch(`/api/blog/${id}`, {
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
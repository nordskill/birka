import BibeEditor from '../components/bibe-editor.js';
import FileCRUD from '../components/file-crud.js';
import TagsCRUD from '../components/tags-crud.js';
import CustomFields from '../components/custom-fields.js';
import Debouncer from '../functions/debouncer.js';
import slugify from '../../../functions/slugify.js';

const token = document.querySelector('meta[name="csrf"]').content;

export default async function () {

   const updateURL = document.querySelector('.post_editor').dataset.updateUrl;

   new FileCRUD('.file_crud_container .file_crud');
   new TagsCRUD('.tags_crud');
   new BibeEditor({
      container: '.post_editor',
      update_url: updateURL,
      files_api: '/api/files/',
      token,
      on_update: () => {
         const main = document.querySelector('main[data-id]');
         main.classList.add('changed');
      }
   });

   new CustomFields();
   updatePage();

}

function updatePage() {

   const fields = document.querySelector('#fields');
   const fieldsExtension = document.querySelector('#fields_extension');
   const customFields = document.querySelector('#custom_fields');

   const updateBtn = document.querySelector('#update_btn');
   const deleteBtn = document.querySelector('#delete_btn');

   const main = document.querySelector('main[data-id]');
   const docID = main.dataset.id;
   const modelType = main.dataset.type;

   // update slug on name change
   const titleField = fields.querySelector('[name="title"]');
   const slugField = fields.querySelector('[name="slug"]');
   titleField.addEventListener('input', () => {
      slugField.value = slugify(titleField.value);
   });

   slugField.oninput = () => {
      slugField.value = slugField.value.replace(/[^a-z0-9\-_]/gi, '');
   }

   updateBtn.onclick = updateFields;
   deleteBtn.onclick = deletePost;

   initCustomFieldUpdates(customFields, docID);

   async function updateFields() {

      const data = {
         type: modelType,
         title: fields.querySelector('[name="title"]').value,
         slug: fields.querySelector('[name="slug"]').value,
         excerpt: fields.querySelector('[name="excerpt"]').value,
         published: fields.querySelector('[name="published"]').checked
      }

      // add extended fields
      fieldsExtension.querySelectorAll('[name]').forEach(field => {
         data[field.name] = field.value;
      });

      try {
         const response = await fetch(`/api/blog/${docID}/update`, {
            method: 'PATCH',
            headers: {
               'Content-Type': 'application/json',
               'X-CSRF-Token': token
            },
            body: JSON.stringify(data)
         });

         if (response.ok) {
            console.log(await response.json());

            const main = document.querySelector('main[data-id]');
            main.classList.remove('changed');

            alert('Page updated successfully');
         } else {
            alert('Failed to update post');
         }

      } catch (error) {
         console.error(error);
      }

   }

   async function deletePost() {

      if (!confirm('Are you sure you want to delete this post?')) return;

      try {
         const response = await fetch(`/api/blog/${docID}`, {
            method: 'DELETE',
            headers: {
               'Content-Type': 'application/json',
               'X-CSRF-Token': token
            }
         });

         if (response.ok) {
            window.location.href = '/cms/blog';
         } else {
            alert('Failed to delete post');
         }

      } catch (error) {
         console.error(error);
      }
   }

}

function initCustomFieldUpdates(customFields, docID) {

   const customFieldInputs = [...customFields.querySelectorAll('[name]')];
   customFieldInputs.forEach(field => {

      new Debouncer({
         field_element: field,
         endpoint: `/api/blog/${docID}`,
         method: 'PATCH',
         token,
         success_callback: onSuccess,
         error_callback: onError,
         input_callback: onInput
      });

      function onSuccess(fieldElem) {
         fieldElem.classList.add('is-valid');
      };

      function onError(fieldElem, message) {
         fieldElem.classList.add('is-invalid');
         let invalidFeedback = fieldElem.parentElement.querySelector('.invalid-feedback');

         //  if no then create one
         if (!invalidFeedback) {
            invalidFeedback = document.createElement('div');
            invalidFeedback.classList.add('invalid-feedback');
            fieldElem.parentElement.appendChild(invalidFeedback);
         }

         invalidFeedback.style.display = 'block';
         invalidFeedback.textContent = message;
      };

      function onInput(fieldElem) {
         fieldElem.classList.remove('is-valid', 'is-invalid');
         const invalidFeedback = fieldElem.parentElement.querySelector('.invalid-feedback');
         if (!invalidFeedback) return;
         invalidFeedback.style.display = 'none';
      };

   });

}
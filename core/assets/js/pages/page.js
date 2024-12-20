import BibeEditor from '../components/bibe-editor.js';
import FileCRUD from '../components/file-crud.js';
import TagsCRUD from '../components/tags-crud.js';
import CustomFields from '../components/custom-fields.js';
import Debouncer from '../functions/debouncer.js';
import initSchemaOrgMapper from '../../../utils/schema-org-mapper.js';
import slugify from '../../../functions/slugify.js';

const csrfToken = document.head.querySelector('meta[name="csrf"]').content;

export default async function () {

    const main = document.querySelector('main[data-page-id]');

    new BibeEditor({
        container: '.editor',
        update_url: document.querySelector('.editor').dataset.updateUrl,
        token: csrfToken
    });

    new CustomFields();
    updatePage();

    const pageModel = JSON.parse(main.dataset.model);
    const pageData = JSON.parse(main.dataset.data);

    initSchemaOrgMapper('#json_ld', pageModel, pageData, {
        field: 'seo.jsonld_template',
        endpoint: `/api/pages/${main.dataset.pageId}`,
        method: 'PATCH',
        token: csrfToken
    });

    const page = document.querySelector('#meta_preview');
    let preview;

    try {
        preview = JSON.parse(page.dataset.img);
    } catch (error) {
        preview = '';
    }

    new FileCRUD({
        container: '#meta_preview',
        files_api: '/api/files/',
        endpoint: '/api/pages/' + page.dataset.id,
        field_name: 'img_preview',
        file: preview,
        size: 300,
        token: csrfToken
    });

    new TagsCRUD('.tags_crud');

    if (!document.querySelector('.post_editor')) return;
    new BibeEditor({
        container: '.post_editor'
    });

}

function updatePage() {

    const pageFields = document.querySelector('#page_fields');
    const fieldsExtension = document.querySelector('#fields_extension');
    const customFields = document.querySelector('#custom_fields');

    const updateBtn = document.querySelector('#update_btn');
    const deleteBtn = document.querySelector('#delete_btn');

    const pageID = document.querySelector('[data-page-id]').dataset.pageId;
    const pageType = document.querySelector('[data-page-type]').dataset.pageType;

    // update slug on name change
    const nameField = pageFields.querySelector('[name="name"]');
    const slugField = pageFields.querySelector('[name="slug"]');
    nameField.addEventListener('input', () => {
        slugField.value = slugify(nameField.value);
    });

    slugField.oninput = () => {
        slugField.value = slugField.value.replace(/[^a-z0-9\-_]/gi, '');
    }

    updateBtn.onclick = updateFields;
    deleteBtn.onclick = deletePage;

    initCustomFieldUpdates(customFields, pageID);

    async function updateFields() {

        const data = {
            type: pageType,
            name: pageFields.querySelector('[name="name"]').value,
            slug: pageFields.querySelector('[name="slug"]').value,
            excerpt: pageFields.querySelector('[name="excerpt"]').value,
            published: pageFields.querySelector('[name="published"]').checked,
            template: pageFields.querySelector('[name="template"]').value,
            is_home: pageFields.querySelector('[name="is_home"]').checked,
            author: pageFields.querySelector('[name="author"]').value,
        }

        // add extended fields
        fieldsExtension.querySelectorAll('[name]').forEach(field => {
            data[field.name] = field.value;
        });

        try {
            const response = await fetch(`/api/pages/${pageID}/update`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                console.log(await response.json());

                alert('Page updated successfully');
            } else {
                alert('Failed to update page');
            }

        } catch (error) {
            console.error(error);
        }

    }

    async function deletePage() {

        if (!confirm('Are you sure you want to delete this page?')) return;

        try {
            const response = await fetch(`/api/pages/${pageID}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                }
            });

            if (response.ok) {
                window.location.href = '/cms/pages';
            } else {
                alert('Failed to delete page');
            }

        } catch (error) {
            console.error(error);
        }
    }

}

function initCustomFieldUpdates(customFields, pageID) {

    const customFieldInputs = [...customFields.querySelectorAll('[name]')];
    customFieldInputs.forEach(field => {

        new Debouncer({
            field_element: field,
            endpoint: `/api/pages/${pageID}`,
            method: 'PATCH',
            token: csrfToken,
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
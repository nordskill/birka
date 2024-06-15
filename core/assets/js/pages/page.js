import BibeEditor from '../components/bibe-editor';
import FileCRUD from '../components/file-crud';
import TagsCRUD from "../components/tags-crud";
const slugify = require('../../../functions/slugify');

const csrfToken = document.head.querySelector('meta[name="csrf"]').content;

export default async function () {

    updatePage();

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
        size: 300
    });

    new TagsCRUD('.tags_crud');

    if (!document.querySelector('.post_editor')) return;
    new BibeEditor({
        container: '.post_editor'
    });

}

function updatePage() {

    const pageFields = document.querySelector('#page_fields');
    const pageCustomFields = document.querySelector('#page_custom_fields');

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

        // add custom fields
        pageCustomFields.querySelectorAll('[name]').forEach(field => {
            data[field.name] = field.value;
        });

        console.log(data);

        try {
            const response = await fetch(`/api/pages/${pageID}`, {
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

}
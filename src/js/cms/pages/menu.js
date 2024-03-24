import AJAXTable from '../../components/ajax-table.js';

export default async function () {

    const dropdownOptions = {
        'entity_type': [
            {
                value: 'page',
                label: 'Page'
            },
            {
                value: 'blog-post',
                label: 'Blog Post'
            },
            {
                value: 'product',
                label: 'Product'
            }
        ],
        'target': [
            {
                value: '_self',
                label: 'current tab'
            },
            {
                value: '_blank',
                label: 'new tab'
            }
        ]
    };

    const csrfToken = document.head.querySelector('meta[name="csrf"]').content;
    

    const ajaxTables = document.querySelectorAll('.ajax_table');
    [...ajaxTables].map(element => new AJAXTable(element, dropdownOptions, csrfToken));

}
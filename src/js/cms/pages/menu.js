import AJAXTable from '../../components/ajax-table.js';
import SmartSearch from '../../functions/smart-search.js';

const csrfToken = document.head.querySelector('meta[name="csrf"]').content;

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

    const fieldsList = [ 'entity_type', 'name', 'url', 'target', 'title' ];

    const ajaxTables = document.querySelectorAll('.ajax_table');
    [...ajaxTables].map(element => {
        const ajaxTable = new AJAXTable(element, fieldsList, dropdownOptions, csrfToken);
        ajaxTable.element.addEventListener('ajaxtable:row-edit', initSmartSearch);
    });

}

function initSmartSearch(ev) {
    const row = ev.detail.row;
    const url = row.querySelector('[data-field="url"] input');
    const title = row.querySelector('[data-field="title"] input');
    const dataTypeSelect = row.querySelector('[data-field="entity_type"] .form-select');
    const searchField = row.querySelector('[data-field="name"] input');

    assignURL();

    const smartSearch = new SmartSearch(searchField, csrfToken);

    dataTypeSelect.onchange = () => {
        assignURL();
        smartSearch.update();
        smartSearch.init_search();
    };

    document.addEventListener('smartsearch:pick', (ev) => {
        const page = ev.detail;
        searchField.value = page.name;
        url.value = '/' + page.slug;
        title.value = page.excerpt.substring(0, 100);
    });

    async function assignURL() {
        const dataType = dataTypeSelect.value;
        searchField.dataset.search = `/api/${dataType}s/search`;
    }
}

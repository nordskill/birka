import AJAXTable from '../components/ajax-table.js';

const csrfToken = document.head.querySelector('meta[name="csrf"]').content;

export default async function () {

    const fieldsList = [ 'name', 'slug', 'used' ];

    const ajaxTables = document.querySelectorAll('.ajax_table');
    [...ajaxTables].map(element => {
        new AJAXTable(element, fieldsList, null, csrfToken);
    });

}

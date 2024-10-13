import FileManager from '../components/file-manager.js';

const csrfToken = document.querySelector('meta[name="csrf"]').content;
const template = document.querySelector('meta[name="template"]').content;

export default function() {

    if (template === 'cms_files') {
        new FileManager({
            token: csrfToken,
            target: 'main div.files_main_container'
        });
    }

}

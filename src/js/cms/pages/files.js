import FileManager from '../../components/file-manager';

const csrfToken = document.querySelector('meta[name="csrf"]').content;
const template = document.querySelector('meta[name="template"]').content;

if (template === 'cms_files') {
    console.log('files')
    new FileManager({
        token: csrfToken,
        target: 'main div.files_main_container'
    });
}

import FileManager from '../../components/file-manager';

const csrfToken = document.querySelector('meta[name="csrf"]').content;

new FileManager({
    token: csrfToken,
    target: 'main div.files_main_container'
});

import FileManager from "./file-manager";

const csrfToken = document.querySelector('meta[name="csrf"]').content;

class FilePicker {
    constructor() {
        this._generateTemplate();

        this.modal = document.querySelector('.file_picker')
        this.win = this.modal.querySelector('.win')
        this.selectBtn = this.win.querySelector('.select-btn');
        this.cancelBtn = this.win.querySelector('.cancel-btn');

        this.cancelBtn.onclick = this.close.bind(this);
    }

    open() {
        new FileManager({
            token: csrfToken,
            target: '.win div',
            destination: 'picker'
        })

        this.files = document.querySelector('.files');
        this.modal.removeAttribute('hidden');
    }

    close() {
        this.modal.setAttribute('hidden', '');
        this.win.querySelector('div').innerHTML = '';
    }

    async select() {

    }

    _generateTemplate() {
        let html = `
            <div class="file_picker" hidden>
                <div class="win rounded">
                    <div>

                    </div>
                    <div class="bg-secondary-subtle d-flex justify-content-end p-3 rounded-bottom">
                        <button class="btn btn-primary me-2 select-btn" >Select files</button>
                        <button class="btn btn-danger cancel-btn" >Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    _generateContent(res) {
        let html = '';

        res.forEach(file => {

            let fileMarkup;

            if (file.type === 'image') {
                if (file.status === 'processing') {
                    fileMarkup = '<div class="spinner"></div>';
                } else {
                    let path = `/files/${file.hash.slice(0, 2)}/300/${file.file_name}.${file.optimized_format}`
                    fileMarkup = `<img src=${path} alt="${file.alt}">`
                }
            } else if (file.type === 'video') {
                fileMarkup = `
                    <svg viewBox="0 0 32 24">
                        <g>
                            <path d="M13.58 6.186a1 1 0 0 0-1.58.811v10a1 1 0 0 0 1.58.814l7-5a1 1 0 0 0 0-1.628Z"></path>
                            <path d="M0 4a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4Zm30 0a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2Z"></path>
                        </g>
                    </svg>
                `
            }

            html += `
                <div class="file" data-id="${file._id}" data-type="${file.type}">
                    ${fileMarkup}
                </div>
            `;
        })

        return html;
    }
}

export default FilePicker;
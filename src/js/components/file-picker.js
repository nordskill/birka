import FileManager from "./file-manager";

const csrfToken = document.querySelector('meta[name="csrf"]').content;

class FilePicker {
    constructor() {
        this._generate_template();

        this.modal = document.querySelector('.file_picker')
        this.win = this.modal.querySelector('.win')
        this.selectBtn = this.win.querySelector('.select-btn');
        this.cancelBtn = this.win.querySelector('.cancel-btn');

        this.cancelBtn.onclick = this.close;
        this.selectBtn.onclick = this.select;
    }

    open = () => {
        this.fileManager = new FileManager({
            token: csrfToken,
            target: '.win div',
            destination: 'picker'
        })

        this.files = document.querySelector('.files');
        this.modal.removeAttribute('hidden');
    }

    close = () => {
        this.modal.setAttribute('hidden', '');
        this.win.querySelector('div').innerHTML = '';
    }

    select = async () =>  {
        this.close();
        return this.fileManager.selected;
    }

    _generate_template() {
        let html = `
            <div class="file_picker" hidden>
                <div class="win rounded">
                    <div>

                    </div>
                    <div class="bg-secondary-subtle d-flex justify-content-end p-3 rounded-bottom">
                        <button class="btn btn-primary me-2 select-btn" disabled>Select files</button>
                        <button class="btn btn-danger cancel-btn" >Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    }
}

export default FilePicker;
const csrfToken = document.querySelector('meta[name="csrf"]').content;

class FilePicker {
    constructor() {
        this.modal = document.createElement('div');
        this.modal.className = 'file_picker';
        this.modal.setAttribute('hidden', '');
        this.win = document.createElement('div');
        this.win.className = 'win rounded';
        this.modal.appendChild(this.win);
        document.body.appendChild(this.modal);

        this._generateTemplate();
        this.files = this.win.querySelector('.files');
        this.selectBtn = this.win.querySelector('.select-btn');
        this.cancelBtn = this.win.querySelector('.cancel-btn');

        this.cancelBtn.onclick = this.close.bind(this);
    }

    async open() {
        try {
            this.modal.removeAttribute('hidden');
            const req = await fetch('/api/files', {
                method: 'GET',
                headers: {
                    'X-CSRF-Token': csrfToken
                }
            });

            const res = await req.json();

            const markup = this._generateContent(res);
            this.files.insertAdjacentHTML('beforeend', markup);
        } catch (error) {
            console.error('Error in fetching files: ', error);
        }
    }

    close() {
        this.modal.setAttribute('hidden', '');
        this.files.innerHTML = '';
    }

    async select() {

    }

    _generateTemplate() {
        this.win.innerHTML = `
            <div>
                <div class="m-0 pb-4">
                    <div class="d-flex justify-content-between bg-light p-3 rounded-top">
                        <div class="col-auto d-flex">
                            <form action="" id="sendFiles">
                                <label for="file_input" class="btn btn-primary me-2">Upload</label>
                                <input type="file" name="" class="d-none" id="file_input" accept="image/*, video/*" multiple>
                            </form>
                            <button class="btn btn-danger me-2 delete-btn" >Delete <var></var> selected files</button>
                            <button class="btn btn-secondary deselect-btn" >Deselect</button>
                        </div>
                        <div class="col-auto">
                            <form class="d-flex ms-auto" role="search">
                                <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
                                <button class="btn btn-outline-success" type="submit">Search</button>
                            </form>
                        </div>
                    </div>

                    <div class="d-flex align-items-center bg-secondary-subtle p-3">
                        <a href="" class="btn btn-light me-2">All <span class="text-black-50 all_files_amount"></span></a>

                    </div>
                </div>
                <div class="pb-4 px-1 files_container">
                    <div class="files">

                    </div>
                </div>
                <div class="bg-secondary-subtle d-flex justify-content-end p-3 rounded-bottom">
                    <button class="btn btn-primary me-2 select-btn" >Select files</button>
                    <button class="btn btn-danger cancel-btn" >Cancel</button>
                </div>
            </div>
        `;
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
initFilesUpload();
initFilesSelection();

function initFilesUpload() {

    const fileInput = document.querySelector('#file_input');

    let loadedFiles, loadedFilesData, amountOfFiles;

    fileInput.onchange = function (event) {
        event.preventDefault();

        const files = event.target.files;

        loadedFiles = [];
        loadedFilesData = [];
        amountOfFiles = files.length;

        for (const file of files) {
            switch (file.type.split('/')[0]) {
                case 'image':
                    handleFile({
                        type: 'image',
                        file: file,
                        object: new Image(),
                        event: 'onload'
                    });
                    break;

                case 'video':
                    handleFile({
                        type: 'video',
                        file: file,
                        object: document.createElement('VIDEO'),
                        event: 'onloadedmetadata'
                    });
                    break;

                default: break;
            }
        }
    }

    function handleFile({ type, file, object, event }) {
        const reader = new FileReader();
        reader.onload = function (e) {
            object[event] = function () {
                loadedFiles.push(file);

                if (type == 'image') {
                    loadedFilesData.push({
                        name: file.name,
                        width: object.naturalWidth,
                        height: object.naturalHeight
                    })
                } else {
                    loadedFilesData.push({
                        name: file.name,
                        width: object.videoWidth,
                        height: object.videoHeight,
                        fps: object.fps,
                        duration: object.duration
                    })
                }

                if (loadedFiles.length == amountOfFiles) sendFiles();
            }

            object.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }

    function sendFiles() {

        for (let i = 0; i < loadedFiles.length; i++) {
            const formData = new FormData();

            formData.append('file', loadedFiles[i]);
            formData.append('fileData', JSON.stringify(loadedFilesData[i]));

            fetch('/api/files', {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(res => {
                    if(res.success){
                        location.reload();
                    } else {
                        console.error(res.message);
                    }
                })
                .catch(err => console.error(err));
        }

    }

}

function initFilesSelection() {

    const fileContainer = document.querySelector('.files');
    const deleteBtn = document.querySelector('.delete-btn');
    const deselectBtn = document.querySelector('.deselect-btn');


    let isCtrlPressed = false;
    let amountOfSelectedFiles = 0;

    window.addEventListener('keydown', ({key}) => {
        if(key == 'Control') isCtrlPressed = true;
    })

    window.addEventListener('keyup', ({key}) => {
        if(key == 'Control') isCtrlPressed = false;
    })

    fileContainer.addEventListener('click', ({target}) => {
        const container = target.closest('.file');

        if (!container) {
            return
        }

        if(!isCtrlPressed){
            const selectedFiles = fileContainer.querySelectorAll('.selected');
            selectedFiles.forEach(file => {
                toggleClassAndChangeAmount(file);
            })
        }
        toggleClassAndChangeAmount(container);
        changeNumberOfSelectedFilesDisplayed();
    })

    fileContainer.addEventListener('dblclick', ({target}) => {
        const parentContainer = target.parentNode;

        if (!parentContainer.classList.contains('file')) {
            return
        }
        console.log('dbl click')
    })

    deselectBtn.addEventListener('click', () => {
        const selectedFiles = fileContainer.querySelectorAll('.selected');

        if (!selectedFiles.length) return;

        selectedFiles.forEach(file => {
            toggleClassAndChangeAmount(file);
        })
        changeNumberOfSelectedFilesDisplayed();
    })

    deleteBtn.addEventListener('click', () => {
        const selectedFiles = fileContainer.querySelectorAll('.selected');
        const ids = Array.from(selectedFiles).map(file => file.dataset.id);

        fetch('/api/files', {
            method: 'DELETE',
            body: JSON.stringify(ids),
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(res => res.json())
        .then(res => {
            if(res.success){
                const deletedFiles = res.deletedFiles;
                let deletedImages = 0, deletedVideos = 0;

                deletedFiles.forEach(id => {
                    const deletedFile = fileContainer.querySelector(`div[data-id="${id}"`);

                    if(deletedFile.dataset.type === "image") deletedImages++;
                    else deletedVideos++;

                    deletedFile.remove();
                });

                const imagesAmount = document.querySelector('.images_amount');
                const videosAmount = document.querySelector('.videos_amount');
                const all_files_amount = document.querySelector('.all_files_amount');

                imagesAmount.innerHTML = `${+imagesAmount.innerHTML - deletedImages}`;
                videosAmount.innerHTML = `${+videosAmount.innerHTML - deletedVideos}`;
                all_files_amount.innerHTML = `${+all_files_amount.innerHTML - deletedVideos - deletedImages}`;

            } else {
                console.error(res.message);
            }
        })
        .catch(err => console.log(err));
    });



    function toggleClassAndChangeAmount(target) {
        if (target.classList.contains('selected')) amountOfSelectedFiles--;
        else amountOfSelectedFiles++;

        target.classList.toggle('selected');
        target.querySelector('.shadow-inner').classList.toggle('d-none');
    }

    function changeNumberOfSelectedFilesDisplayed(){
        deleteBtn.innerHTML = `Delete ${amountOfSelectedFiles} selected ${amountOfSelectedFiles == 1 ? 'file' : 'files'}`;
    }

}
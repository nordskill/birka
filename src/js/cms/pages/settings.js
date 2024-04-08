export default async function () {

    const token = document.querySelector('meta[name="csrf"]').content;
    const customHtmlForm = document.forms.custom_html;

    customHtmlForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(event.target);

        fetch('/cms/settings', {
            method: 'PATCH',
            headers: {
                'X-CSRF-Token': token
            },
            body: formData
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }).then(data => {
            console.log('Success:', data);
        }).catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
    });


}
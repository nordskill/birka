export default async function () {

    const token = document.querySelector('meta[name="csrf"]').content;
    const customHtmlForm = document.forms.custom_html;
    const identityBasicForm = document.forms.identity_basic;

    customHtmlForm.addEventListener('submit', submitForm);
    identityBasicForm.addEventListener('submit', submitForm);


    const btnSitemap = document.querySelector('#regenerate_sitemap');

    btnSitemap.onclick = async function () {
        try {
            const response = await fetch('/api/sitemap', {
                method: 'PATCH',
                headers: {
                    'X-CSRF-Token': token
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log('Success:', data);
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }

    function submitForm(ev) {
        ev.preventDefault();
    
        const formData = new FormData(ev.target);
    
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
    }

}
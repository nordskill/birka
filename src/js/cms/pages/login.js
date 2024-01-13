export default async function () {

    // CSRF token
    const csrfToken = document.querySelector('meta[name="csrf"]').content;
    const form = document.forms.login;
    const btn = form.querySelector('button[type="submit"]');
    const alert = document.querySelector('.alert');

    btn.addEventListener('click', e => {
        e.preventDefault();
        send();
    });

    async function send() {

        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({
                username: form.username.value,
                password: form.password.value,
                remember: form.remember.checked
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.error(data);
                    window.location.href = '/cms';
                } else {
                    alert.innerText = data.message;
                    alert.hidden = false;
                    console.error(data);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });

    }

}


import Debouncer from '../functions/debouncer.js';

export default function () {

    const csrfToken = document.querySelector('meta[name="csrf"]').content;
    const id = document.querySelector('main[data-id]').dataset.id;

    initFieldsUpdate(csrfToken, id);
    initPermissionsUpdate(csrfToken, id);
    deleteMember(csrfToken, id);

}

function initFieldsUpdate(token, id) {

    const fields = document.querySelectorAll('#member_fields input');

    const onSuccess = (fieldElem) => {
        fieldElem.classList.add('is-valid');
    };
    const onError = (fieldElem, message) => {
        fieldElem.classList.add('is-invalid');
        const invalidFeedback = fieldElem.parentElement.querySelector('.invalid-feedback');
        invalidFeedback.style.display = 'block';
        invalidFeedback.textContent = message;
    };
    const onInput = (fieldElem) => {
        fieldElem.classList.remove('is-valid', 'is-invalid');
        const invalidFeedback = fieldElem.parentElement.querySelector('.invalid-feedback');
        invalidFeedback.style.display = 'none';
    };

    fields.forEach(field => {
        new Debouncer({
            field_element: field,
            endpoint: `/api/members/${id}`,
            token,
            method: 'PATCH',
            success_callback: onSuccess,
            error_callback: onError,
            input_callback: onInput
        });
    });

}

function initPermissionsUpdate(token, id) {

    const memberPermissions = document.getElementById('member_permissions');

    memberPermissions.addEventListener('change', function (e) {
        if (e.target.type === 'checkbox') {
            const checkboxes = memberPermissions.querySelectorAll('input[type=checkbox]');
            const permissions = Array.from(checkboxes).filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);

            const payload = {
                permissions: permissions
            };

            fetch(`/api/members/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token
                },
                body: JSON.stringify(payload)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Update successful:', data.message);
                    } else {
                        console.error('Update failed:', data.message);
                    }
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                });
        }
    });

}

function deleteMember(token, id) {

    const btn = document.getElementById('delete_member');

    btn.onclick = () => {

        if (confirm('Are you sure you want to delete this member?')) {
            fetch(`/api/members/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-Token': token
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Member deleted:', data.message);
                        window.location.href = '/cms/team';
                    } else {
                        console.error('Member deletion failed:', data.message);
                    }
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                });
        }

    }

}
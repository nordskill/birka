
export default function () {

    const csrfToken = document.querySelector('meta[name="csrf"]').content;
    const memberPermissions = document.getElementById('member_permissions');
    const id = document.querySelector('main[data-id]').dataset.id;

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
                    'X-CSRF-Token': csrfToken
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

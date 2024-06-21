
export default function () {

    const csrfToken = document.querySelector('meta[name="csrf"]').content;
    const btn = document.querySelector('#create_member');
    const form = document.forms.member_details;

    // post fetch request with error handling and redirect to new member page by id stored in response .data._id
    btn.onclick = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const jsonObject = convertFormDataToJSON(formData);
        const response = await fetch('/api/members', {
            method: 'POST',
            headers: {
                'X-CSRF-Token': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonObject)
        });
        const data = await response.json();
        if (data.success) {
            console.log(data.data);
            window.location = `/cms/team/${data.data._id}`;
        } else {
            console.error(data);
            alert(data.message);
            // Optionally redirect
            // window.location = `/cms/team/${data.data._id}`;
        }
    };

}

function convertFormDataToJSON(formData) {
    let jsonObject = {};
    for (const [key, value] of formData.entries()) {
        switch (key) {
            case 'email_notifications':
            case 'web_notifications':
                // Convert "on" to true for boolean fields
                jsonObject[key] = value === 'on';
                break;
            case 'permissions':
                // Accumulate permissions into an array
                if (!jsonObject[key]) {
                    jsonObject[key] = [];
                }
                jsonObject[key].push(value);
                break;
            default:
                // If the key already exists as an array, push new values to it
                if (jsonObject.hasOwnProperty(key) && Array.isArray(jsonObject[key])) {
                    jsonObject[key].push(value.trim());
                } else {
                    // Trim other string values and handle as single entries
                    jsonObject[key] = value.trim();
                }
                break;
        }
    }
    return jsonObject;
}


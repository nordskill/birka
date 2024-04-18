console.log('Hello World!');
document.addEventListener('DOMContentLoaded', initJS, { once: true });

function initJS() {

    const token = document.querySelector('meta[name="csrf"]').content;

    cookiesConsent(token);

}

function cookiesConsent(token) {

    const cookiesMessage = document.getElementById('cookies_consent');
    const btnCookiesConsent = document.getElementById('accept_cookies');
    const btnCookiesReject = document.getElementById('reject_cookies');
    if (!btnCookiesConsent || !btnCookiesReject) return;

    btnCookiesConsent.onclick = btnCookiesReject.onclick = async function () {
        const consent = this.dataset.consent === 'true' ? true : false;
        const response = await fetch('/cookies/consent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': token
            },
            body: JSON.stringify({ consent })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.consent === true) {
                location.reload();
            } else {
                cookiesMessage.remove();
            }
        } else {
            const data = await response.json();
            console.error(data.message);
        }
    }

}
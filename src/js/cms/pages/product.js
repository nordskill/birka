export default async function () {

    document.addEventListener('DOMContentLoaded', function () {
        const toggleDisplay = (element, show) => element.classList.toggle('d-none', !show);

        const purchaseBlock = document.querySelector('[data-purchase]');
        const subscriptionBlock = document.querySelector('[data-subscription]');

        document.addEventListener('change', function (event) {
            if (event.target.matches('[name="btnradio"]')) {
                toggleDisplay(purchaseBlock, event.target.id === 'purchase_el');
                toggleDisplay(subscriptionBlock, event.target.id === 'subscription_el');
            }
        });
    });

}
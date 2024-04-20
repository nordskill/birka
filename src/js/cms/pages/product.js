import FilePicker from "../../components/file-picker";
import TagsCRUD from "../../components/tags-crud";

const filePicker = new FilePicker();

export default async function () {

    const toggleDisplay = (element, show) => element.classList.toggle('d-none', !show);

    const purchaseBlock = document.querySelector('[data-purchase]');
    const subscriptionBlock = document.querySelector('[data-subscription]');

    document.addEventListener('change', function (event) {
        if (event.target.matches('[name="btnradio"]')) {
            toggleDisplay(purchaseBlock, event.target.id === 'purchase_el');
            toggleDisplay(subscriptionBlock, event.target.id === 'subscription_el');
        }
    });

    new TagsCRUD('.tags_crud');

    // document.querySelectorAll('.list_meta_icons .px-1')[0].addEventListener('click', async () => {
    //     const files = await filePicker.open();
    //     console.log(files);
    // })
}
export default async function () {

    document.addEventListener("DOMContentLoaded", function () {
        'use strict'
        let checkbox = document.getElementById("purchase"),
            detailsBlock = document.querySelector("[data-details]");

        function updateDetailsBlockVisibility() {
            detailsBlock.style.display = checkbox.checked ? "block" : "none";
        }

        updateDetailsBlockVisibility();
        checkbox.addEventListener("change", updateDetailsBlockVisibility);
    });

}
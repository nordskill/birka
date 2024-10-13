import cms_tags from './pages/tags.js';
import cms_dashboard from './pages/dashboard.js';
import cms_customer from './pages/customer.js';
import cms_product from './pages/product.js';
import cms_blogpost from './pages/blogpost.js';
import cms_pages from './pages/pages.js';
import cms_page from './pages/page.js';
import cms_blog from './pages/blog.js';
import cms_files from './pages/files.js';
import cms_menus from './pages/menus.js';
import cms_menu from './pages/menu.js';
import cms_settings from './pages/settings.js';
import cms_new_member from './pages/new-member.js';
import cms_member from './pages/member.js';
import cms_custom_model_items from './pages/custom-model-items.js';
import cms_custom_model_item from './pages/custom-model-item.js';

import 'bootstrap';
import bootstrapFormsValidation from './functions/bootstrap-forms-validation.js';

const page = {
    cms_tags,
    cms_dashboard,
    cms_customer,
    cms_product,
    cms_blogpost,
    cms_files,
    cms_pages,
    cms_page,
    cms_blog,
    cms_menus,
    cms_menu,
    cms_settings,
    cms_new_member,
    cms_member,
    cms_custom_model_items,
    cms_custom_model_item
}

document.addEventListener('DOMContentLoaded', () => {

    const currentPage = determineCurrentPage();

    autoUpdates();

    if (page[currentPage]) {
        page[currentPage]();
    } else {
        console.log('No JS for:', currentPage);
    }
});

bootstrapFormsValidation();

function determineCurrentPage() {

    const metaTag = document.head.querySelector('meta[name="template"]');
    return metaTag ? metaTag.getAttribute('content') : undefined;

}

function autoUpdates() {

    const navItem = document.querySelector('.nav-item.update');
    if (!navItem) return;
    const btnCheckUpdates = navItem.querySelector('.action');
    const navName = navItem.querySelector('.nav_name');
    const action = navItem.querySelector('.action');
    const token = document.querySelector('meta[name="csrf"]').content;

    const currentVersion = parseTagName(navName.textContent);

    btnCheckUpdates.onclick = checkUpdates;
    
    async function checkUpdates(event) {
        event.preventDefault();
        
        const response = await fetch('/cms/update');
        const release = await response.json();
        const latestVersion = parseTagName(release.tag_name);

        if (currentVersion < latestVersion) {
            navName.textContent = `Update to ${release.tag_name}`;
            navItem.classList.add('available');
            navItem.onclick = update;
        } else {
            alert('You are up to date!');
        }
        if (release.message) alert(release.message);
    }

    async function update(event) {
        event.preventDefault();
        const response = await fetch('/cms/update', {
            method: 'POST',
            headers: {
                'X-CSRF-Token': token
            }
        });
        const data = await response.json();
        if (data.message) alert(data.message);
        if (data.error) alert(data.error);
    }
    

}

function parseTagName(string) {
    return string.replace('v.', '').split('.').map(Number);
}


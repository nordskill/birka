import cms_tags from './pages/tags';
import cms_dashboard from './pages/dashboard';
import cms_customer from './pages/customer';
import cms_product from './pages/product';
import cms_blogpost from './pages/blogpost';
import cms_pages from './pages/pages';
import cms_page from './pages/page';
import cms_files from './pages/files';
import cms_menus from './pages/menus';
import cms_menu from './pages/menu';
import cms_settings from './pages/settings';

import 'bootstrap';
import bootstrapFormsValidation from '../functions/bootstrap-forms-validation';

const page = {
    cms_tags,
    cms_dashboard,
    cms_customer,
    cms_product,
    cms_blogpost,
    cms_files,
    cms_pages,
    cms_page,
    cms_menus,
    cms_menu,
    cms_settings
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


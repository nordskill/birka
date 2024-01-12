import cms_dashboard from './pages/dashboard';
import cms_customer from './pages/customer';
import cms_product from './pages/product';
import files from './pages/files';

import 'bootstrap';
import bootstrapFormsValidation from '../functions/bootstrap-forms-validation';

const currentPage = determineCurrentPage();

const page = {
    cms_dashboard,
    cms_customer,
    cms_product,
    files
}

if (page[currentPage]) {
    page[currentPage]();
} else {
    console.log('No page found for:', currentPage);
}

bootstrapFormsValidation();

function determineCurrentPage() {

    const metaTag = document.head.querySelector('meta[name="template"]');
    return metaTag ? metaTag.getAttribute('content') : undefined;

}
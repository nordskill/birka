import cms_dashboard from './pages/dashboard';
import cms_customer from './pages/customer';
import cms_product from './pages/product';
import cms_blogpost from './pages/blogpost';
import cms_page from './pages/page';
import cms_files from './pages/files';

import 'bootstrap';
import bootstrapFormsValidation from '../functions/bootstrap-forms-validation';

const currentPage = determineCurrentPage();

const page = {
    cms_dashboard,
    cms_customer,
    cms_product,
    cms_blogpost,
    cms_files,
    cms_page
}

if (page[currentPage]) {
    page[currentPage]();
} else {
    console.log('No JS for:', currentPage);
}

bootstrapFormsValidation();

function determineCurrentPage() {

    const metaTag = document.head.querySelector('meta[name="template"]');
    return metaTag ? metaTag.getAttribute('content') : undefined;

}
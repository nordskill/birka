const express = require('express');
const router = express.Router();
const Category = require('../../models/category');
const Product = require('../../models/product');

const SLUG = 'product';
const TITLE = 'Product';

// CMS Products
router.get('/', async (req, res, next) => {
    let products = [];
    let categories = [];
    try {
        categories = await Category.find()
            .sort({
                slug: 'asc'
            })
            .select(' -__v')
            .lean();

        products = await Product.find()
            .sort({
                slug: 'asc'
            })
            .select(' -__v')
            .populate('categories thumbnail', '-__v')
            .lean();

    } catch (err) {
        next(err);
    }
    res.render(`cms/${SLUG}s`, {
        title: `${TITLE}s`,
        template_name: `cms_${SLUG}s`,
        active: `${SLUG}s`,
        products,
        categories,
        product_images: '/demo_files/images/products/',
        breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: `${TITLE}s`,
                href: `/cms/${SLUG}s`
            }
        ],
        scripts: [
            'validation-form.js'
        ]
    });
});
// product page
router.get(`/:id`, async (req, res, next) => {
    const id = req.params.id;
    let categories = [];
    try {
        categories = await Category.find()
            .sort({
                slug: 'asc'
            })
            .select(' -__v')
            .lean();

        const productPage = await Product.findById(id)
            .select('-__v')
            .populate('categories thumbnail tags', '-__v')
            .populate({
                path: 'variants',
                select: '-attributes -tags',
                populate: {
                    path: 'thumbnail',
                    select: 'extension file_name'
                }
            })
            .lean();

        productPage.categories.forEach(productCatItem => {
            const category = categories.find(item => {
                return item._id.toString() === productCatItem._id.toString();
            });
            if (category) category.selected = true;
        });

        if (!productPage) {
            throw new OperationalError("Product not found", 404);
        }
        const folder_path = '/files/images/products/';
        res.render(`cms/${SLUG}`, {
            title: productPage.title,
            template_name: `cms_${SLUG}`,
            active: `${SLUG}s`,
            product: productPage,
            categories,
            folder_path,
            thumbnail: `${folder_path}${productPage.thumbnail?.file_name}.${productPage.thumbnail?.extension}`,
            breadcrumbs: [{
                    name: 'CMS',
                    href: '/cms'
                },
                {
                    name: `${TITLE}s`,
                    href: `/cms/${SLUG}s`
                },
                {
                    name: `${productPage.title}`,
                    href: `/cms/${SLUG}s/${SLUG}`
                }
            ],
            scripts: [
                'validation-form.js',
                'switch-purchase-subscription.js'
            ]
        });
        // console.log(userPage.shipping[0]._id);
    } catch (err) {
        next(err);

    }

});

module.exports = router;
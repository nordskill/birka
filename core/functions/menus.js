const Menu = require('../models/menu'); // Ensure this path is correct

// Middleware to attach menu data to the response
async function attachMenuData(req, res, next) {
    try {
        const menus = await Menu.find({})
            .populate('items.image')
            .lean();
        const menuMap = {};
        menus.forEach(menu => {
            menuMap[menu.name] = menu.items;
        });
        res.locals.menus = menuMap;
    } catch (error) {
        console.error('Error fetching menus:', error);
        res.locals.menus = {};
    }
    next();
}

module.exports = attachMenuData;

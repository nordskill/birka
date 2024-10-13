import express from 'express';
import mongoose from 'mongoose';

import Menu from '../../models/menu.js';
import updateDoc from '../../controllers/update-doc.js';
import updateSubDoc from '../../controllers/update-subdoc.js';
import OperationalError from '../../functions/operational-error.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const menus = await Menu.find()
            .select('-__v')
            .lean();

        if (!menus) {
            throw new OperationalError("Menus not found", 404);
        }

        res.json(menus);
    } catch (err) {
        next(err);
    }
});

// Get menu by id
router.get('/:id', async (req, res, next) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            throw new OperationalError("Invalid ID format", 400); // Using 400 for Bad Request
        }

        const menu = await Menu.findById(req.params.id).select('-__v').lean();
        if (!menu) {
            throw new OperationalError("Menu not found", 404);
        }
        res.json(menu);
    } catch (err) {
        next(err);
    }
});

// Create menu with case-insensitive name check
router.post('/', async (req, res, next) => {
    try {
        // Check if a menu with the same name (ignoring case) already exists
        const existingMenu = await Menu.findOne({ name: new RegExp(`^${req.body.name}$`, 'i') }).lean();

        if (existingMenu) {
            throw new OperationalError("A menu with the same name already exists", 400);
        }

        const newMenu = new Menu(req.body);
        const savedMenu = await newMenu.save();
        res.status(201).json(savedMenu);
    } catch (err) {
        next(err);
    }
});

// Update menu by id
router.put('/:id', async (req, res, next) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            throw new OperationalError("Invalid ID format", 400); // Using 400 for Bad Request
        }

        const updatedMenu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-__v').lean();
        if (!updatedMenu) {
            throw new OperationalError("Menu not found", 404);
        }
        res.json(updatedMenu);
    } catch (err) {
        next(err);
    }
});

// Delete menu by id
router.delete('/:id', async (req, res, next) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            throw new OperationalError("Invalid ID format", 400); // Using 400 for Bad Request
        }

        const deletedMenu = await Menu.findByIdAndDelete(req.params.id);
        if (!deletedMenu) {
            throw new OperationalError("Menu not found", 404);
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// Create a menu item within a menu
router.post('/:menuId/items', async (req, res, next) => {
    try {
        if (!isValidObjectId(req.params.menuId)) {
            throw new OperationalError("Invalid ID format", 400); // Using 400 for Bad Request
        }

        const menu = await Menu.findById(req.params.menuId);
        if (!menu) {
            throw new OperationalError("Menu not found", 404);
        }
        menu.items.push(req.body); // Add the new item to the menu items array
        const savedMenu = await menu.save();
        res.status(201).json(savedMenu.items[savedMenu.items.length - 1]); // Return the newly added item
    } catch (err) {
        next(err);
    }
});

// Read all items from a menu
router.get('/:menuId/items', async (req, res, next) => {
    try {
        if (!isValidObjectId(req.params.menuId)) {
            throw new OperationalError("Invalid ID format", 400); // Using 400 for Bad Request
        }

        const menu = await Menu.findById(req.params.menuId).select('items -_id').lean();
        if (!menu) {
            throw new OperationalError("Menu not found", 404);
        }
        res.json(menu.items);
    } catch (err) {
        next(err);
    }
});

// Update a menu item by menu ID and item ID
router.patch('/:docId/items/:subdocId', updateSubDoc(Menu, 'items'));

// Delete a menu item by menu ID and item ID
router.delete('/:menuId/items/:itemId', async (req, res, next) => {
    try {
        if (!isValidObjectId(req.params.menuId)) {
            throw new OperationalError("Invalid menu ID format", 400); // Using 400 for Bad Request
        }
    
        if (!isValidObjectId(req.params.itemId)) {
            throw new OperationalError("Invalid menu item ID format", 400); // Using 400 for Bad Request
        }

        const menu = await Menu.findById(req.params.menuId);
        if (!menu) {
            throw new OperationalError("Menu not found", 404);
        }
        // Find the index of the item to be removed
        const itemIndex = menu.items.findIndex(item => item._id.equals(req.params.itemId));
        if (itemIndex === -1) {
            throw new OperationalError("Menu item not found", 404);
        }
        // Remove the item from the array
        menu.items.splice(itemIndex, 1);
        await menu.save();
        res.status(204).send(); // Successfully deleted, no content to return
    } catch (err) {
        next(err);
    }
});

export default router;


function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}
const e = require('express');
const Menu = require('../models/menu');

function addMenu(req, res) {
    const { title, url, order, active } = req.body;
    const menu = new Menu();
    menu.title = title;
    menu.url = url;
    menu.order = order;
    menu.active = active;

    menu.save((err, createdMenu) => {
        if(err) {
            res.status(500).send({ message: 'Server error' });
        }
        else {
            if(!createdMenu) {
                res.status(400).send({ message: 'Error to create menu' });
            }
            else {
                res.status(200).send({ message: 'Successfully created menu' });
            }
        }
    });
}

function getMenus(req, res) {
    Menu.find()
        .sort({ order: 'asc' })
        .exec((err, menusStored) => {
            if(err) {
                res.status(500).send({ message: 'Server error' });
            }
            else {
                if(!menusStored) {
                    res.status(404).send({ message: 'Menus not found' });
                }
                else {
                    res.status(200).send({ menu: menusStored });
                }
            }
        });
}

function updateMenu(req, res) {
    let menuData = req.body;
    const params = req.params;

    Menu.findByIdAndUpdate(params.id, menuData, (err, menuUpdate) => {
        if(err) {
            res.status(500).send({ message: 'Server error' });
        }
        else {
            if(!menuUpdate) {
                res.status(404).send({ message: 'Menu not found' });
            }
            else {
                res.status(200).send({ message: 'Menu updated successfully'});
            }
        }
    });
}

function deleteMenu(req, res) {
    const { id } = req.params;

    Menu.findByIdAndRemove(id, (err, menuDeleted) => {
        if(err) {
            res.status(500).send({ message: 'Server error'});
        }
        else {
            if(!menuDeleted) {
                res.status(404).send({ message: 'Menu not found' });
            }
            else {
                res.status(200).send({ message: 'Menu deleted successfully' });
            }
        }
    });
}

module.exports = { addMenu, getMenus, updateMenu, deleteMenu };
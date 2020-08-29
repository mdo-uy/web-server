const bcrypt = require('bcrypt');
const User = require('../models/user');

function signUp(req, res) {
    const user = new User();
    const { name, lastName, email, password, repeatPassword } = req.body;
    
    user.name = name;
    user.lastName = lastName;
    user.email = email;
    user.role = 'admin';
    user.active = false; 

    if(!password || !repeatPassword) {
        res.status(400).send({message: 'Passwords are required.'});
    } 
    else {
        if(password != repeatPassword) {
            res.status(400).send({message: 'The passwords are different.'});
        }
        else{
            const salt = 10;

            bcrypt.hash(password, salt, function(err, hash) {
                if(err) {
                    res.status(500).send({message:'Error to encrypt password.'});
                }
                user.password = hash;
                user.save((err, userStored) => {
                    if(err) {
                        res.status(500).send({message: 'Error server to save user'});
                    }
                    else{
                        res.status(200).send({user: userStored});
                    }
                });
            });
        }
    }
    
}

module.exports = {
    signUp
};
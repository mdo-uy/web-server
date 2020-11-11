const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('../services/jwt');
const User = require('../models/user');

function signUp(req, res) {
    const user = new User();
    
    const { name, lastName, email, password, repeatPassword } = req.body;
    
    user.name = name;
    user.lastName = lastName;
    user.email = email.toLowerCase();
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
                        res.status(500).send({message: 'User already exists'});
                    }
                    else{
                        res.status(200).send({user: userStored});
                    }
                });
            });
        }
    }    
}

function signIn(req, res) {
    const params = req.body;
    const email = params.email.toLowerCase();
    const password = params.password;

    User.findOne({email}, (err, userStored) => {
        if(err) {
            res.status(500).send({message: 'Server error'});
        }  else {
            if(!userStored) {
                res.status(400).send({message: 'User not found'});
            } else {
                // User found. Password sent is compared with the encrypted.
                bcrypt.compare(password, userStored.password, (err, check) => {
                    if (err) {
                        res.status(500).send({message: 'Server error'});
                    }
                    else if (!check) {
                        res.status(400).send({message: 'Incorrect password'});
                    }
                    else {
                        if(!userStored.active) {
                            res.status(200).send({message: 'User not active'});
                        }
                        else {
                            res.status(200).send({
                                accessToken: jwt.createAccessToken(userStored),
                                refreshToken: jwt.createRefreshToken(userStored)
                            });
                        }
                    }
                });
            }
        }
    });
}

function getUsers(req, res) {
    User.find().then(users => {
        if(!users) {
            res.status(400).send({ message: 'Users not found' });
        }
        else {
            res.status(200).send({ users });
        }
    });
}

function getUsersActive(req, res) {
    const query = req.query;

    User.find({ active: query.active }).then(users => {
        if(!users) {
            res.status(400).send({ message: 'Users not found' });
        }
        else {
            res.status(200).send({ users });
        }
    });
}

function uploadAvatar(req, res) {
    const params = req.params;

    
    User.findById({ _id: params.id }, (err, userData) => {
        if(err) {
            res.status(500).send({ message: 'Server error to upload image' });            
        }
        else {
            if(!userData) {
                res.status(400).send({ message: 'User not found' });            
            }
            else {
                let user = userData;

                if(req.files) {
                    let filePath = req.files.avatar_file.path;
                    // console.log(filePath);
                    let fileSplit = filePath.split('\\'); // Crea un array con las diferentes partes de la ruta de la imagen
                    let fileName = fileSplit[2]; // Obtengo nombre de imagen                    

                    let extSplit = fileName.split('.'); 
                    let fileExt = extSplit[1]; // Obtengo extension de la imagen
                    
                    if(fileExt !== 'png' && fileExt !== 'jpg' & fileExt !== 'jpeg') {
                        res.status(500).send({ message: 'Invalid image extension (Allowed extensions: .png, jpg, jpeg)' });            
                    }
                    else {
                        user.avatar = fileName;
                        User.findByIdAndUpdate({ _id: params.id }, user, (err, userResult) => {
                            if(err) {
                                res.status(500).send({ message: 'Server error' });            
                            }
                            else {
                                if(!userResult) {
                                    res.status(400).send({ message: 'User not found' });   
                                }
                                else {
                                    res.status(200).send({ avatarName: fileName });
                                }
                            }
                        });
                    }
                }
            }
        }
    });
}

function getAvatar(req, res) {
    const avatarName = req.params.avatarName;
    const filePath = './uploads/avatar/' + avatarName;

    fs.exists(filePath, exists => {
        if(!exists) {
            res.status(404).send({ message: 'Avatar not found' });
        }
        else {
            res.sendFile(path.resolve(filePath));
        }
    })
}

// function updateUser(req, res) {
//     let userData = req.body;
//     userData.email = req.body.email.toLowerCase();
//     const params = req.params;
    
    
//     if(userData.password) {
//         bcrypt.hash(userData.password, 10, (err, hash) => {
//             if(err) {
//                 res.status(500).send({ message: 'Failed to encrypt password'});
//             }
//             else {
//                 userData.password = hash;
                
//                 // Una vez que el password está hasheado va a buscar el usuario.
//                 User.findByIdAndUpdate({ _id: params.id }, userData, (err, userUpdate) => {
//                     if(err) {
//                         res.status(500).send({ message: 'Server error' });
//                     }
//                     else {
//                         if(!userUpdate) {
//                             res.status(400).send({ message: 'User not found'});
//                         }
//                         else {
//                             res.status(200).send({ message: 'User updated successfully' });
//                         }
//                     }
//                 });
//             }
//         });
//     }
//     else {
//         User.findByIdAndUpdate({ _id: params.id }, userData, (err, userUpdate) => {
//             if(err) {
//                 res.status(500).send({ message: 'Server error' });
//             }
//             else {
//                 if(!userUpdate) {
//                     res.status(400).send({ message: 'User not found'});
//                 }
//                 else {
//                     res.status(200).send({ message: 'User updated successfully' });
//                 }
//             }
//         });
//     }    
// }

async function updateUser(req, res) {
    let userData = req.body;
    userData.email = req.body.email.toLowerCase();
    const params = req.params;
    
    
    if(userData.password) {
        let salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
    }

    // Una vez que el password está hasheado va a buscar el usuario.
    User.findByIdAndUpdate({ _id: params.id }, userData, (err, userUpdate) => {
        if(err) {
            res.status(500).send({ message: 'Server error' });
        }
        else {
            if(!userUpdate) {
                res.status(400).send({ message: 'User not found'});
            }
            else {
                res.status(200).send({ message: 'User updated successfully' });
            }
        }
    });  
}


function activateUser (req, res){
    const { id } = req.params;
    const { active } = req.body

    User.findByIdAndUpdate(id, { active }, (err, userStored) => {
        if(err) {
            res.status(500).send({ message: 'Server error' });
        }
        else {
            if(!userStored) {
                res.status(400).send({ message: 'User not found' });
            }
            else {
                if(active === true) {
                    res.status(200).send({ message: 'User activated successfully'});
                }
                else {
                    res.status(200).send({ message: 'User disabled successfully'});
                }
            }
        }
    });
}

function deleteUser (req, res) {
    const { id } = req.params;

    User.findByIdAndRemove(id, (err, userDelete) => {
        if(err) {
            res.status(500).send({ message: 'Server error' });
        }
        else {
            if(!userDelete) {
                res.status(400).send({ message: 'User not found' });
            }
            else {
                res.status(200).send({ message: 'User deleted' });
            }
        }
    })
}

function signUpAdmin(req, res) {
    const user = new User();
    const { name, lastname, email, role, password, repeatPassword } = req.body;

    user.name = name;
    user.lastname = lastname;
    user.email = email.toLowerCase();
    user.role = role;
    user.active = true; 

    if(!password) {
        res.status(500).send({message:'The password is mandatory'});
    }
    else {
        bcrypt.hash(password, 10, (err, hash) => {
            if(err) {
                res.status(500).send({message:'Error to encrypt password'});
            }
            else {
                user.password = hash;
                
                user.save((err, userStored) => {
                    if(err) {                        
                        res.status(500).send({message: 'User already exists'});
                    }
                    else{
                        res.status(200).send({message: 'User created successfully'});
                    }
                });
            }
        });
    }
}

module.exports = {
    signUp, signIn, getUsers, getUsersActive, uploadAvatar, getAvatar, updateUser, activateUser, deleteUser, signUpAdmin
};
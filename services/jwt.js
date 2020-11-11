const jwt = require('jwt-simple');
const moment = require('moment');

const SECRET_KEY = '123123123';

function createAccessToken (user){
    const payload = {
        id: user._id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        createToken: moment().unix(),
        exp: moment().add(3, 'hours').unix()
    };
    return jwt.encode(payload, SECRET_KEY);
}

function createRefreshToken (user) {
    const payload = {
        id: user._id,
        exp: moment().add(30, 'days').unix()
    };
    return jwt.encode(payload, SECRET_KEY);
}

function decodeToken (token) {
    return jwt.decode(token, SECRET_KEY, true);
}

module.exports = { createAccessToken, createRefreshToken, decodeToken };
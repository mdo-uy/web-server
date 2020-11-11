const jwt = require('jwt-simple');
const moment = require('moment');

const SECRET_KEY = '123123123';

exports.ensureAuth = (req, res, next) => {
    // No se envio token
    if(!req.headers.authorization) {
        return res.status(403).send({ message: 'The request does not have an authentication header' });
    }

    const token = req.headers.authorization.replace(/['"]+/g, "");

    try {
        var payload = jwt.decode(token, SECRET_KEY);

        if(payload.exp <= moment.unix()) {
            return res.status(400).send({ message: 'The token has expired' });
        }
    }
    catch (ex) {
        return res.status(400).send({ message: 'Invalid token' });
    }

    req.user = payload;
    next();
};
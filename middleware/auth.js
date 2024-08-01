const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET;
const isAuthorize = async (req, res, next) => {
    try {
        if (
            !req.headers.authorization ||
            !req.headers.authorization.startsWith('Bearer') ||
            !req.headers.authorization.split(' ')[1]
        ) {
            //กรุณาระบุ Token
            return res.status(422).json({
                message: 'Please provide a token'
            });
        }

        const authToken = req.headers.authorization.split(' ')[1];
        try {
            const decoded = jwt.verify(authToken, JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            //Token หมดอายุ
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: 'Token expired'
                });
            }
            //Token ไม่ถูกต้อง
            return res.status(401).json({
                message: 'Token is not valid'
            });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

module.exports = {
    isAuthorize
};

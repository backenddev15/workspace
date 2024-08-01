require('dotenv').config();
const bcrypt = require('bcryptjs')
const db = require('../config/dbConnection');
const { hash } = require('crypto');
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET;
const randomstring = require('randomstring')
const sendMail = require('../helpers/sendMail')

const register = async (req, res) => {
    const { name_th, email, password } = req.body;
    console.log('result', req.body);
    console.log('file', req.file);
    try {
        if (!name_th || !email || !password) {
            return res.status(400).json({
                msg: 'All fields are required!'
            });
        }
        const [existingUser] = await db.query(
            `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(email)})`
        );
        if (existingUser.length) {
            return res.status(409).json({
                msg: 'This email is already in use!'
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('hashedPassword', hashedPassword);
        const filePath = req.file ? `images/${req.file.filename}` : '';
        const [result] = await db.query(
            `INSERT INTO users (name_th, email, password, employee_picture) VALUES (?, ?, ?, ?)`,
            [name_th, email, hashedPassword, filePath]
        );
        const mailSubject = 'Mail Verification';
        const randomToken = randomstring.generate();
        const content = `<p>Hi ${name_th}, Please <a href="http://localhost:8001/mail-verification?token=${randomToken}">Verify</a> your Mail.</p>`;
        sendMail(email, mailSubject, content);
        await db.query('UPDATE users SET token=? WHERE email=?', [randomToken, email]);
        return res.status(201).json({
            msg: 'The user has been registered with us!',
            data: { name_th, email, employee_picture: filePath }
        });
    } catch (err) {
        console.error('Error during user registration:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                msg: 'This email is already in use!'
            });
        }
        return res.status(500).json({
            msg: 'Internal server error'
        });
    }
};

const verifyMail = async (req, res) => {
    const token = req.query.token;

    try {
        const [results] = await db.query('SELECT * FROM users WHERE token = ? LIMIT 1', [token]);

        if (results.length > 0) {
            await db.query('UPDATE users SET token = NULL, is_verified = 1 WHERE id = ?', [results[0].id]);
            return res.render('mail-verification', { message: 'Mail Verified Successfully!' });
        } else {
            return res.render('404');
        }
    } catch (error) {
        console.error('Error verifying mail:', error.message);
        return res.render('error', { message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('result', req.body);

        const [users] = await db.query(
            `SELECT * FROM users WHERE email = ${db.escape(email)}`
        );
        console.log('users', users);
        if (!users.length) {
            return res.status(401).send({
                msg: 'Email or Password is incorrect!',
            });
        }
        const isMatch = await bcrypt.compare(password, users[0].password);
        console.log('isMatch', isMatch);
        if (!isMatch) {
            return res.status(401).send({
                msg: 'Email or Password is incorrect!',
            });
        }
        const token = jwt.sign({ id: users[0].id, email: users[0].email }, JWT_SECRET, { expiresIn: '1h' });
        await db.query(
            `UPDATE users SET last_login = now() WHERE id = '${users[0].id}'`
        )
        return res.status(200).send({
            msg: 'Login successful!',
            token,
            user: users[0]
        });
    } catch (err) {
        return res.status(400).send({
            msg: err.message,
        });
    }
};

const getUser = async (req, res) => {
    try {
        //const authToken = req.headers.authorization.split(' ')[1];
        //const decoded = jwt.verify(authToken, JWT_SECRET);

        const userId = req.user.id
        const [result] = await db.query(
            `SELECT * FROM users WHERE id = ?`, [userId]
        );
        if (result.length === 0) {
            return res.status(404).send({
                success: false,
                message: 'User not found!',
            });
        }
        return res.status(200).send({
            success: true,
            message: 'Fetch successful!',
            data: result[0],
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || email.trim() === '') {
            return res.status(400).json({ msg: 'Email is required!' });
        }
        const [users] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);

        if (users.length > 0) {
            const randomString = randomstring.generate();
            const mailSubject = 'Password Reset Request';
            const content = `<p>Hi ${users[0].name_th},<br>
                Please <a href="http://localhost:8001/forget-password?token=${randomString}">click here</a> to reset your password.</p>`;
            await sendMail(email, mailSubject, content);
            await db.query('DELETE FROM password_resets WHERE email = ?', [email]);
            await db.query('INSERT INTO password_resets (email, token) VALUES (?, ?)', [email, randomString]);
            return res.status(200).json({ message: 'Password reset email sent successfully!' });
        } else {
            return res.status(401).json({ message: "Email doesn't exist!" });
        }
    } catch (error) {
        console.error('Error processing password reset request:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const resetPasswordLoad = async (req, res) => {
    try {
        const token = req.query.token
        if (!token) {
            return res.render('404')
        }
        const [results] = await db.query('SELECT * FROM password_resets WHERE token = ? LIMIT 1', [token])
        if (results && results.length > 0) {
            // const email = results[0].email
            await db.query('DELETE FROM password_resets WHERE token = ?', [token])
            return res.render('forget-password', { user:results[0] })
        } else {
            return res.render('404')
        }
    } catch (error) {
        console.error('Error processing password reset request:', error.message)
        return res.status(500).render('500')
    }
};

const resetPassword = async (req, res) => {
    try {
        const { user_id, email, password, confirm_password } = req.body;

        if (password !== confirm_password) {
            return res.render('forget-password', { error_message: 'Passwords do not match', user: { id: user_id, email: email } });
        }

        const hash = await bcrypt.hash(confirm_password, 10);

        await db.query('DELETE FROM password_resets WHERE email = ?', [email]);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, user_id]);

        return res.render('message', { message: 'Password Reset Successfully!'});
    } catch (error) {
        console.error('Error processing password reset request:', error);
        return res.status(500).render('500');
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name_th, email } = req.body;
        const userId = req.user.id

        // const token = req.headers.authorization.split(' ')[1]
        // const decoded = jwt.verify(token, JWT_SECRET)
        let sql = ''
        let data = []
        if (req.file) {
            sql = `UPDATE users SET name_th = ?, email = ?, employee_picture = ? WHERE id = ?`
            data = [name_th, email, 'images/'+req.file.filename, userId]
        } else {
            sql = `UPDATE users SET name_th = ?, email = ? WHERE id = ?`
            data = [name_th, email, userId]
        }
        await db.query( sql, data )
        res.status(200).send({
                msg:'Profile Update Successfully!'
            })

    } catch (error) {
        console.error('Error processing password reset request:', error.message);
        return res.status(500).render('500');
    }
}

module.exports = {
    register,
    login,
    getUser,
    verifyMail,
    forgetPassword,
    resetPasswordLoad,
    resetPassword,
    updateProfile
}
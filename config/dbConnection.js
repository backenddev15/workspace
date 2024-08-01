const mysql = require("mysql2/promise");

const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

// async function connectToDatabase() {
//     try {
//         const conn = await mysql.createConnection({
//             host: DB_HOST,
//             user: DB_USERNAME,
//             password: DB_PASSWORD,
//             database: DB_NAME,
//             port: DB_PORT
//         });
//         console.log(DB_NAME + ' Database connected successfully!');
//         return conn;
//     } catch (err) {
//         console.error('Error connecting to the database:', err);
//         throw err;
//     }
// }

// connectToDatabase();

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    // waitForConnections: true,
    // connectionLimit: 10,
    // queueLimit: 0
});



module.exports = pool;
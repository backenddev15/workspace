require("dotenv").config();
require('./config/dbConnection')
const express = require('express')
const cors = require('cors')
const bodyparser = require("body-parser");
const userRouter = require('./routes/userRoute')
const webRouter = require('./routes/webRoute')

// const mysql = require("mysql2/promise");
// const redis = require("redis");
// const cron = require("node-cron");
const app = express()
const port = 8001
const END_POINT = "/api/v1";
// let conn = null;
// let redisConn = null;
app.use(express.json());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended:true }));
app.use(cors())
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});


// const initMySQL = async () => {
//     conn = await mysql.createConnection({
//       host: "localhost",
//       user: "root",
//       password: "1234",
//       database: "workspace",
//       port: "3307"
//     });
//   };
  
  // function init connection redis
//   const initRedis = async () => {
//     redisConn = redis.createClient();
//     redisConn.on("error", (err) => console.log("Redis Client Error", err));
//     await redisConn.connect();
//   };

app.use(END_POINT, userRouter)
app.use('/', webRouter)

app.get('/hello-world', (req, res) => {
    res.send('hello world')
})

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error"
    res.status(err.statusCode).json({
        message:err.message,
    })
})

// app.listen(port, async (req, res) => {
app.listen(port, (req, res) => {
    // await initMySQL();
    // await initRedis();
    console.log(`Server running at http://localhost:${port}/`)
})
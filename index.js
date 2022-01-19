const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const URL = "mongodb+srv://google:google@cluster0.ualgv.mongodb.net?retryWrites=true&w=majority";
// const URL = "mongodb://localhost:27017";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secret = "jsn1K6hflk";
const nodemailer = require("nodemailer");



app.use(cors({
    origin: "*"
}));

app.use(express.json());

//Authenticate the users Token 

let authenticate = function (req, res, next) {
    if (req.headers.authorization) {
        try {
            let verifyResult = jwt.verify(req.headers.authorization, secret);
            next();
        } catch (error) {
            res.status(401).json({ message: " Token Invalid" });
        }
    }
    else {
        res.status(401).json({ message: "Not Authorized" });
    }
}

//get method to get the data from API

app.get("/user", async function (req, res) {
    try {
        // connect the database
        let connection = await MongoClient.connect(URL);
        //select DB
        let db = connection.db("DriveUsers");
        //select collection
        //DO any operation
        let users = await db.collection("Users").find({}).toArray();
        //close the connection
        await connection.close();
        // message for Api is worked or not
        res.json(users);

    } catch (error) {
        console.log(error);
    }
    // res.json(UserList)
});


// Login Form
app.post("/login", async function (req, res) {
    try {
        let connection = await MongoClient.connect(URL);
        let db = connection.db("DriveUsers");
        let user = await db.collection("Users").findOne({ email: req.body.email });
        //If user is present allow then won't allow
        if (user) {
            let userVerify = await bcrypt.compare(req.body.password, user.password);
            if (userVerify) {
                let token = jwt.sign({ userid: user._id }, secret, { expiresIn: '2h' });
                res.json({ token });
            }
            else {
                res.status(401).json({ message: "Email or Password do not Correct  " })
            }

        } else {
            res.status(401).json({ message: "Email or Password do not Correct" })
        }
    } catch (error) {
        console.log(error);
    }
})

var sender = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "studypurposedemo2021@gmail.com",
        pass: "practicedummy@123"
    }
});


//Customer registration form 

app.post('/register', async function (req, res) {

    var composemail = {
        from: "studypurposedemo2021@gmail.com",
        to: req.body.email,
        subject: "Send mail Using Node JS",
        text : 'Now Login Your Account'
    };



    sender.sendMail(composemail, function (error, info) {
        if (error) {
            console.log(error);
        }
        else {
            console.log("Mail send Successfully" + info.response)
        }
    });


    try {
        let connection = await MongoClient.connect(URL);
        let db = connection.db("DriveUsers");
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.password, salt);
        req.body.password = hash;

        await db.collection("Users").insertOne(req.body);
        connection.close();
        res.json({ message: "Customer Registered" })
    } catch (error) {
        console.log(error);
    }
})

app.get("/dashboard", authenticate, function (req, res) {
    res.json({ totalUsers: 20 })
})



app.listen(process.env.PORT || 3000)
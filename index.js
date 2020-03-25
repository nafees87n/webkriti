const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const argon = require("argon2");
const session = require("express-session");
app.use(session({
    secret: 'kpNNSM',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10000000 }
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "mySql@123",
    database: "webkriti"
});

con.connect((err) => {
    if (err) console.log(err);
    else console.log("Database Connected!");
});
app.use(express.static("public"));


app.get('/', (req, res) => {
    msg=req.query.msg;
    res.render("homepage.ejs", {
        msg: msg
    });
});
app.get('/agent',(req,res)=>{
    res.render("agent.ejs");
});
app.post('/register', (req, res) => {
    const name = req.body.username,
        email = req.body.email,
        pass1 = req.body.password,
        pass2 = req.body.confirm,
        dob = req.body.dob;
    var msg = "";
    var flag = 1;
    var sql = ``;
    if (pass1 != pass2) {
        msg = "Passwords do not match"
        res.render("homepage.ejs",{
            msg:msg
        });
        return;
    } else if(pass1.length<8){
        msg="Password must be greater than 8 characters"
        res.render("homepage.ejs",{
            msg:msg
        });
        return;
    } else{
        sql=`SELECT username,email FROM users WHERE username=? OR email=?`
        con.query(sql,[name,email],(err,rows)=>{
            if(rows.length){
                if(rows[0].username.length) msg="Username already taken"
                if(rows[0].email.length) msg="Email already registered"
            }
            if(rows.length){
                res.render("homepage.ejs",{
                    msg:msg
                })
            }
            else{
                bcrypt.hash(pass1, 10, function (err, hash) {
                    const h = hash;
                    const p = [[name, email, h, dob]];
                    sql = `INSERT INTO users (username, email,pwdhash,dob) VALUES ?`
                    con.query(sql, [p], (err) => {
                        if (err) res.send(err);
                        else {
                            req.session.username = name;
                            res.redirect('/dashboard');
                            // res.render('dashboard.ejs', {
                            //     user: name
                            // });
                        }
                    });
                });
            }
        });
    }

});
app.post('/login',(req,res)=>{
    const sql=`SELECT username,pwdhash FROM users WHERE username=?`
    const pass=req.body.password;
    const name=req.body.username;
    con.query(sql,[name],(err,rows)=>{
        // console.log(rows);
        if(!rows.length){
            res.redirect('/?msg=Invalid User name');
        }
        else
        bcrypt.compare(pass,rows[0].pwdhash, function(err, result) {
            if(!result){
                res.redirect('/?msg=Incorrect password');
            }
            else{
                req.session.username=name;
                res.redirect('/dashboard');
            }
        });
    });
});
app.get('/dashboard', (req, res) => {
    if(req.session.username){
        res.statusCode=200;
        res.render("dashboard.ejs", {
            user: req.session.username
        });
    }
    else{
        res.redirect('/?msg=not logged in');
    }
});
app.post('/agent_register', (req, res) => {
    const name = req.body.username,
        email = req.body.email,
        pass1 = req.body.password,
        pass2 = req.body.confirm,
        dob = req.body.dob;
    var msg = "";
    var sql = ``;
    if (pass1 != pass2) {
        msg = "Passwords do not match"
        res.render("agent.ejs",{
            msg:msg
        });
        return;
    } else if(pass1.length<8){
        msg="Password must be greater than 8 characters"
        res.render("agent.ejs",{
            msg:msg
        });
        return;
    } else{
        sql=`SELECT username,email FROM agents WHERE username=? OR email=?`
        con.query(sql,[name,email],(err,rows)=>{
            if(rows.length){
                if(rows[0].username.length) msg="Username already taken"
                if(rows[0].email.length) msg="Email already registered"
            }
            if(rows.length){
                res.render("agent.ejs",{
                    msg:msg
                })
            }
            else{
                bcrypt.hash(pass1, 19, function (err, hash) {
                    const h = hash;
                    const p = [[name, email, h, dob]];
                    sql = `INSERT INTO agents (username, email,pwdhash,dob) VALUES ?`
                    con.query(sql, [p], (err) => {
                        if (err) res.send(err);
                        else {
                            req.session.username = name;
                            res.redirect('/dashboard');
                            // res.render('dashboard.ejs', {
                            //     user: name
                            // });
                        }
                    });
                });
            }
        });
    }

});

app.get('/logout', (req, res) => {
    if (req.session.username) {
        req.session.destroy(() => {
            res.status = 200;
            res.redirect('/');
        });
    }
    else {
        res.status(400).send("You're not logged in");
    }
});

app.listen(3000, () => console.log("Server Connected"));
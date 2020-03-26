const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({
    secret: 'kpNNSM',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10000000 }
}));
var date =new Date();
    date=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "mySql@123",
    database: "webkriti"
});

con.connect((err) => {
    if (err) console.log(err);
    else {
        console.log("Database Connected!\n");
        console.log(date);
    }
});

app.get('/', (req, res) => {
    let msg=req.query.msg;
    let type=req.query.type;
    res.render("homepage.ejs", {
        msg: msg,
        type:type
    });
});
app.get('/agent',(req,res)=>{
    let msg=req.query.msg;
    let type=req.query.type;
    res.render("agent.ejs",{
        msg:msg,
        type:type
    });
});
app.post('/register', (req, res) => {
    const name = req.body.username,
        email = req.body.email,
        pass1 = req.body.password,
        pass2 = req.body.confirm,
        dob = req.body.dob;
    var msg = "";
    var sql = ``;
    if (pass1 != pass2) {
        msg = "Passwords do not match"
        res.render("homepage.ejs",{
            msg:msg,
            type:"signup"
        });
        return;
    } else{
        sql=`SELECT username,email FROM users WHERE username=? OR email=?`
        con.query(sql,[name,email],(err,rows)=>{
            if(rows.length){
                if(rows[0].username.length) msg="Username already taken"
                else if(rows[0].email.length) msg="Email already registered"
            }
            if(rows.length){
                res.render("homepage.ejs",{
                    msg:msg,
                    type:"signup"
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
            res.redirect('/?msg=Invalid User name&type=login');
        }
        else
        bcrypt.compare(pass,rows[0].pwdhash, function(err, result) {
            if(!result){
                res.redirect('/?msg=Incorrect password&type=login');
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
        let sql=`select * from matches`
        con.query(sql,(err,rows)=>{
            res.render("dashboard.ejs", {
                user: req.session.username,
                match:rows
            });
        });
    }
    else{
        res.redirect('/?msg=not logged in&type=login');
    }
});
app.post('/dashboard/book',(req,res)=>{
    let id=req.body.id;
    let sql=`select * from matches where id=?`
    con.query(sql,[id],(err,rows)=>{
        res.render('booking.ejs',{
            match:rows[0]
        });
    });
});
app.get('/dashboard/book',(req,res)=>{
    res.render("booking.ejs");
});
app.get('/agent/schedules',(req,res)=>{
    if(!req.session.username){
        res.send("Not Logged in");
    } else{
        let sql=`select team1,team2,dom from matches where agentusername=?`
        con.query(sql,[req.session.username],(err,rows)=>{
            res.render("agent_schedules.ejs",{
                user:req.session.username,
                match:rows
            });
        });
    }
});
app.get('/agent/schedules/new',(req,res)=>{
    var msg=req.query.msg;
    if(!req.session.username){
        res.send("Not Logged in");
    } else{
        res.render("agent_schedules_new.ejs",{
            msg:msg
        });
    }
});
app.post('/agent/schedules/new',(req,res)=>{
    const team1=req.body.team1,
          team2=req.body.team2,
          pass=req.body.confirm,
          dom=req.body.dom;
    const user=req.session.username;
    const k=[[team1,team2,dom,user]];
    // console.log(user);
          let sql=`select * from agents where username=?`
          con.query(sql,[user],(err,rows)=>{
            //   console.log(rows);
            bcrypt.compare(pass,rows[0].pwdhash, function(err, result) {
                if(!result){
                    res.redirect('/agent/schedules/new?msg=Incorrect password');
                }
                else{
                    let s=`insert into matches (team1,team2,dom,agentusername) values ?`
                    con.query(s,[k],(err)=>{
                        if(err){
                            res.send(err);
                        } else{
                            res.redirect('/agent/schedules/new?msg=Added');
                        }
                    });
                }
              }); 
          });         
});
app.post('/agent/signup', (req, res) => {
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
            msg:msg,
            type:"signup"
        });
        return;
    }else{
        sql=`SELECT username,email FROM agents WHERE username=? OR email=?`
        con.query(sql,[name,email],(err,rows)=>{
            if(rows.length){
                if(rows[0].username.length) msg="Username already taken"
                else if(rows[0].email.length) msg="Email already registered"
            }
            if(rows.length){
                res.render("agent.ejs",{
                    msg:msg,
                    type:"signup"
                })
            }
            else{
                bcrypt.hash(pass1, 10, function (err, hash) {
                    const h = hash;
                    const p = [[name, email, h, dob]];
                    sql = `INSERT INTO agents (username, email,pwdhash,dob) VALUES ?`
                    con.query(sql, [p], (err) => {
                        if (err) res.send(err);
                        else {
                            req.session.username = name;
                            res.redirect('/agent/dashboard');
                            // res.render('agent_dashboard.ejs',{
                            //     user:req.session.username
                            // });
                        }
                    });
                });
            }
        });
    }

});
app.post('/agent/login',(req,res)=>{
    const sql=`SELECT username,pwdhash FROM agents WHERE username=?`
    const pass=req.body.password;
    const name=req.body.username;
    con.query(sql,[name],(err,rows)=>{
        // console.log(rows);
        if(!rows.length){
            res.redirect('/agent?msg=Invalid User name&type=login');
        }
        bcrypt.compare(pass,rows[0].pwdhash, function(err, result) {
            if(!result){
                res.redirect('/agent?msg=Incorrect password&type=login');
            }
            else{
                req.session.username=name;
                res.redirect('/agent/dashboard');
            }
        });
    });
});
app.get('/agent/dashboard',function(req,res){
    if(req.session.username){
        res.statusCode=200;
        const sql=`select * from matches`
        con.query(sql,(err,rows)=>{
            if(err) console.log(err);
            else{
                res.render("agent_dashboard.ejs",{
                    user: req.session.username,
                    match:rows
                }); 
            }
        });
    }
    else{
        res.redirect('/agent?msg=not logged in&type=login');
    }
});
app.get('/agent/logout',function(req,res){
    if (req.session.username) {
        req.session.destroy(() => {
            res.status = 200;
            res.redirect('/agent');
        });
    }
    else {
        res.status(400).send("You're not logged in");
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
const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
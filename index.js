const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const nodemailer = require('nodemailer');
var fs = require('fs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({
    secret: 'kpNNSM',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 2*60*60*1000 }
}));
var date = new Date();
// if(date.getDate()) console.log('0'+date.getDate())
var today = date.getFullYear() + '-' + '0' + (date.getMonth() + 1) + '-' + date.getDate();
const con = mysql.createConnection({
    host: "sql12.freemysqlhosting.net",
    user: "sql12329225",
    password: "7xxPLuIkcU",
    database: "sql12329225"
});

con.connect((err) => {
    if (err) console.log(err);
    else {
        console.log("Database Connected!\n");
        // console.log(today);
    }
});
{
    let sql = `delete from matches where dom<?`
    con.query(sql, date, () => { });
}
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cricgoofficial@gmail.com',
        pass: 'Password@123'
    }
});
app.get('/', (req, res) => {
    let msg = req.query.msg;
    let type = req.query.type;
    res.render("homepage.ejs", {
        msg: msg,
        type: type
    });
});
app.get('/faq',(req,res)=>{
    fs.readFile('faq.pdf', function(err, data) {
        // res.writeHead(200, {'Content-Type': 'text/html'});
        // res.write(data);
        res.end();
      });
})
app.get('/agent', (req, res) => {
    let msg = req.query.msg;
    let type = req.query.type;
    res.render("agent.ejs", {
        msg: msg,
        type: type
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
        res.render("homepage.ejs", {
            msg: msg,
            type: "signup"
        });
        return;
    } else {
        sql = `SELECT username,email FROM users WHERE username=? OR email=?`
        con.query(sql, [name, email], (err, rows) => {
            if (rows.length) {
                if (rows[0].username.length) msg = "Username already taken"
                else if (rows[0].email.length) msg = "Email already registered"
            }
            if (rows.length) {
                res.render("homepage.ejs", {
                    msg: msg,
                    type: "signup"
                })
            }
            else {
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
app.post('/login', (req, res) => {
    const sql = `SELECT username,pwdhash FROM users WHERE username=?`
    const pass = req.body.password;
    const name = req.body.username;
    con.query(sql, [name], (err, rows) => {
        // console.log(rows);
        if (!rows.length) {
            res.redirect('/?msg=Invalid User name&type=login');
        }
        else
            bcrypt.compare(pass, rows[0].pwdhash, function (err, result) {
                if (!result) {
                    res.redirect('/?msg=Incorrect password&type=login');
                }
                else {
                    req.session.username = name;
                    res.redirect('/dashboard');
                }
            });
    });
});
app.get('/dashboard', (req, res) => {
    let msg = req.query.msg;
    var nextweek = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (nextweek.getDate() >= 10) nextweek = nextweek.getFullYear() + '-' + '0' + (nextweek.getMonth() + 1) + '-' + nextweek.getDate();
    else nextweek = nextweek.getFullYear() + '-' + '0' + (nextweek.getMonth() + 1) + '-' + '0' + nextweek.getDate();
    if (req.session.username) {
        res.statusCode = 200;
        let sql = "select * from matches where dom<=? order by dom;"
        con.query(sql, [nextweek], (err, rows) => {
            res.render("dashboard.ejs", {
                user: req.session.username,
                match: rows,
                msg: msg
            });
            console.log(rows);
        });
    }
    else {
        res.redirect('/?msg=You are Not Logged in!! limited seats &type=login');
    }
});
app.get('/fixtures', (req, res) => {
    var nextweek = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (nextweek.getDate() >= 10) nextweek = nextweek.getFullYear() + '-' + '0' + (nextweek.getMonth() + 1) + '-' + nextweek.getDate();
    else nextweek = nextweek.getFullYear() + '-' + '0' + (nextweek.getMonth() + 1) + '-' + '0' + nextweek.getDate();
    if (!req.session.username) {
        res.redirect('/?msg=You are not logged in!!');
    }
    else {
        let sql = `select * from matches where dom<=? order by dom`;
        con.query(sql, [nextweek], (err, rows) => {
            let k = `select * from matches where dom>? order by dom`;
            con.query(k, [nextweek], (err, result) => {
                res.render("fixtures.ejs", {
                    msg: "",
                    match: rows,
                    non: result,
                    user: req.session.user
                });
            })
        });
    }
});
app.get('/mybookings', (req, res) => {
    if (!req.session.username) {
        res.redirect('/?msg=You are not logged in!!');
    }
    else {
        let sql = `select id from booking where username=?`
        con.query(sql, [req.session.username], (err, rows) => {
            let k = `select * from matches where id=?`
            con.query(k, [rows[0].id], (err, result) => {
                res.render("mybookings.ejs", {
                    msg: "",
                    user: req.session.username,
                    match: result
                })
            })
        })
    }
})
app.post('/dashboard/book', (req, res) => {
    if (req.session.username) {
        let id = req.body.id;
        console.log(id);
        let sql = `select * from matches where id=?`
        con.query(sql, [id], (err, rows) => {
            let sql2 = `select * from stand where id=?`
            con.query(sql2, [id], (err, result) => {
                // if(err) console.log(err);
                res.render('booking.ejs', {
                    match: rows[0],
                    msg: "",
                    avail: result
                });
            });
        });
    } else {
        res.redirect('/?msg=not logged in&type=login');
    }

});
app.post('/dashboard/booking', (req, res) => {
    let id = req.body.ticket[0];
    let stand = req.body.ticket[1];
    console.log(req.body.ticket);

    if (stand == "") {
        let sql = `select * from matches where id=?`
        con.query(sql, [id], (err, rows) => {
            con.query(`select * from stand where id=?`, [id], (err, r) => {
                res.render('booking.ejs', {
                    match: rows[0],
                    msg: "Select a Stand By clicking on the Stadium Graphic",
                    avail: r
                });
            })

        });
    } else {
        con.query(`select * from stand where id=? and standname=?`, [id, stand], (err, rst) => {
            if (!rst[0].availability) {
                let sql = `select * from matches where id=?`
                con.query(sql, [id], (err, rows) => {
                    con.query(`select * from stand where id=?`, [id], (err, r) => {
                        res.render('booking.ejs', {
                            match: rows[0],
                            msg: "Seat Not Available In That Stand",
                            avail: r
                        });
                    })

                });
            } else {
                let sql1 = `update stand set availability=? where standname=? and id=?`
                con.query('select * from stand where id=? and standname=?', [id, stand], (err, avail) => {
                    con.query(sql1, [avail[0].availability - 1, stand, id], (err) => {
                        if (err) {
                            console.log(err);
                        }
                    })
                })
                let sql = `insert into booking (id,username,stand) values ?`
                const value = [[id, req.session.username, stand]];
                con.query(sql, [value], (err, rows) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("SUCCESS");
                        let sql = `select email from users where username=?`
                        con.query(sql, [req.session.username], (err, rows) => {
                            // qrcode.toDataURL('ID:' + id + "STAND:" + stand, function (err, url) {
                            // console.log(url);
                            // let img=qrcode.toDataURL(`ID:${id}STAND:${stand}`);
                            var mailOptions = {
                                from: 'Nafees Nehar',
                                to: rows[0].email,
                                subject: 'Your booked ticket.',
                                // text: `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=ID:${id}STAND:${stand}`
                                html: `<p>Dear ${req.session.username},</p>Congratulations! Your seat has been confirmed.We hope that you will have an amazing time. Details of your booking are as follows.</p><p>Match ID: ${id}</p><p>Stand No:${stand}</p><p>Please carry a valid ID at the time of arrival.</p><img src=https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=ID:${id}STAND:${stand}/>`
                            };
                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log('Email sent: ' + info.response);
                                    res.redirect("/dashboard?msg=Booking Successfull");
                                }
                            });
                            // });

                        });
                    }
                });
            }
        })

    }
});
// app.get('/dashboard/book/:id', (req, res) => {
//     res.render("booking.ejs",);
// });
app.get('/agent/schedules', (req, res) => {
    if (!req.session.username) {
        res.send("Not Logged in");
    } else {
        let sql = `select * from matches where agentusername=?`
        con.query(sql, [req.session.username], (err, rows) => {
            res.render("agent_schedules.ejs", {
                user: req.session.username,
                match: rows
            });
        });
    }
});
app.get('/agent/schedules/new', (req, res) => {
    var msg = req.query.msg;
    if (!req.session.username) {
        res.send("Not Logged in");
    } else {
        res.render("agent_schedules_new.ejs", {
            msg: msg
        });
    }
});
app.post('/agent/schedules/new', (req, res) => {
    if (!req.session.username) {
        res.send("Login To continue");
    } else {
        var team1 = req.body.team1,
            team2 = req.body.team2,
            pass = req.body.confirm,
            dom = req.body.dom;
        const user = req.session.username;
        const k = [[team1.toUpperCase(), team2.toUpperCase(), dom, user]];
        let sql = `select * from agents where username=?`
        con.query(sql, [user], (_err, rows) => {
            bcrypt.compare(pass, rows[0].pwdhash, function (err, result) {
                if (!result) {
                    res.redirect('/agent/schedules/new?msg=Incorrect password');
                }
                else {
                    if (dom <= today) {
                        res.redirect('/agent/schedules/new?msg=Cannot schedule for given date')
                    }
                    else {
                        let s;
                        s = `insert into matches (team1,team2,dom,agentusername) values ?`
                        con.query(s, [k], (err, rows) => {
                            if (err) {
                                res.send(err);
                            }
                        });
                        con.query(`select id from matches where team1=? and team2=? and dom=? and agentusername=?`, [team1, team2, dom, user], (err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                let k = `insert into stand (standname,availability,id) values ?`
                                var stand = ['B', 'C', 'D', 'E', 'F'];
                                console.log(result[0].id);
                                for (var i = 0; i < 5; i++) {
                                    con.query(k, [[[stand[i], 5, result[0].id]]], (err) => {
                                        console.log(err);
                                    })
                                }
                                res.redirect("/agent/schedules?msg=Added");
                            }
                        })
                    }
                }
            });
        });
    }
});
app.post('/agent/schedules_cancel', (req, res) => {
    if (!req.session.username) {
        res.send("NOT LOGGED");
    } else {
        let id = req.body.id;
        console.log(id);
        let sql = `delete from matches where id=?`
        con.query(sql, [id], (err) => {
            if (err) {
                console.log(err);
            } else {
                con.query(`delete from stand where id=?`, [id], err => {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect('/agent/schedules?msg=Succesfully cancelled');
                    }
                })

            }
        });
    }
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
        res.render("agent.ejs", {
            msg: msg,
            type: "signup"
        });
        return;
    } else {
        sql = `SELECT username,email FROM agents WHERE username=? OR email=?`
        con.query(sql, [name, email], (err, rows) => {
            if (rows.length) {
                if (rows[0].username.length) msg = "Username already taken"
                else if (rows[0].email.length) msg = "Email already registered"
            }
            if (rows.length) {
                res.render("agent.ejs", {
                    msg: msg,
                    type: "signup"
                })
            }
            else {
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
app.post('/agent/login', (req, res) => {
    const sql = `SELECT username,pwdhash FROM agents WHERE username=?`
    const pass = req.body.password;
    const name = req.body.username;
    con.query(sql, [name], (err, rows) => {
        // console.log(rows);
        if (!rows.length) {
            res.redirect('/agent?msg=Invalid User name&type=login');
        }
        bcrypt.compare(pass, rows[0].pwdhash, function (err, result) {
            if (!result) {
                res.redirect('/agent?msg=Incorrect password&type=login');
            }
            else {
                req.session.username = name;
                res.redirect('/agent/dashboard');
            }
        });
    });
});
app.get('/agent/dashboard', function (req, res) {
    if (req.session.username) {
        res.statusCode = 200;
        const sql = `select * from matches`
        con.query(sql, (err, rows) => {
            if (err) console.log(err);
            else {
                res.render("agent_dashboard.ejs", {
                    user: req.session.username,
                    match: rows,
                    msg: ""
                });
            }
        });
    }
    else {
        res.redirect('/agent?msg=not logged in&type=login');
    }
});
app.get('/agent/logout', function (req, res) {
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
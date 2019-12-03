"use strict";
const express = require("express");
const path = require("path");
const config = require("./config");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const multer = require("multer");
const utils = require("./utils");
const libDAOUser = require("./DAOUsers");
const session = require("express-session");
const sessionMySQL = require("express-mysql-session");

const mySQLStore = sessionMySQL(session);
const sessionStore = new mySQLStore(config.mysqlConfig);

const middlewareSession = session({
    saveUninitialized: false,
    secret: "foobar34",
    resave: false,
    store: sessionStore
});

const app = express();
const multerFactory = multer({ storage: multer.memoryStorage() });

const pool = mysql.createPool(config.mysqlConfig);
const DAOU = new libDAOUser.DAOUsers(pool);

app.listen(config.port, function(err) {
    if (err) {
        console.error("No se pudo inicializar el servidor: "
            + err.message);
    } else {
        console.log(`Servidor arrancado en el puerto ${config.port}`);
    }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(middlewareSession);

app.use(bodyParser.urlencoded({ extended: false }));

function middlewareNotFoundError (request, response) {
    response.status(404);
    
    response.render("error404", {
        url: request.url
    });
}

function middlewareServerError (error, request, response, next) {
    // Código 500: Internal server error
    response.status(500);
    
    response.render("error500", {
        mensaje: error.message,
        pila: error.stack
    });
};

function middlewareCheckUser(request, response, next) {
    if(request.session.currentUser != undefined) {
        response.locals.userEmail = request.session.currentUser;
        response.locals.userPoints = request.session.userPoints;

        next();
    }
    else {
        response.redirect("login");
    }
};

app.get("/", function(request, response) {
    response.redirect("/login");
});

app.get("/login", function (request, response) {
    response.render("login");
});

app.post("/login", function(request, response) {
    DAOU.login(request.body.mail, request.body.password, function(err, points){
        if(err){
            console.log(err);
        }

        if(points !== null){
            request.session.currentUser = request.body.mail;
            request.session.userPoints = points;
            response.redirect("/question");
        }
        else{
            response.render("login", {errMsg : "Email and/or password incorrect."});
        }
    });
});

app.get("/logout", function(request, response) {
    request.session.destroy();
    response.redirect("/login");
});

app.get("/signin", function (request, response) {
    response.render("signin");
});

app.get("/userImage", function(request, response) {
    DAOU.getUserImageName(response.locals.userEmail, function(err, img){
        if(err){
            console.log(err);
        }
        else{
            if(img == null){
                response.sendFile(path.join(__dirname, 'public', 'img/smile.jpg'));
            }
            else{
                response.sendFile(path.join(__dirname, '/profile_imgs/' + img));
            }
        }
    });
});

app.get("/userImage/:email", function(request, response) {
    DAOU.getUserImageName(email, function(err, img){


        
        if(err){
            console.log(err);
        }
        else{
            if(img == null){
                response.sendFile(path.join(__dirname, 'public', 'img/smile.jpg'));
            }
            else{
                response.sendFile(path.join(__dirname, 'profile_imgs' + img));
            }
        }
    });
});

app.get("/friends", middlewareCheckUser, function (request, response) {
    DAOU.getFriends(response.locals.userEmail, function(err, friends) {
        if(err) {
            console.log(err);
        }
        else {
            DAOU.getFriendRequests(response.locals.userEmail, function(err, friendRequests) {
                if(err) {
                    console.log(err);
                }
                else {
                    response.render("friends", {friendRequest: friendRequests, friends: friends});
                }
            })
        }
    });
});

app.post("/createUser", multerFactory.single("picture"), function (request, response) {
    let user = {
        email: request.body.mail,
        name: request.body.name,
        pass: request.body.password,
        gender: request.body.gender,
        birthday: request.body.birthday,
        picture: request.file != undefined ? request.file.buffer : undefined
    }

    DAOU.getUser(user.email, function(err, result) {
        if(err) {
            console.log(err);
        }

        if(result) {
            response.render("signin", {errMsg : "The email is already in use."});
        }
        else {
            DAOU.createUser(user, function(err) {
                if(err) {
                    console.log(err);
                }
        
                request.session.currentUser = request.body.mail;
                response.redirect("/profile");
            });
        }
    });
});

app.get("/profile", middlewareCheckUser, function (request, response) {

    DAOU.getUser(response.locals.userEmail, function(err, user) {
        if(err) {
            console.log(err);   
        } 
        else {
            if(user.birthday) 
                user["age"] = utils.calculateAge(user.birthday, new Date());
            else
                user["age"] = "?"

            switch (user.gender) {
                case 'M':
                    user.gender = 'Male';
                    break;
            
                case 'F':
                    user.gender = 'Female';
                    break;

                default:
                    user.gender = 'Other';
                    break;
            }

            let owner = response.locals.userEmail == user.email ? true : false;

            response.render("profile", {user, owner});
        }
    });
});

app.get("/profile/:id", middlewareCheckUser, function (request, response) {

    DAOU.getUser(request.params.id, function(err, user) {
        if(err) {
            console.log(err);   
        }
        else {
            if(user != undefined) {
                user["age"] = utils.calculateAge(user.birthday, new Date());

                response.render("profile", {user: user, owner: false});
            }
            else {
                response.render("userNotFound");
            }
        }
    });
});

app.post("/search", middlewareCheckUser, function(request, response) {
    DAOU.searchUser(request.body.search, function(err, users){
        if(err) {
            console.log(err);
        }
        else {
            response.render("search", {users});
        }
    });
});

app.get("/question", middlewareCheckUser, function (request, response) {

    response.redirect("/profile")
});

app.get("/updateProfile", middlewareCheckUser, function (request, response) {

    DAOU.getUser("usuario@ucm.es", function(err, user) {
        if(err) {
            console.log(err);
        }
        else {
            response.render("updateProfile", {user});
        }
    });
});

app.get(middlewareNotFoundError);
app.use(middlewareServerError);
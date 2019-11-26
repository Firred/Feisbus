"use strict";
const express = require("express");
const path = require("path");
const config = require("./config");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const utils = require("./utils");
const libDAOUser = require("./DAOUsers");

const app = express();

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
}

app.get("/", function(request, response) {
    response.redirect("/login.html");
});

app.get("/login", function (request, response) {
    response.redirect("/login.html");
});

app.get("/signIn", function (request, response) {
    response.redirect("/signin.html");
});

let user = { 
    name: "Maikol Chikito",
    img: "img/mike.jpg"
}

let friendRequest = [user];
app.get("/friends", function (request, response) {
    response.render("friends", {friendRequest: friendRequest, friends: []});
});

app.post("/createUser", function (request, response) {
    let user = {
        email: request.body.mail,
        name: request.body.name,
        pass: request.body.password,
        gender: request.body.gender,
        birthday: request.body.birthday
    }

    DAOU.createUser(user, function(err) {
        if(err) {
            console.log(err);
        }
    });

    response.redirect("/profile");
});

app.get("/profile", function (request, response) {

    DAOU.getUser("usuario@ucm.es", function(err, user) {
        if(err) {
            console.log(err);   
        } 
        else {
            user["age"] = utils.calculateAge(user.birthday, new Date());

            response.render("profile", {user});
        }
    });
});

app.get(middlewareNotFoundError);
app.use(middlewareServerError);
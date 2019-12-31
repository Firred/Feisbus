"use strict";
const express = require("express");
const path = require("path");
const config = require("./config");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const multer = require("multer");
const utils = require("./utils");
const middleware = require("./middleware");
const libDAOUser = require("./DAOUsers");
const libDAOQuestions = require("./DAOQuestions");
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
const multerImages = multer({ dest: path.join(__dirname, "images") });
const multerPhotos = multer({ dest: path.join(__dirname, "photos") });

const pool = mysql.createPool(config.mysqlConfig);
const DAOU = new libDAOUser.DAOUsers(pool);
const DAOQ = new libDAOQuestions.DAOQuestions(pool);

const userRouter = require("./userRouter");
const friendsRouter = require("./friendsRouter");
const questionRouter = require("./questionRouter");

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

    console.log(error.message);

    response.render("error500", {
        mensaje: error.message
    });
};

function middlewareCheckUser(request, response, next) {
    if(request.session.currentUser != undefined) {
        DAOU.getUser(request.session.currentUser, function(err, user) {
            if(err) {
                console.log(err);

                response.render("/login", {errMsg: "Session error."});
            }
            else {
                response.locals.userEmail = request.session.currentUser;
                response.locals.userPoints = user.points;

                next();
            }
        });
    }
    else {
        response.redirect("/user/login");
    }
}


function middleMessage(request, response, next) {
    if(request.session.msg != undefined) {
        response.locals.errMsg = request.session.msg;
        request.session.msg = undefined;
    }
    
    next();
}

app.use(middlewareCheckUser);

userRouter.get("/", function(request, response) {
    response.redirect("/user/login");
});

app.use("/user", userRouter);
app.use("/friend", friendsRouter);
app.use("/question", questionRouter);

app.use(middlewareNotFoundError);
app.use(middlewareServerError);

app.listen(config.port, function(err) {
    if (err) {
        console.error("No se pudo inicializar el servidor: "
            + err.message);
    } else {
        console.log(`Servidor arrancado en el puerto ${config.port}`);
    }
});
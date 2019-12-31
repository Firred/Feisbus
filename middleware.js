const config = require("./config");
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
        response.redirect("/login");
    }
}


function middleMessage(request, response, next) {
    if(request.session.msg != undefined) {
        response.locals.errMsg = request.session.msg;
        request.session.msg = undefined;
    }
    
    next();
}

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
        response.redirect("/login");
    }
}


function middleMessage(request, response, next) {
    if(request.session.msg != undefined) {
        response.locals.errMsg = request.session.msg;
        request.session.msg = undefined;
    }
    
    next();
}

module.exports = {
    middlewareCheckUser : middlewareCheckUser,
    middleMessage : middleMessage
}
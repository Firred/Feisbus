"use strict";
const express = require("express");
const path = require("path");
const config = require("./config");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const multer = require("multer");
const utils = require("./utils");
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
            response.redirect("/profile");
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

app.get("/userImage", middlewareCheckUser, function(request, response) {
    DAOU.getUserImageName(response.locals.userEmail, function(err, img){
        if(err){
            console.log(err);
        }
        else{
            if(img == null){
                response.sendFile(path.join(__dirname, 'public', 'img/smile.jpg'));
            }
            else{
                response.sendFile(path.join(__dirname, 'images', img));
            }
        }
    });
});

app.get("/userImage/:email", middlewareCheckUser, function(request, response) {
    DAOU.getUserImageName(request.params.email, function(err, img){
        if(err){
            console.log(err);
        }
        else{
            if(img == null){
                response.sendFile(path.join(__dirname, 'public', 'img/smile.jpg'));
            }
            else{
                response.sendFile(path.join(__dirname, 'images/' + img));
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

app.post("/createUser", multerImages.single("picture"), function (request, response) {
    let user = {
        email: request.body.mail,
        name: request.body.name,
        pass: request.body.password,
        gender: request.body.gender,
        birthday: request.body.birthday,
        picture: request.file != undefined ? request.file.filename : undefined
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
                request.session.userPoints = 0;

                response.redirect("/profile");
            });
        }
    });
});

app.get("/profile", middlewareCheckUser, middleMessage, function (request, response) {

    DAOU.getUser(response.locals.userEmail, function(err, user) {
        if(err) {
            console.log(err);   
        } 
        else {
            DAOU.getPhotos(response.locals.userEmail, function(err, photos) {
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
    
                    response.render("profile", {user, owner: true, photos: photos});
                }
            });     
        }
    });
});

app.get("/profile/:email", middlewareCheckUser, function (request, response) {

    DAOU.getUser(request.params.email, function(err, user) {
        if(err) {
            console.log(err);   
        }
        else {
            if(user != undefined) {

                DAOU.getPhotos(request.params.email, function(err, photos) {
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

                        response.render("profile", {user: user,
                            owner: user.email == response.locals.userEmail ? true : false, photos: photos});
                    }
                });
            }
            else {
                response.render("userNotFound");
            }
        }
    });
});

app.post("/search", middlewareCheckUser, function(request, response) {
    DAOU.searchUser(response.locals.userEmail, request.body.search, function(err, users){
        if(err) {
            console.log(err);
        }
        else {
            response.render("search", {users});
        }
    });
});

app.get("/questions", middlewareCheckUser, function (request, response) {
    DAOQ.getQuestions(function(err, questions){
        if(err){
            console.log(err);
        }
        else{
            response.render("randomQuestions", {questions});
        }
    });
});

app.get("/newQuestion", middlewareCheckUser, function (request, response) {
    response.render("newQuestion");
});

app.post("/createQuestion", middlewareCheckUser, function (request, response) {
    let answers = request.body.answers.split('\n');

    DAOQ.createQuestion(request.body.question, answers, function(err, questionId){
        if(err){
            console.log(err);
        }
        else{
            DAOQ.createAnswers(questionId, answers, function (err){
                if(err){
                    console.log(err);
                }
                else{
                    response.redirect("/question/" + questionId);
                }
            });
        }
    });
});

app.get("/question/:id", middlewareCheckUser, function (request, response) {
    DAOQ.getSingleQuestion(request.params.id, function(err, question){
        if(err){
            console.log(err);
        }
        else{
            DAOQ.getUserAnswer(response.locals.userEmail, request.params.id, function (err, answer){
                if(err){
                    console.log(err);
                }
                else{
                    DAOQ.friendAnswers(response.locals.userEmail, request.params.id, function (err, friendsAnswers){
                        if(err){
                            console.log(err);
                        }
                        else{
                            response.render("question", {question, answer, friendsAnswers});
                        }
                    }) 
                }
            })
        }
    });
});

app.get("/answerQuestion/:id", middlewareCheckUser, function (request, response) {
    DAOQ.getSingleQuestion(request.params.id, function(err, question){
        if(err){
            console.log(err);
        }
        else{
            DAOQ.getAnswers(question.id, function(err, answers){
                if(err){
                    console.log(err);
                }
                else{
                    response.render("answerQuestion", {question, answers});
                }
            });
        }
    });
});

app.post("/userAnswer/:id", middlewareCheckUser, function (request, response) {
    if(request.body.ans != "new"){
        DAOQ.setUserAnswer(response.locals.userEmail, request.params.id, request.body.ans, function(err){
            if(err){
                console.log(err);
            }
            else{
                response.redirect("/question/" + request.params.id);
            }
        });
    }
    else{
        let answers = [];
        answers.push(request.body.newAnswer);
        
        DAOQ.createAnswers(request.params.id, answers, function (err){
            if(err){
                console.log(err);
            }
            else{
                DAOQ.setUserAnswer(response.locals.userEmail, request.params.id, request.body.newAnswer, function(err){
                    if(err){
                        console.log(err);
                    }
                    else{
                        response.redirect("/question/" + request.params.id);
                    }
                });
            }
        });
    }
});

app.post("/guess", middlewareCheckUser, function (request, response) {
    let friendEmail = request.body.friendEmail;
    let questionId = request.body.questionId;

    DAOQ.getSingleQuestion(questionId, function(err, question){
        if(err){
            console.log(err);
        }
        else{
            DAOU.getUser(friendEmail, function(err, friend){
                if(err){
                    console.log(err);
                }
                else{
                    DAOQ.getCorrectGuessAnswer(questionId, friendEmail, function(err, correctAnswer){
                        if(err){
                            console.log(err);
                        }
                        else{
                            DAOQ.getGuessAnswers(questionId, correctAnswer, function(err, answers){
                                if(err){
                                    console.log(err);
                                }
                                else{
                                    let correct = {
                                        text : correctAnswer.text
                                    }
                                    answers.push(correct);
                                    utils.shuffle(answers);
                                    
                                    response.render("guessQuestion", {question, friend, answers});
                                }
                            });  
                        }
                    });
                }
            });
        }
    });
});

app.post("/guessAnswer/:id", middlewareCheckUser, function (request, response) {
    let answer = request.body.question;
    let points = response.locals.userPoints + 50;

    DAOQ.getCorrectGuessAnswer(request.params.id, request.body.friendEmail, function(err, correctAnswer){
        if(err){
            console.log(err);
        }
        else{
            if(correctAnswer != null){
                if(correctAnswer.text == answer){
                    DAOQ.updateFriendAnswer(response.locals.userEmail, request.body.friendEmail, request.params.id, 1, function(err){
                        if(err){
                            console.log(err);
                        }
                        else{
                            DAOU.updatePoints(response.locals.userEmail, points,
                                function(err) {
                                    if(err) {
                                        console.log(err);
                                    }
                                    else {
                                        request.session.userPoints = points;
                                        response.redirect("/question/" + request.params.id);
                                    }
                            });
                        }
                    });   
                }
                else{
                    DAOQ.updateFriendAnswer(response.locals.userEmail, request.body.friendEmail, request.params.id, 0, function(err){
                        if(err){
                            console.log(err);
                        }
                        else{
                            response.redirect("/question/" + request.params.id);
                        }
                    });
                }
            }
        }
    });
});

app.get("/updateProfile", middlewareCheckUser, function (request, response) {
    DAOU.getUser(response.locals.userEmail, function(err, user) {
        if(err) {
            console.log(err);
        }
        else {
            user.birthday = utils.formatDate(user.birthday);
            response.render("updateProfile", {user});
        }
    });
});

app.post("/updateUser", middlewareCheckUser, multerImages.single("picture"), function (request, response) {
    DAOU.login(response.locals.userEmail, request.body.password, function(err, points) {
        if(err) {
            console.log(err);
        }
        else {
            let user = {
                email: response.locals.userEmail,
                pass: request.body.newPassword != "" ? request.body.newPassword : request.body.password,
                name: request.body.name,
                gender: request.body.gender,
                birthday: request.body.birthday,
                picture: request.file != undefined ? request.file.filename : undefined
            }

            if(points !== null){
                DAOU.updateUser(user, function(err, user) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        response.redirect("/profile");
                    }
                });
            }
            else {
                response.render("updateProfile", {user: user, errMsg : "The old password is incorrect."});
            }
        }
    });
});

app.post("/requestFriend", middlewareCheckUser, function(request, response) {
    DAOU.existsFriendship(response.locals.userEmail, request.body.user,
        function(err, result) {
            if(err) {
                console.log(err);
            }
            else {
                if(!result) {
                    DAOU.friendRequest(response.locals.userEmail, request.body.user,
                        function(err) {
                            if(err) {
                                console.log(err);
                            }
                            else {
                                response.redirect("/friends");
                            }
                        }
                    );
                } 
                else {
                    if(result.email1 == response.locals.userEmail) {
                        response.redirect("/friends");
                    }
                    else if (result.accepted == -1) {
                        DAOU.deleteFriendship(response.locals.userEmail, request.body.user,
                            function(err) {
                                if(err) {
                                    console.log(err);
                                }
                                else {
                                    DAOU.friendRequest(response.locals.userEmail, request.body.user,
                                        function(err) {
                                            if(err) {
                                                console.log(err);
                                            }
                                            else {
                                                response.redirect("/friends");
                                            }
                                        }
                                    );
                                }
                            }
                        ); 
                    }
                    else {
                        response.redirect("/friends");
                    }
                }    
            }
    });   
});

app.post("/acceptFriend", middlewareCheckUser, function(request, response) {
    DAOU.acceptFriend(response.locals.userEmail, request.body.friend,
        function(err) {
            if(err) {
                console.log(err);
            }
            else {
                response.redirect("/friends");
            }
    });
});

app.post("/ignoreFriend", middlewareCheckUser, function(request, response) {
    DAOU.ignoreFriend(response.locals.userEmail, request.body.friend,
        function(err) {
            if(err) {
                console.log(err);
            }
            else {
                response.redirect("/friends");
            }
    });
});

app.post("/addPhoto", middlewareCheckUser, multerPhotos.single("photo"), function(request, response) {

    if(response.locals.userPoints >= 100) {
        if(request.file != undefined) {
            let photo = {
                name: request.file.filename,
                userEmail: response.locals.userEmail,
                description: request.body.description
            }

            DAOU.addPhoto(photo,
                function(err) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        let points = response.locals.userPoints - 100;

                        DAOU.updatePoints(response.locals.userEmail, points,
                            function(err) {
                                if(err) {
                                    console.log(err);
                                }
                                else {
                                    request.session.userPoints = points;
                                    response.redirect("/profile")
                                }
                        });
                    }
            });
        }
        else {
            request.session.msg = "Select a photo to upload.";
            response.redirect("/profile");
        }
    }
    else {
        request.session.msg = "You don't have enough points.";

        response.redirect("profile");
    }

});

app.get("/getPhoto/:name", middlewareCheckUser, function(request, response) {
    if(request.params.name == null){
        response.sendFile(path.join(__dirname, 'public', 'img/smile.jpg'));
    }
    else{
        response.sendFile(path.join(__dirname, 'photos', request.params.name));
    }
});

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
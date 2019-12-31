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

const multerImages = multer({ dest: path.join(__dirname, "images") });
const multerPhotos = multer({ dest: path.join(__dirname, "photos") });

const pool = mysql.createPool(config.mysqlConfig);
const DAOU = new libDAOUser.DAOUsers(pool);
const DAOQ = new libDAOQuestions.DAOQuestions(pool);

const userRouter = express.Router();

userRouter.use(express.static(path.join(__dirname, 'public')));

userRouter.use(bodyParser.urlencoded({ extended: false }));

userRouter.get("/login", function (request, response) {
    response.render("login");
});

userRouter.post("/login", function(request, response) {
    DAOU.login(request.body.mail, request.body.password, function(err, points){
        if(err){
            console.log(err);
        }

        if(points !== null){
            request.session.currentUser = request.body.mail;
            response.redirect("/user/profile");
        }
        else{
            response.render("login", {errMsg : "Email and/or password incorrect."});
        }
    });
});

userRouter.get("/logout", function(request, response) {
    request.session.destroy();
    response.redirect("/user/login");
});

userRouter.get("/signin", function (request, response) {
    response.render("signin");
});

userRouter.get("/userImage", function(request, response) {
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

userRouter.get("/userImage/:email", function(request, response) {
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

userRouter.post("/createUser", multerImages.single("picture"), function (request, response) {
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

                response.redirect("/user/profile");
            });
        }
    });
});

userRouter.get("/profile", function (request, response) {

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

userRouter.get("/updateProfile", function (request, response) {
    DAOU.getUser(response.locals.userEmail, function(err, user) {
        if(err) {
            console.log(err);
        }
        else {
            if(user.birthday != undefined) {
                user.birthday = utils.formatDate(user.birthday);
            }

            response.render("updateProfile", {user});
        }
    });
});

userRouter.post("/updateUser", multerImages.single("picture"), function (request, response) {
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
                birthday: request.body.birthday != undefined ? request.body.birthday : undefined,
                picture: request.file != undefined ? request.file.filename : undefined
            }

            if(points !== null){
                DAOU.updateUser(user, function(err, user) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        response.redirect("/user/profile");
                    }
                });
            }
            else {
                response.render("updateProfile", {user: user, errMsg : "The old password is incorrect."});
            }
        }
    });
});

userRouter.post("/addPhoto", multerPhotos.single("photo"), function(request, response) {

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
                                    response.redirect("/user/profile")
                                }
                        });
                    }
            });
        }
        else {
            request.session.msg = "Select a photo to upload.";
            response.redirect("/user/profile");
        }
    }
    else {
        request.session.msg = "You don't have enough points.";

        response.redirect("/user/profile");
    }

});

userRouter.get("/getPhoto/:name", function(request, response) {
    if(request.params.name == null){
        response.sendFile(path.join(__dirname, 'public', 'img/smile.jpg'));
    }
    else{
        response.sendFile(path.join(__dirname, 'photos', request.params.name));
    }
});

module.exports = userRouter;
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

const friendsRouter = express.Router();

friendsRouter.get("/friends", function (request, response) {
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

friendsRouter.get("/profile/:email", function (request, response) {

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

friendsRouter.post("/search", function(request, response) {
    DAOU.searchUser(response.locals.userEmail, request.body.search, function(err, users){
        if(err) {
            console.log(err);
        }
        else {
            response.render("search", {users});
        }
    });
});

friendsRouter.post("/requestFriend", function(request, response) {
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
                                response.redirect("/friend/friends");
                            }
                        }
                    );
                } 
                else {
                    if(result.email1 == response.locals.userEmail) {
                        response.redirect("/friend/friends");
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
                                                response.redirect("/friend/friends");
                                            }
                                        }
                                    );
                                }
                            }
                        ); 
                    }
                    else {
                        response.redirect("/friend/friends");
                    }
                }    
            }
    });   
});

friendsRouter.post("/acceptFriend", function(request, response) {
    DAOU.acceptFriend(response.locals.userEmail, request.body.friend,
        function(err) {
            if(err) {
                console.log(err);
            }
            else {
                response.redirect("/friend/friends");
            }
    });
});

friendsRouter.post("/ignoreFriend", function(request, response) {
    DAOU.ignoreFriend(response.locals.userEmail, request.body.friend,
        function(err) {
            if(err) {
                console.log(err);
            }
            else {
                response.redirect("/friend/friends");
            }
    });
});

module.exports = friendsRouter;
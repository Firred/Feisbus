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

const questionRouter = express.Router();

questionRouter.get("/questions", function (request, response) {
    DAOQ.getQuestions(function(err, questions){
        if(err){
            console.log(err);
        }
        else{
            response.render("randomQuestions", {questions});
        }
    });
});

questionRouter.get("/newQuestion", function (request, response) {
    response.render("newQuestion");
});

questionRouter.post("/createQuestion", function (request, response) {
    let question = request.body.question.trim();
    let answers = request.body.answers.split('\n');

    if(question != "" && answers[0] != "") {
        DAOQ.existsQuestion(request.body.question, function(err, exists){

            if(!exists) {
                if(!utils.checkRepeated(answers)) {

                    DAOQ.createQuestion(request.body.question, answers, function(err, questionId){
                        if(err) {
                            console.log(err);
                        }
                        else {
                            DAOQ.createAnswers(questionId, answers, function (err){
                                if(err){
                                    console.log(err);
                                }
                                else{
                                    response.redirect("/question/question/" + questionId);
                                }
                            });
                        }
                    });
                }
                else {
                    response.render("newQuestion", {errMsg: "The answers must be unique."});   
                }
            }
            else {
                response.render("newQuestion", {errMsg: "A question with the same text already exists."});   
            }
        });
    }
    else{
        response.render("newQuestion", {errMsg: "The question and the answers cannot be empty."});
    }
});

questionRouter.get("/question/:id", function (request, response) {
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

questionRouter.get("/answerQuestion/:id", function (request, response) {
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

questionRouter.post("/userAnswer/:id", function (request, response) {
    if(request.body.ans != "new"){
        DAOQ.setUserAnswer(response.locals.userEmail, request.params.id, request.body.ans, function(err){
            if(err){
                console.log(err);
            }
            else{
                response.redirect("/question/question/" + request.params.id);
            }
        });
    }
    else{
        let newA = request.body.newAnswer.trim();

        if(newA != ""){
            DAOQ.answerExists(request.params.id, newA, function(err, exists){
                if(err){
                    console.log(err);
                }
                else{
                    if(!exists) {
            
                        DAOQ.createAnswers(request.params.id, [newA], function (err){
                            if(err){
                                console.log(err);
                            }
                            else{
                                DAOQ.setUserAnswer(response.locals.userEmail, request.params.id, newA, function(err){
                                    if(err){
                                        console.log(err);
                                    }
                                    else{
                                        response.redirect("/question/question/" + request.params.id);
                                    }
                                });
                            }
                        });
                    }
                    else {
                        request.session.msg = "The answer already exists.";
                        response.redirect("/question/answerQuestion/" + request.params.id);
                    }
                }
            });
        }
        else{
            request.session.msg = "The answer cannot be empty";
            response.redirect("/question/answerQuestion/" + request.params.id);
        }
    }
});

questionRouter.post("/guess", function (request, response) {
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

questionRouter.post("/guessAnswer/:id", function (request, response) {
    let answer = request.body.question;
    let points = response.locals.userPoints + 50;

    DAOQ.getCorrectGuessAnswer(request.params.id, request.body.friendEmail, function(err, correctAnswer){
        if(err){
            console.log(err);
        }
        else{
            if(correctAnswer != null){
                if(correctAnswer.text == answer){
                    DAOQ.setFriendAnswer(response.locals.userEmail, request.body.friendEmail, request.params.id, 1, function(err){
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
                                        response.redirect("/question/question/" + request.params.id);
                                    }
                            });
                        }
                    });   
                }
                else{
                    DAOQ.setFriendAnswer(response.locals.userEmail, request.body.friendEmail, request.params.id, 0, function(err){
                        if(err){
                            console.log(err);
                        }
                        else{
                            response.redirect("/question/question/" + request.params.id);
                        }
                    });
                }
            }
        }
    });
});

module.exports = questionRouter;
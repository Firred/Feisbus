"use strict";

const mysql = require("mysql");

class DAOQuestions {
    constructor (pool) {
        this.pool = pool;
    }

    getQuestions(callback) {
        this.pool.getConnection(function (err, connection) {
            if(err) {
                callback(new Error("Connection error in the database"));
            }
            else {
                connection.query(
                    "SELECT id, text FROM questions ORDER BY RAND() LIMIT 5;",
                    function (err, result) {
                        connection.release();
                        if(err) {
                            callback(new Error("Access error in the database" + err));
                        }
                        else {
                            let questions = [];
                            let question;

                            if(result.length > 0){
                                for(let row of result){
                                    question = {
                                        id : row.id,
                                        text : row.text
                                    }
                                    questions.push(question);
                                }
                            }
                            callback(null, questions);
                        }
                    }
                );
            }
        })
    }

    createQuestion(question, callback) {
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "INSERT INTO questions (text) VALUES ?;",
                    [question],
                    function(err, result) {
                        if(err) {
                            callback(new Error("Error de acceso a la base de datos") + err);
                        }
                        else {
                            callback(null, result.insertId);
                        }
                        connection.release();
                    }
                );          
            }
        });
    }

    createAnswers(question, answers, callback) {
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                let sql = "INSERT INTO answers (idQuestion, text) VALUES ";
                let params = [];

                for(let text of answers) {
                    sql += "(?, ?),"
                    params.push(question);
                    params.push(text);
                }

                sql = sql.slice(0, -1);
                sql += ";";

                connection.query(sql, params,
                    function(err) {
                        if(err) {
                            callback(new Error("Error de acceso a la base de datos") + err);
                        }
                        else {
                            callback(null);
                        }
                        connection.release();
                    }
                );          
            }
        });
    }

    getSingleQuestion(questionId, callback){
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT * FROM questions WHERE id = ?",
                    [questionId],
                    function(err, result) {
                        if(err) {
                            callback(new Error("Error de acceso a la base de datos") + err);
                        }
                        else {
                            if(result.length > 0){
                                let question = {
                                    id : result[0].id,
                                    text : result[0].text
                                }
                                callback(null, question);
                            }
                            else{
                                callback(null, null);
                            }
                        }
                        connection.release();
                    }
                );          
            }
        });
    }

    userAnswer(userEmail, questionId, callback){
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT text FROM useranswer WHERE emailUser = ? AND idQuestion = ?",
                    [userEmail, questionId],
                    function(err, result) {
                        if(err) {
                            callback(new Error("Error de acceso a la base de datos") + err);
                        }
                        else {
                            if(result.length > 0){
                                callback(null, result[0]);
                            }
                            else{
                                callback(null, null);
                            }
                        }
                        connection.release();
                    }
                );          
            }
        });
    }

    friendAnswers(userEmail, questionId, callback){
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT name, picture, correct FROM friendanswer LEFT JOIN users " + 
                    "ON friendanswer.emailFriend = users.email WHERE emailUser = ? AND idQuestion = ?",
                    [userEmail, questionId],
                    function(err, result) {
                        if(err) {
                            callback(new Error("Error de acceso a la base de datos") + err);
                        }
                        else {
                            let friendAnswers = [];
                            let friend;

                            if(result.length > 0){
                                for(let row of result){
                                    friend = {
                                        name : row.name,
                                        img : row.picture,
                                        correct : row.correct
                                    }
                                    friendAnswers.push(friend);
                                }
                            }

                            callback(null, friendAnswers);
                        }
                        connection.release();
                    }
                );          
            }
        });
    }
};

module.exports = {
    DAOQuestions : DAOQuestions
}
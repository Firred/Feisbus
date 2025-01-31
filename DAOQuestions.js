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

    existsQuestion(text, callback) {
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT FROM questions WHERE text = ?;",
                    [text],
                    function(err, result) {
                        if(err) {
                            callback(new Error("Error de acceso a la base de datos") + err);
                        }
                        else {
                            if(result.length > 0) {
                                callback(null, false);
                            }
                            else {
                                callback(null, true);
                            }
                        }
                        connection.release();
                    }
                );          
            }
        });
    }

    createQuestion(question, answers, callback) {
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "INSERT INTO questions (text, answers) VALUES (?, ?);",
                    [question, answers.length],
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
                    "SELECT * FROM questions WHERE id = ?;",
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

    getAnswers(questionId, callback){
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT text FROM answers WHERE idQuestion = ?;",
                    [questionId],
                    function(err, result) {
                        if(err) {
                            callback(new Error("Error de acceso a la base de datos") + err);
                        }
                        else {
                            let answers = [];
                            let ans;

                            if(result.length > 0){
                                for(let row of result){
                                    ans = {
                                        text : row.text
                                    }
                                    answers.push(ans);
                                }  
                            }

                            callback(null, answers);
                        }
                        connection.release();
                    }
                );          
            }
        });
    }

    getUserAnswer(userEmail, questionId, callback){
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT text FROM userAnswer WHERE emailUser = ? AND idQuestion = ?;",
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

    setUserAnswer(userEmail, questionId, answer, callback){
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "INSERT INTO `userAnswer` (`emailUser`, `idQuestion`, `text`) VALUES (?,?,?);",
                    [userEmail, questionId, answer],
                    function(err, result) {
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

    friendAnswers(userEmail, questionId, callback){
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT f.email, f.name, correct " +
                    "FROM users " +
                    "LEFT JOIN friends ON (email = emailUser1 OR email = emailUser2) AND accepted = 1 " +
                    "LEFT JOIN users as f ON (f.email = emailUser1 OR f.email = emailUser2) AND f.email <> users.email " +
                    "LEFT JOIN userAnswer ON (f.email = emailUser AND idQuestion = ?) " +
                    "LEFT JOIN friendAnswer ON (friendAnswer.emailFriend = f.email AND friendAnswer.emailUser = users.email AND friendAnswer.idQuestion = userAnswer.idQuestion) " +
                    "WHERE users.email = ? AND userAnswer.idQuestion = ? AND userAnswer.emailUser IS NOT NULL;",
                    [questionId, userEmail, questionId],
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
                                        correct : row.correct,
                                        email : row.email
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

    getCorrectGuessAnswer(questionId, friendEmail, callback){
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT u.text, q.answers FROM userAnswer as u LEFT JOIN questions as q ON u.idQuestion = q.id WHERE idQuestion = ? AND emailUser = ?;",
                    [questionId, friendEmail],
                    function(err, result) {
                        if(err) {
                            callback(new Error("Error de acceso a la base de datos") + err);
                        }
                        else {
                            if(result.length > 0){
                                let correctAnswer = {
                                    text : result[0].text,
                                    number : result[0].answers
                                }
                                callback(null, correctAnswer);
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

    getGuessAnswers(questionId, correctAnswer, callback){
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT a.text FROM answers as a LEFT JOIN questions as q ON a.idQuestion = q.id WHERE idQuestion = ? AND a.text != ? ORDER BY RAND() LIMIT ?;",
                    [questionId, correctAnswer.text, correctAnswer.number-1],
                    function(err, result) {
                        if(err) {
                            callback(new Error("Error de acceso a la base de datos") + err);
                        }
                        else {
                            let answers = [];
                            let ans;

                            if(result.length > 0){
                                for(let row of result){
                                    ans = {
                                        text : row.text
                                    }
                                    answers.push(ans);
                                }  
                            }

                            callback(null, answers);
                        }
                        connection.release();
                    }
                );          
            }
        });
    }

    setFriendAnswer(userEmail, friendEmail, questionId, correct, callback){
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "INSERT INTO friendAnswer (emailUser, idQuestion, emailFriend, correct) VALUES (?,?,?,?)",
                    [userEmail, questionId, friendEmail, correct],
                    function(err, result) {
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

    answerExists(id, text, callback) {
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT * FROM answers WHERE idQuestion = ? AND text = ?",
                    [id, text],
                    function(err, result) {
                        if(err) {
                            callback(new Error("Error de acceso a la base de datos") + err);
                        }
                        else {
                            if(result.length > 0) {
                                callback(null, true);
                            }
                            else {
                                callback(null, false);
                            }
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
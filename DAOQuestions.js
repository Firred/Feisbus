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
                            callback(null, result);
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
                    "INSERT INTO questions (text) VALUES (?);",
                    [question.text],
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

                for(let fila of answers.text) {
                    sql += "(?, ?),"
                    params.push(question);
                    params.push(fila);
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
};

module.exports = {
    DAOQuestions : DAOQuestions
}
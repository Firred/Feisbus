"use strict";

const mysql = require("mysql");

class DAOQuestions {
    constructor (pool) {
        this.pool = pool;
    }

    getQuestions(email, callback) {
        this.pool.getConnection(function (err, connection) {
            if(err) {
                callback(new Error("Connection error in the database"));
            }
            else {
                connection.query(
                    "SELECT name, gender, birthday, image FROM users WHERE email = ?;",
                    email, function (err, result) {
                        connection.release();

                        if(err) {
                            callback(new Error("Access error in the database"));
                        }
                        else {
                            let user;


                            if(result.length > 0) {
                                user = {
                                    email: email,
                                    name: result[0].name,
                                    gender: result[0].gender,
                                    birthday: result[0].birthday,
                                    image: result[0].image
                                }
                            }

                            callback(null, user);
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
                    function(err) {

                        if(err) {
                            callback(new Error("Error de acceso a la base de datos") + err);
                        }
                        else {
                            connection.query(
                                "INSERT INTO questions (text) VALUES (?);",
                                [], function(err) {
                                    if(err) {
                                        callback(err);
                                    }
                                    else {


                                        callback(null,);
                                    }
                                }
                            );
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
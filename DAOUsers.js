"use strict";

const mysql = require("mysql");

class DAOUsers {
    constructor (pool) {
        this.pool = pool;
    }

    getUser(email, callback) {
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


    getFriends (email, callback) {
        this.pool.getConnection(function (err, connection) {
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT * FROM friends left join users ON emailUser1 = tag.taskId " +
                    "WHERE user = ?;", email, function(err, result) {
                        connection.release();

                        if(err) {
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            let tasks = [];
                            let t;
                            let lastId = -1;

                            if(result.length > 0) {
                                lastId = -1;

                                for(let fila of result) {
                                    if(fila.id != lastId) {
                                        if(lastId != -1) 
                                            tasks.push(t);

                                        lastId = fila.id;

                                        t =  {
                                            id : fila.id,
                                            text: fila.text,
                                            done: fila.done,
                                            tags: []
                                        };
                                    }

                                    t.tags.push(fila.tag);
                                }

                                tasks.push(t);
                            }
                            
                            callback(null, tasks);
                        }
                    }
                )
            } 
        });
    }


    createUser(user, callback) {
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                let sql = "INSERT INTO users (email, name, pass, gender, birthday, image)" +
                " VALUES (?, ?, ?, ?, ?, ?);";

                connection.query(
                    sql, [user.email, user.name, user.pass, user.gender, user.birthday, user.image],
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

    markTaskDone(idTask, callback) {
        this.pool.getConnection(function(err, connection) {
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                connection.query("UPDATE task SET done = 1 WHERE id = ?;", idTask,
                function(err) {
                    connection.release();

                    if(err) {
                        callback(new Error("Error de acceso a la base de datos"));
                    }
                    else {
                        callback(null);
                    }
                });
            }
        });
    }

    deleteComplete(email, callback) {
        this.pool.getConnection(function(err, connection) {
            connection.release();

            if(err) {
                callback(new Error("Error de conexión a la base de datos"));
            }   
            else {
                connection.query("DELETE FROM task WHERE done = 1 AND user = ?;", email, function(err) {
                    if(err) {
                        callback(new Error("Error de acceso a la base de datos"));
                    }
                    else {
                        callback(null);
                    }
                });
            } 
        });
    }
};

module.exports = {
    DAOUsers : DAOUsers
}
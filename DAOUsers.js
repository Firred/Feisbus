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
                    "SELECT userEmail1, F1.name as name1, F2.name as name2, F1.image as img1, F2.image as img2 FROM friends " +
                    "left join users as F1 ON emailUser1 = F1.email " +
                    "left join users as F2 ON emailUser2 = F2.email " +
                    "WHERE emailUser1 = ? OR emailUser2 = ? AND accepted = 1;",
                    email, function(err, result) {
                        connection.release();

                        if(err) {
                            callback(new Error("Error de acceso a la base de datos" + err));
                        }
                        else {
                            let friends = [];
                            let f;

                            if(result.length > 0) {
                                for(let row of result) {
                                    if(row.userEmail1 == email) {
                                        f = {
                                            name: row.name2,
                                            img: row.img2
                                        }
                                    }
                                    else {
                                        f = {
                                            name: row.name1,
                                            img: row.img1
                                        }
                                    }

                                    friends.push(f);
                                }
                            }
                            
                            callback(null, friends);
                        }
                    }
                )
            } 
        });
    }

    getFriendRequests(email, callback) {
        this.pool.getConnection(function (err, connection) {
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                connection.query(
                    "SELECT friendEmail, F1.name as name1, F2.name as name2, F1.image as img1, F2.image as img2 FROM friends " +
                    "left join users as F1 ON emailUser2 = F1.email " +
                    "WHERE emailUser1 = ? AND accepted = 0;",
                    email, function(err, result) {
                        connection.release();

                        if(err) {
                            callback(new Error("Error de acceso a la base de datos" + err));
                        }
                        else {
                            let friends = [];
                            let f;

                            if(result.length > 0) {
                                for(let row of result) {
                                    f = {
                                        name: row.name2,
                                        img: row.img2
                                    }

                                    friends.push(f);
                                }
                            }
                            
                            callback(null, friends);
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
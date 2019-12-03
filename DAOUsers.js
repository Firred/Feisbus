"use strict";

const mysql = require("mysql");

class DAOUsers {
    constructor (pool) {
        this.pool = pool;
    }

    login(email, pass, callback) {
        this.pool.getConnection(function (err, connection) {
            if(err) {
                callback(new Error("Connection error in the database"));
            }
            else {
                connection.query(
                    "SELECT email, points FROM users WHERE email = ? AND pass = ?;",
                    [email, pass], function (err, result) {
                        connection.release();

                        if(err) {
                            callback(new Error("Access error in the database" + err));
                        }
                        else {
                            if(result.length > 0) {
                                callback(null, result[0].points);
                            }
                            else {
                                callback(null, null);
                            }
                        }
                    }
                );
            }
        })
    }

    getUser(email, callback) {
        this.pool.getConnection(function (err, connection) {
            if(err) {
                callback(new Error("Connection error in the database"));
            }
            else {
                connection.query(
                    "SELECT email, name, gender, birthday, picture, points FROM users WHERE email = ?;",
                    email, function (err, result) {
                        connection.release();

                        if(err) {
                            callback(new Error("Access error in the database"));
                        }
                        else {
                            let user;

                            if(result.length > 0) {
                                user = {
                                    email: result[0].email,
                                    name: result[0].name,
                                    gender: result[0].gender,
                                    birthday: result[0].birthday,
                                    img: result[0].picture,
                                    points: result[0].points
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
                    "SELECT emailUser1, F1.name as name1, F2.name as name2, F1.picture as img1, F2.picture as img2 FROM friends " +
                    "left join users as F1 ON emailUser1 = F1.email " +
                    "left join users as F2 ON emailUser2 = F2.email " +
                    "WHERE (emailUser1 = ? OR emailUser2 = ?) AND accepted = 1;",
                    [email, email], function(err, result) {
                        connection.release();

                        if(err) {
                            callback(new Error("Error de acceso a la base de datos" + err));
                        }
                        else {
                            let friends = [];
                            let f;

                            if(result.length > 0) {
                                for(let row of result) {
                                    if(row.emailUser1 == email) {
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
                    "SELECT emailUser2 as friendEmail, users.name as name, users.picture as img FROM friends " +
                    "left join users ON emailUser2 = users.email " +
                    "WHERE emailUser1 = ? AND accepted = 0;",
                    [email], function(err, result) {
                        connection.release();

                        if(err) {
                            callback(new Error("Error de acceso a la base de datos" + err));
                        }
                        else {
                            let friendRequests = [];
                            let r;

                            if(result.length > 0) {
                                for(let row of result) {
                                    r = {
                                        name: row.name,
                                        img: row.img
                                    }

                                    friendRequests.push(r);
                                }
                            }
                            
                            callback(null, friendRequests);
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
                let sql = "INSERT INTO users (email, name, pass, gender"
                let values = [user.email, user.name, user.pass, user.gender];

                if(user.birthday) {
                    sql += ", birthday";
                    values.push(user.birthday);
                }

                if(user.picture != undefined) {
                    sql += ", picture";
                    values.push(user.picture);
                }

                sql += ") VALUES (";

                for(let i = 0; i < values.length-1; i++) {
                    sql += "?, "
                }

                sql += "?);";
                
                connection.query(
                    sql, values,
                    function(err) {

                        if(err) {
                            callback(new Error("Error de acceso a la base de datos"));
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

    getUserImageName(email, callback){
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                let sql = 'SELECT picture FROM users WHERE email = ?;'
                connection.query(
                    sql, [email],
                    function(err, result){
                        connection.release()
                        if(err){
                            callback(new Error("Error de acceso a la base de datos"))
                        }
                        else{
                            if(result.length > 0){
                                callback(null, result[0].img)
                            }
                            else{
                                callback(null, null)
                            }
                        }
                    }
                )
            }
        });
    }

    searchUser (name, callback) {
        this.pool.getConnection(function(err, connection){
            if(err){
                callback(new Error("Error de conexión a la base de datos"));
            }
            else{
                let sql = 'SELECT email, name FROM users WHERE name LIKE ?;'
                connection.query(
                    sql, ["%"+name+"%"],
                    function(err, result){
                        connection.release()
                        if(err){
                            callback(new Error("Error de acceso a la base de datos" + err))
                        }
                        else{
                            let users = [];
                            let u;

                            if(result.length > 0) {
                                for(let row of result) {
                                    u = {
                                        email: row.email,
                                        name: row.name
                                    }

                                    users.push(u);
                                }
                            }

                            callback(null, users);
                        }
                    }
                )
            }
        });
    }
};

module.exports = {
    DAOUsers : DAOUsers
}
CREATE DATABASE Facebluff;
USE Facebluff;


CREATE TABLE users (
	email varchar(254) PRIMARY KEY NOT NULL,
    name varchar(60) NOT NULL,
    pass varchar(20) NOT NULL,
    gender varchar(1),
    age int(2) UNSIGNED,
    image varchar(100),
    points int(9) UNSIGNED NOT NULL DEFAULT 0
);

CREATE TABLE friends (
	emailUser1 varchar(254) NOT NULL,
	emailUser2 varchar(254) NOT NULL,
    CONSTRAINT FK_FRIEND1 FOREIGN KEY (emailUser1) REFERENCES users (email),
    CONSTRAINT FK_FRIEND2 FOREIGN KEY (emailUser2) REFERENCES users (email)
);

CREATE TABLE questions (
	id int(9) UNSIGNED PRIMARY KEY NOT NULL auto_increment,
    text varchar(100) NOT NULL
);

CREATE TABLE answers (
	idQuestion int(9) UNSIGNED NOT NULL,
    text varchar(200) NOT NULL,
    PRIMARY KEY(idQuestion, text),
    CONSTRAINT FK_QUESTION FOREIGN KEY (idQuestion) REFERENCES questions (id)
);

CREATE TABLE userAnswer (
	emailUser int(9) UNSIGNED NOT NULL,
	idQuestion int(9) UNSIGNED NOT NULL,
    text varchar(200) NOT NULL,
    PRIMARY KEY (idUser, idQuestion),
    CONSTRAINT FK_USER FOREIGN KEY (idUser) REFERENCES users (email),
    CONSTRAINT FK_USERQUESTION FOREIGN KEY (idQuestion) REFERENCES questions (id)
    
);

CREATE UNIQUE INDEX INDEX_FRIENDS1 ON friends (idUser1, idUser2);
CREATE UNIQUE INDEX INDEX_FRIENDS2 ON friends (idUser2, idUser1);
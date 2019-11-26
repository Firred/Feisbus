CREATE DATABASE IF NOT EXISTS Facebluff;
USE Facebluff;


CREATE TABLE IF NOT EXISTS users (
	email varchar(254) PRIMARY KEY NOT NULL,
    name varchar(60) NOT NULL,
    pass varchar(20) NOT NULL,
    gender varchar(1),
    birthday date,
    image varchar(100),
    points int(9) UNSIGNED NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS friends (
	emailUser1 varchar(254) NOT NULL,
	emailUser2 varchar(254) NOT NULL,
    accepted int(1) DEFAULT 0,
    CONSTRAINT FK_FRIEND1 FOREIGN KEY (emailUser1) REFERENCES users (email),
    CONSTRAINT FK_FRIEND2 FOREIGN KEY (emailUser2) REFERENCES users (email)
);

CREATE TABLE IF NOT EXISTS questions (
	id int(9) UNSIGNED PRIMARY KEY NOT NULL auto_increment,
    text varchar(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS answers (
	idQuestion int(9) UNSIGNED NOT NULL,
    text varchar(200) NOT NULL,
    PRIMARY KEY(idQuestion, text),
    CONSTRAINT FK_QUESTION FOREIGN KEY (idQuestion) REFERENCES questions (id)
);

CREATE TABLE IF NOT EXISTS userAnswer (
	emailUser varchar(254) NOT NULL UNIQUE,
	idQuestion int(9) UNSIGNED NOT NULL UNIQUE,
    text varchar(200) NOT NULL,
    PRIMARY KEY (emailUser, idQuestion),
    CONSTRAINT FK_USER FOREIGN KEY (emailUser) REFERENCES users (email),
    CONSTRAINT FK_USERQUESTION FOREIGN KEY (idQuestion) REFERENCES questions (id)
);

CREATE UNIQUE INDEX INDEX_FRIENDS1 ON friends (emailUser1, emailUser2);
CREATE UNIQUE INDEX INDEX_FRIENDS2 ON friends (emailUser2, emailUser1);

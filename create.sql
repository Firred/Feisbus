CREATE DATABASE IF NOT EXISTS Facebluff;
USE Facebluff;

CREATE TABLE IF NOT EXISTS users (
	email varchar(254) PRIMARY KEY NOT NULL,
    name varchar(60) NOT NULL,
    pass varchar(20) NOT NULL,
    gender varchar(1),
    birthday DATE,
    picture varchar(100),
    points int(9) UNSIGNED NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS friends (
	emailUser1 varchar(254) NOT NULL,
	emailUser2 varchar(254) NOT NULL,
    accepted tinyint(1) DEFAULT 0,
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
	emailUser varchar(254) NOT NULL,
	idQuestion int(9) UNSIGNED NOT NULL,
    text varchar(200) NOT NULL,
    PRIMARY KEY (emailUser, idQuestion),
    CONSTRAINT FK_USER FOREIGN KEY (emailUser) REFERENCES users (email),
    CONSTRAINT FK_USERQUESTION FOREIGN KEY (idQuestion) REFERENCES questions (id)  
);

CREATE TABLE IF NOT EXISTS friendAnswer (
    emailUser varchar(254) NOT NULL,
	idQuestion int(9) UNSIGNED NOT NULL,
    emailFriend varchar(254) NOT NULL,
    correct tinyint(1) DEFAULT 0,
    PRIMARY KEY (emailUser, idQuestion, emailFriend),
    CONSTRAINT FK_AUSER FOREIGN KEY (emailUser) REFERENCES users (email),
    CONSTRAINT FK_FRIENDQUESTION FOREIGN KEY (idQuestion) REFERENCES questions (id),
    CONSTRAINT FK_AFRIEND FOREIGN KEY (emailFriend) REFERENCES users (email)
);

CREATE TABLE IF NOT EXISTS photos (
    id int(20) UNSIGNED AUTO_INCREMENT NOT NULL PRIMARY KEY,
    name varchar(100) NOT NULL,
    userEmail varchar(254) NOT NULL,
    description varchar(400),
    CONSTRAINT FK_PUSER FOREIGN KEY (userEmail) REFERENCES users (email)
);

INSERT INTO `questions` (`id`, `text`) VALUES (NULL, '¿Cuál es la peor película de la historia?');
INSERT INTO `questions` (`id`, `text`) VALUES (NULL, '¿En qué escuela primaria estudiaste?');
INSERT INTO `questions` (`id`, `text`) VALUES (NULL, '¿Nintendo switch, PS4 o XBOX ONE?');
INSERT INTO `questions` (`id`, `text`) VALUES (NULL, '¿Cuál es tu plato favorito?');
INSERT INTO `questions` (`id`, `text`) VALUES (NULL, '¿Cuál es el personaje más irritante de Juego de Tronos?');
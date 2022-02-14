
-- create database KlinkDB_local;
use KlinkDB_local;

/*
create table PapersSaved
(
    pk int AUTO_INCREMENT,
    dataid int,
    InteractionTime timestamp,
    PRIMARY KEY (pk)
);

create table IEEEData
(
    pk int AUTO_INCREMENT,
    dataid int,
    search_query varchar(100),
    paper_seq int,
    ieeedata varchar(50000),
    PRIMARY KEY (dataid)
);

create table KLinkSearch_Logs
(
    Kpk int AUTO_INCREMENT,
    Pid int,
    Taskid int,
    InteractionDescription varchar(50),
    InteractionValue varchar(100),
	InteractionTime timestamp,
    PageName varchar(20),
    PRIMARY KEY (Kpk)
);

create table BaselineSearch_Logs
(
    Bpk int AUTO_INCREMENT,
    Pid int,
    Taskid int,
    InteractionDescription varchar(50),
    InteractionValue varchar(100),
	InteractionTime timestamp,
    PageName varchar(20),
    PRIMARY KEY (Bpk)
);
*/
-- select * from IEEEData where search_query='google';

 SET SQL_SAFE_UPDATES = 0;
-- delete from IEEEData where paper_seq=26;
-- SET SQL_SAFE_UPDATES = 0;
 -- delete from BaselineSearch_Logs;

 select * from KLinkSearch_Logs order by InteractionTime desc;
 
 -- select * from BaselineSearch_Logs order by InteractionTime desc;

-- select * from IEEEData;



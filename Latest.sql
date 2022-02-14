use KlinkDB_local;

/*
create table IEEEData
(
    dataid int AUTO_INCREMENT,
    docid int,
    search_query varchar(100),
    paper_seq int,
    ieeedata varchar(50000),
    PRIMARY KEY (dataid)
);

select * from IEEEData where search_query= 'google' and paper_seq=1;

SET SQL_SAFE_UPDATES = 0;
 -- drop table IEEEData;

-- delete from IEEEData where search_query = 'undefined';
ALTER TABLE IEEEData CHANGE `pk` `dataid` int;
*/

 select * from KLinkSearch_Logs;

-- delete from KLinkSearch_Logs;


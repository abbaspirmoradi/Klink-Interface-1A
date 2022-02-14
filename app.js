const express = require("express");
const app = express();
const dbconn = require('./database/config');
const fetch = require('node-fetch');
const bodyParser = require("body-parser");
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();
var request = require("request");
var sleep = require('system-sleep');

var apiresponse = {};
var docids = [];
var totalrecs = 0;

dbconn.connect(function(err) {
    if (err) throw err;
    else console.log("db connected");
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Display as per search term
//app.get('/DLSIapi/v0/ieeedata/:term/:pagenumber', async(request, response) => {
///// new updates for pagination

app.get('/DLSIapi/v1/ieeedata/:term/:pn', async(request, response) => {
    docids = []; //imp....
    var searchterm = request.params.term;
    var pagenumber = request.params.pn;
    console.log("search tearm:", searchterm, "page# = ", pagenumber);

    if (searchterm == undefined || searchterm == "") {
        response.status(404).send({
            success: 'false',
            json: {} //cache DB schema
        })
        console.log("No data recieved for empty string");
    } else {
        var baseurl = 'https://ieeexplore.ieee.org/rest/search';
        var reqbody = { "newsearch": true, "queryText": searchterm, "highlight": true, "returnFacets": ["ALL"], "returnType": "SEARCH", "matchPubs": true, "pageNumber": pagenumber }

        axios({
            method: 'post',
            url: baseurl,
            headers: {
                'Origin': 'https://ieeexplore.ieee.org',
                'Accept': 'application/json, text/plain',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
                'Accept-Language': 'en-ca'
            },
            data: reqbody
        }).then(response => {
            if (response.status === 200) {
                //response.data = full response on browser
                const data = response.data.records;
                totalrecs = response.data.totalRecords;
                console.log("total recsss----------", totalrecs);

                if (totalrecs == 0) {
                    return 0;
                } else {
                    for (j = 0; j < data.length; j++) {
                        // console.log(data[j].articleNumber);
                        docids.push(data[j].articleNumber);
                    }
                    return docids;
                }
            }
        }).then(function(docids) {
            // console.log("docidsss.....", docids);
            //read data ids and query IEEE API to get papers
            if (docids == 0) {
                response.status(404).send({
                    success: 'false',
                    json: {} //cache DB schema
                })
            }
            GetdatafromCacheDB(searchterm, pagenumber)
                .then(function(cachedata) { //send cache data
                    response.status(200).send({
                        success: 'true',
                        json: cachedata //cache DB schema
                    })
                })
                .catch( //data not in cache 
                    function(e) {
                        console.log("get data from API");
                        //  console.log("e val;;;;", e);
                        GetfromIEEEApiusingDocID(docids, pagenumber, searchterm)
                            .then(
                                function(idata) {
                                    console.log("Yayyyy!! GOt the data from Api");
                                    //    console.log("idata length", idata);
                                    console.log("idata length", idata.length);

                                    Storejson_inCacheusingDocID(docids, idata, searchterm, pagenumber)
                                        .then(
                                            function(newcdata) {
                                                console.log("Cool!! Saved data in cache");
                                                console.log("Total papers saved:", newcdata.length);
                                                GetdatafromCacheDB(searchterm, pagenumber)
                                                    .then(function(datatosend) {
                                                        console.log("---------------------");
                                                        // console.log("THE CACHE DATA TO SEND....", datatosend);
                                                        //send data to UI
                                                        response.status(200).send({
                                                            success: 'true',
                                                            json: datatosend //cache DB schema
                                                        })
                                                        console.log('Cache DB after Api fetch and save');
                                                    })
                                                    .catch("Error after store data fetch!")
                                            })
                                        .catch(
                                            function(e) {
                                                console.log("Error in saving papers");
                                            })
                                }
                            ) //getApi then
                            .catch(function(e) {
                                response.status(200).send({
                                    success: 'true',
                                    json: {} //cache DB schema
                                })
                                console.log("No data recieved from IEEE API");
                            }) //getApi catch
                            //store data in cache
                    })
        });
    } //else not empty searchterm
});

function GetfromIEEEApiusingDocID(docidarr, pagenumber, searchterm) {
    console.log("docids in IEEE fetch=", docidarr);

    return new Promise(function(resolve, reject) {
        var Allpapers = [];
        var startrec = (pagenumber - 1) * 25 + 1;

        console.log("docidarr.length=====", docidarr.length);
        for (d = 0; d < docidarr.length; d++) {
            ////******* nowwwwww */  for (d = 0; d < 1; d++) {
            Allpapers.push(GetonepaperbyDocID(docidarr[d]));
            console.log("Allpapers length", Allpapers.length);
            // console.log("Allpapers for d=", d, "---------", Allpapers);
            /*
            if (d > 0 && d % 8 == 0) { //hack for javasc
                console.log("inside %8");
                sleep(1 * 1000);
            }
            */
        } //for
        //net 9
        // console.log("outside allpaper....", Allpapers);

        Promise.all(Allpapers)
            .then((results) => {
                console.log("All done", results.length);
                resolve(results);
            })
            .catch((e) => {
                console.log("Error in get from IEEE, waiting... 1s");
                // sleep(1 * 1000);
                reject("Error in get from IEEE:::", e);
            });

        function GetonepaperbyDocID(docid) {
            //  console.log("in GetonepaperbyDocID");
            return new Promise(function(resolve, reject) {
                const docurl = 'http://ieeexplore.ieee.org/document/' + docid + '/keywords#keywords'; //7753150/keywords#keywords';
                // docurl = docurl + docid + '/keywords#keywords';
                console.log('myurl:', docurl);

                var fpromise =
                    axios(docurl)
                    // axios.get(docurl, { headers: { 'Access-Control-Allow-Origin': '*' } })
                    .then(function(response) {
                        console.log("status====", response.status);
                        if (response.status == 200) {
                            // console.log("html.==", response.data);
                            //fs.writeFile('onepaperdata.txt', response.data, () => {});
                            const html = response.data;
                            //  var totalrecs = response.data;
                            console.log('processing response');

                            const $ = cheerio.load(html);
                            //fs.writeFile('kwdata.txt', html, () => {});
                            var htmlstring = $.html();
                            var thispaper = htmlstring.split('xplGlobal.document.metadata=').pop().split(';\n')[0];

                            //console.log("thispaper", thispaper);

                            thispaper = JSON.parse(thispaper);
                            // console.log("thispaper.citationCountPaper==", thispaper.sections.citedby, "---", thispaper.metrics.citationCountPaper);
                            // console.log("total recsss----------", totalrecs);
                            console.log("this")
                            var ieeeformat = {
                                    "totalrecords": totalrecs.toString(),
                                    "doi": "",
                                    "title": "",
                                    "publisher": "",
                                    "publication_year": "",
                                    "authors": "",
                                    "displayPublicationTitle": "",
                                    "content_type": "",
                                    "citedby": false,
                                    "citationCountPaper": 0,
                                    "abstract": "",
                                    "article_number": "",
                                    "pdf_url": "",
                                    "isOpenAccess": false,
                                    "index_terms": {
                                        "ieee_terms": { "terms": [] },
                                        "author_terms": { "terms": [] },
                                        "ci_terms": { "terms": [] }
                                        //  "Non-Controlled Indexing": { "terms": [] }
                                    }
                                }
                                //console.log("ieee terms:", thispaper.keywords[3].kwd);
                                //assign from parsed data
                            ieeeformat.doi = thispaper.doiLink;
                            ieeeformat.title = thispaper.title;
                            ieeeformat.publisher = thispaper.publisher;
                            ieeeformat.publication_year = thispaper.publicationYear;
                            ieeeformat.authors = thispaper.authors;
                            ieeeformat.displayPublicationTitle = thispaper.displayPublicationTitle;
                            ieeeformat.content_type = thispaper.content_type;
                            ieeeformat.citedby = thispaper.sections.citedby;
                            ieeeformat.citationCountPaper = thispaper.metrics.citationCountPaper;
                            ieeeformat.abstract = thispaper.abstract;
                            ieeeformat.isOpenAccess = thispaper.isOpenAccess;
                            ieeeformat.article_number = thispaper.articleNumber;
                            ieeeformat.pdf_url = thispaper.pdfUrl;

                            if (docid == 'EDP377')
                                console.log("thispaper.keywords=", thispaper.keywords);

                            if (thispaper.keywords != undefined) {
                                if (thispaper.keywords[0] != undefined)
                                    ieeeformat.index_terms.ieee_terms.terms = thispaper.keywords[0].kwd;

                                if (thispaper.keywords[1] != undefined)
                                    ieeeformat.index_terms.ci_terms.terms = thispaper.keywords[1].kwd;

                                if (thispaper.keywords[3] != undefined)
                                    ieeeformat.index_terms.author_terms.terms = thispaper.keywords[3].kwd;
                            } else {
                                ieeeformat.index_terms.ieee_terms.terms = [];
                                ieeeformat.index_terms.author_terms.terms = [];
                                ieeeformat.index_terms.ci_terms.terms = [];
                            }
                            // console.log(typeof ieeeformat); //object
                            //console.log(ieeeformat);
                            console.log("returning paper for docid = ", docid);
                            return (ieeeformat);
                        }
                        console.log("returning blankkkkkk for docid = ", docid);
                        return ("");
                    }, function(e) {
                        console.error('Error in mapping Api fetch json response', e);
                        reject("error in getAPi");
                    });
                resolve(fpromise);
            }); //GetonepaperbyDocID promise
        } //fn end
    }); //main promise
}


function GetdatafromCacheDB(searchterm, pagenumber) {
    console.log("executing to check if present in chache on page change......");
    // var pseq = (pagenumber - 1) * 25 + 1;
    // console.log("pseq===", pseq);

    var startseq = (pagenumber - 1) * 25 + 1;
    var endseq = startseq + 24;
    //var checkdatasql = `SELECT * FROM IEEEData where search_query = ? and paper_seq >=? and paper_seq <=? and search_query != ?`;
    var checkdatasql = `SELECT * FROM IEEEData where search_query = ? and paper_seq >=? and paper_seq <=?`;
    console.log("PN======", pagenumber, "startseq=", startseq, "endseq=", endseq);

    // var checkd = [searchterm, startseq, endseq, 'undefined'];
    var checkd = [searchterm, startseq, endseq];
    return new Promise(function(resolve, reject) {
        dbconn.query(checkdatasql, checkd, function(err, cacheresult, fields) {
            console.log("length output in GetdatafromCacheDB....:::", cacheresult.length);
            if (err) reject("error in executing the sql query:", err);
            else if (cacheresult.length == 0)
                reject('no data in cache'); //reject error response
            else
                resolve(cacheresult);
        })
    })
}

function Storejson_inCacheusingDocID(docids, ieeedata, searchterm, pagenumber) {
    // console.log("json:::", ieeedata);
    console.log("Total papers available from IEEE Api =", ieeedata.length);
    return new Promise(function(resolve, reject) {
            var InsertDBPromises = [];
            var n = 25; //fetch 25 papers from API

            if (ieeedata.length < n)
                n = ieeedata.length;

            for (var i = 0; i < n; i++) {
                var thispaper = ieeedata[i];
                var thispaperstring = JSON.stringify(thispaper);
                //thispaperstring = thispaperstring.slice(1, -1);

                var IEEEDatadump_data = [docids[i], searchterm, (((pagenumber - 1) * 25) + i) + 1, thispaperstring];
                var Datadumpsql = `INSERT INTO IEEEData (docid, search_query,paper_seq,ieeedata) VALUES (?,?,?,?)`;

                InsertDBPromises.push(new Promise(function(resolve, reject) {
                        dbconn.query(Datadumpsql, IEEEDatadump_data, function(err, dresult, fields) {
                                //   console.log("inserting data in local DB....:::");
                                if (err) Promise.reject(new Error('woops'));
                                else {
                                    var paperid = dresult.insertId;
                                    //  console.log("data table done:", i);
                                    //   console.log("paperid:::: ", paperid);
                                    //  resolve(dresult.length);
                                }
                            })
                            //  resolve(dresult);
                        resolve(1);
                    })) //promise
            }
            console.log("All data inserted in local DB....:::");
            resolve(InsertDBPromises);
            // return InsertDBPromises;
        }) //return promise
}

function GetdatafromCacheDBforWorkspaceusingDocID(dataid) {
    var checkdatasql = `SELECT * FROM IEEEData where dataid = ?`;

    return new Promise(function(resolve, reject) {
        dbconn.query(checkdatasql, dataid, function(err, cacheresult, fields) {
            console.log("length output for WS fetch....:::", cacheresult.length);
            if (err) reject("error in executing the sql query:", err);
            else if (cacheresult.length == 0)
                resolve(''); //send empty response
            else
                resolve(cacheresult);
        })
    })
}

app.get('/DLSIapi/v0/cachedata/:id', async(request, response) => {
    const dataid = request.params.id;
    console.log("dataid:", dataid);

    GetdatafromCacheDBforWorkspaceusingDocID(dataid)
        .then(function(data) {
            if (data.length == 0) {
                response.status(404).send({
                    success: 'false',
                    json: 'Error in WS data fetch' //cache DB schema
                })
            } else {
                response.status(200).send({
                    success: 'true',
                    json: data //cache DB schema
                })
                console.log('Data sent to UI from Cache DB');
            }
        });
});

// add router in the Express app.
app.use("/", router)

app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
    response.sendFile('index.html');
});

const PORT = 5002;
app.listen(PORT, () => {
    console.log(`server (NodeJS Api) running on port ${PORT}`)
});
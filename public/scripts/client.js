//var instanceURL = "http://ec2-35-183-238-235.ca-central-1.compute.amazonaws.com:5002";
var instanceURL = "http://localhost:5002"; //http imp. to avoid CORES error

var Usefulkws = [];
var searchterm;
var currsearchterm;
var reloadflag = 0;
var pid;
var taskid;
var pagenumber = 1;
var savedpapersDict = [];
var savedkeywordsDict = []; //[{ word: '', color: ''}];


Object.keys(sessionStorage).map(function(c, i, a) {
    let d = sessionStorage.getItem(sessionStorage.key(i));
    if (c == 'savedkws')
        savedkeywordsDict = JSON.parse(d);
    else
    if (c == 'savedDict') savedpapersDict = JSON.parse(d);
});

var pagenav_class = document.getElementsByClassName("pagenumber");

var pagenav_handler = function() {
    showLoader();
    window.scrollTo(0, 0); //scroll to top
    pagenumber = this.innerText;
    let sp = (pagenumber - 1) * 25 + 1;
    let ep = sp + 24;
    //localStorage.setItem('previous_page', 'index' + pagenumber);

    d3.select('body').select("#startpaper").text(sp.toString());
    d3.select('body').select("#endpaper").text(ep.toString());
    // sessionStorage.setItem('pagenumber', pagenumber);
    var thiselement = (d3.select(this)._groups[0])[0];
    //activate that number on UI
    //console.log("clicked paper# ", this.parentNode.childNodes);
    for (i = 0; i < this.parentNode.childNodes.length; i++) {
        var e = this.parentNode.childNodes[i];
        if (i % 2 != 0 && e.className != undefined)
            d3.select(e).classed("activepage", false);
    }

    d3.select(thiselement).classed("activepage", true);

    //call api and visualise
    let searchq = document.getElementById("tb_search").value;
    console.log("searchq==", searchq);

    var apicall_onpagechange = instanceURL + '/DLSIapi/v1/ieeedata/' + searchq + '/' + pagenumber;
    d3.json(apicall_onpagechange, function(data) {
        // console.log("loading results for page change interactions!");
        //  console.log("data recieved from API version2=", data.json);
        reloadflag = 1;
        clearSERPs();
        if (data == null) {
            alert("Your query did not return any search results");
            window.location.reload();
        } else {
            visualiseResults(data.json, searchq);
        }
        //  localStorage.setItem('previous_page', 'navpage');
        // visualiseResults(data.json, searchq);
    });
};

for (var i = 0; i < pagenav_class.length; i++) {
    pagenav_class[i].addEventListener('click', pagenav_handler, false);
}


//check for Navigation Timing API support
if (window.performance) {
    console.info("window.performance works fine on this browser");
}

if (performance.navigation.type == 1) {
    localStorage.setItem('previous_page', 'indexpage');
    /* Search query should be shown in searchbox and it should be in focus*/
    if (currsearchterm != undefined)
        document.getElementById("tb_search").value = currsearchterm;
    document.getElementById("tb_search").focus();
    reloadflag = 1;
    clearSERPs();
} else {
    console.log("pn=====", pagenumber);
    //load function defination
    console.info("This page loaded!!!");
    console.log("savedpapersDict = ", savedpapersDict);

    currsearchterm = localStorage.getItem('curruserterm');

    pid = localStorage.getItem('pid');
    taskid = localStorage.getItem('taskid');

    /* Search query should be shown in searchbox and it should be in focus*/
    if (currsearchterm != undefined)
        document.getElementById("tb_search").value = currsearchterm;
    document.getElementById("tb_search").focus();


    if (sessionStorage.getItem('cookie') == null) {
        /*
        searchterm = localStorage.getItem('userterm');
        document.getElementById("tb_search").value = searchterm;

        var apicall = instanceURL + '/DLSIapi/v1/ieeedata/' + searchterm + '/' + 1; //instanceURL + '/DLSIapi/v0/ieeedata/' + searchterm;

        d3.json(apicall, function(data) {
            if (data == null) {
                alert("Your query did not return any search results");
                window.location.reload();
            } else {
                visualiseResults(data.json, searchterm);
            }
        });
        */
        window.location.reload();
        sessionStorage.setItem('cookie', 'mycookie');
        // console.log("localStorage after set:", sessionStorage.getItem('cookie'));
    } else {
        //this page was reloaded
        clearSERPs();
        // console.log("currsearchterm==", currsearchterm);
        if (currsearchterm != null) {
            if (currsearchterm.length > 0) {
                //call vis fun on prev search term
                var apicall = instanceURL + '/DLSIapi/v1/ieeedata/' + currsearchterm + '/' + 1; //instanceURL + '/DLSIapi/v0/ieeedata/' + currsearchterm;
                d3.json(apicall, function(data) {
                    //     console.log("LOADING RESULTS FOR LOAD..");
                    if (data == null) {
                        alert("Your query did not return any search results");
                        window.location.reload();
                    } else {
                        visualiseResults(data.json, currsearchterm);
                    }
                });
            }
        } else {
            currsearchterm = localStorage.getItem('userterm');
            //call vis fun on prev search term
            var apicall = instanceURL + '/DLSIapi/v1/ieeedata/' + currsearchterm + '/' + 1; //instanceURL + '/DLSIapi/v0/ieeedata/' + currsearchterm;
            d3.json(apicall, function(data) {
                //     console.log("LOADING RESULTS FOR LOAD..");
                if (data == null) {
                    alert("Your query did not return any search results");
                    window.location.reload();
                } else {
                    visualiseResults(data.json, currsearchterm);
                }
            });
        }
    }
}

function clearSERPs() {
    //  if (reloadflag == 1) {
    //delete all rows of resultbody
    $("#resultbody tr").remove();
    // sessionStorage.clear();
    document.getElementById("txt_output").style.visibility = 'hidden';
    document.getElementById("searchquery").style.visibility = 'hidden';
    document.getElementById("paper_col").style.visibility = 'hidden';
    document.getElementById("keyword_col").style.visibility = 'hidden';
    document.getElementById("navigation_page").style.visibility = 'hidden';

}

var searchbox = document.getElementById("tb_search");
var searchbutton = document.getElementById("img_search");

searchbox.addEventListener("keypress", loadsearchresults);
searchbutton.addEventListener("click", loadsearchresults);

function loadsearchresults(event) {
    if (event.keyCode == 13 || event.which == 13 || event.type == 'click') { //event.which == 1 (left button)
        ////  loadworkspace();
        showLoader();
        reloadflag = 1;
        clearSERPs();
        searchterm = searchbox.value;
        // localStorage.setItem('curruserterm', searchterm);
        pagenumber = 1;
        var np = document.getElementById("navigation_page");
        //   console.log("np=====", np);
        for (i = 0; i < np.childNodes.length; i++) {
            var e = np.childNodes[i];
            if (i % 2 != 0 && e.className != undefined)
                d3.select(e).classed("activepage", false);
        }
        // console.log("searchterm bfffff call=====", searchterm);
        if (searchterm == '') {
            alert("Please enter non empty search term");
            window.location.reload();
        } else if (searchterm != '') {
            var apicall = instanceURL + '/DLSIapi/v1/ieeedata/' + searchterm + '/' + pagenumber; //instanceURL + '/DLSIapi/v0/ieeedata/' + searchterm

            d3.json(apicall, function(data) {
                // console.log("sttttttt", data.length);
                if (data == null) {
                    alert("Your query did not return any search results");
                    window.location.reload();
                } else {
                    visualiseResults(data.json, searchterm);
                }
            });
        }
    }
}

function getCurrentTS() {
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var ts = date + ' ' + time;
    return ts;
}


$(window).load(function() {
    // Animate loader off screen
    $(".se-pre-con").fadeOut("slow");
    // showLoader();
    // setTimeout(removeLoader, 2000);
});

function removeLoader() {
    $("#loadingDiv").fadeOut(500, function() {
        // fadeOut complete. Remove the loading div
        $("#loadingDiv").remove(); //makes page more lightweight 
    });
}

function showLoader() {
    $('body').append('<div style="" id="loadingDiv"><div class="loader"> <div id="loadtext">Getting results...</div></div></div>');
}


function visualiseResults(data, searchterm) {
    //showLoader();
    //NOTE: do not print data.length.. breaks backend
    if (data.length == undefined || data.length == 0) {
        alert("No data recieved. Try a new query");
        document.getElementById('txt_output').style.visibility = 'hidden';
        document.getElementById('page1').style.visibility = 'hidden';
        document.getElementById('page2').style.visibility = 'hidden';
        document.getElementById('page3').style.visibility = 'hidden';
        document.getElementById('page4').style.visibility = 'hidden';
        document.getElementById('page5').style.visibility = 'hidden';
    } else {
        let ei = data.length - 1;
        d3.select('body').select("#startpaper").text(data[0].paper_seq.toString());
        d3.select('body').select("#endpaper").text(data[ei].paper_seq.toString());
        // d3.select('body').select("#totalrecordsfromAPI").text('125'); //note
        let tr = JSON.parse(data[0].ieeedata);
        console.log(tr.totalrecords);
        d3.select('body').select("#totalrecordsfromAPI").text(tr.totalrecords); //note 
        d3.select('body').select("#searchquery").text(searchterm);

        if (data.length < 25)
            d3.select('body').select("#totalrecordsfromAPI").text(data.length.toString());

        setpaginationvis(data.length, searchterm);

        console.log("searchterm:", searchterm);

        document.getElementById("txt_output").style.visibility = 'visible';
        document.getElementById("searchquery").style.visibility = 'visible';
        document.getElementById("paper_col").style.visibility = 'visible';
        document.getElementById("keyword_col").style.visibility = 'visible';
        document.getElementById("navigation_page").style.visibility = 'visible';

        if (pagenumber == 1) {
            document.getElementById("page1").style.backgroundColor = 'lightblue';
        } else document.getElementById("page1").style.backgroundColor = '';

        var resultsbody = d3.select('body').select('table').select('#resultbody'); //.attr("id", "resultbody"); 
        //loop through data and remove the papers without doi (these are not imp)

        for (d = 0; d < data.length; d++) {
            let tp = JSON.parse(data[d].ieeedata);
            // console.log('data:::', tp);
            if (tp.doi == undefined) {
                data.splice(d, 1);
                //  console.log("title for null doi=", tp.title);
            }
        }
        console.log('data after update:::', data);
        // if (data.ieeedata != null) {
        columns = ['Paper Details', 'Keywords'];

        // create a row for each object in the data
        var rows = resultsbody.selectAll("tr") // rbody.selectAll("tr")
            .data(data)
            .enter()
            .append("tr")
            .attr('id', 'Main_row')
            .style('border-bottom', '1px solid #ccc');

        // create a cell in each row for each column
        var cells = rows.selectAll("td")
            .data(function(row) {
                return columns.map(function(column) {
                    return { column: column, value: row[column] };
                });
            })
            .enter()
            .append("td") //append td in each column (2 here)
            .attr('class', 'serpcolumn'); //should be class for consistency

        var papercol = d3.selectAll(".papercolumn");

        var title_row = rows.select("td").data(data)
            .append('tr')
            .attr("id", "ptitle")
            .classed('clickable', true)
            .html(function(d, i) {
                // console.log("i:", d.ieeedata);
                let r = JSON.parse(d.ieeedata);
                return r.title;
            })
            .on("click", getFullpaper)
            //for WS fetch
            .append('p')
            .attr("id", "dbid")
            .style("display", "none")
            .html(function(d, i) {
                return d.dataid;
            });

        var authors_row = rows.select("td").data(data) //runs 25 times because of rows
            .append('tr')
            .attr('class', 'authors_disp')
            .style('font-weight', 400)
            .html(function(d, i) {
                let r = JSON.parse(d.ieeedata);
                // console.log(r.authors);
                let authors = "";
                if (r.authors == undefined || r.authors.length == 0) {
                    // console.log("retuning null for...", r.authors);
                    return "";
                } else {
                    for (i = 0; i < (r.authors.length) - 1; i++) {
                        authors = authors + r.authors[i].name + ' ; ';
                    }
                    authors = authors + r.authors[i].name;
                    return authors;
                }
            });

        //   displayPublicationTitle
        var PublicationTitle = rows.select("td").data(data)
            .append('tr')
            .attr('class', 'publication_disp')
            .style('font-weight', 400)
            .html(function(d, i) {
                let r = JSON.parse(d.ieeedata);
                // console.log(r.authors);
                return r.displayPublicationTitle;
            });


        var contentType_row = rows.select("td").data(data)
            .append('tr')
            .attr('class', 'contentType')
            .classed('margintop_space', true)
            //.classed('runningBlue', true)
            .append('tr')
            .html(function(d, i) {
                let r = JSON.parse(d.ieeedata);
                return r.publication_title;
            })
            .append('tr')
            .style('font-weight', 400)
            .style('color', 'black')
            .html(function(d, i) {
                let r = JSON.parse(d.ieeedata);
                let contenttype = r.content_type;
                if (r.content_type == 'Conferences') contenttype = 'Conference Paper';
                if (r.content_type == 'Journals') contenttype = 'Journal Article';
                if (r.content_type == 'Early Access Articles')
                    contenttype = 'Early Access Article';
                if (r.publication_year == undefined) return contenttype + " | Publisher: " + r.publisher;
                if (contenttype == undefined) return "Year: " + r.publication_year + " | Publisher: " + r.publisher;

                return "Year: " + r.publication_year + " | " + contenttype + " | Publisher: " + r.publisher;
            });

        //   citationCountPaper
        var citationCountPaper = rows.select("td").data(data)
            .append('tr')
            .attr('class', 'citation_disp')
            .style('font-weight', 400)
            .html(function(d, i) {
                let r = JSON.parse(d.ieeedata);
                if (r.citationCountPaper > 0) {
                    return "Cited by: Papers (" + r.citationCountPaper.toString() + ")";
                }
                return "";
            })
            .classed('clickable', true)
            .classed('runningBlue', true)
            .on("click", function(d, i) {
                let r = JSON.parse(d.ieeedata);
                let curl = "https://ieeexplore.ieee.org/document/" + r.article_number + "/citations?tabFilter=papers#citations";
                window.open(curl);
            });

        var papertext_row = rows.select("td").data(data)
            .append('tr')
            .attr('id', 'papertext_row')

        .append('th')
            .attr('id', 'display_triangle')
            .classed('clickable', true)
            .attr('class', 'triangle-right')
            .on("click", abstract_click); //Show abstract content

        rows.select("#papertext_row").data(data)
            .append('th')
            // .append('div')
            .text('Abstract')
            .classed('clickable', true)
            .classed('runningBlue', true)
            //  .style('padding-top', 10)
            .attr('id', 'abstract_msg')
            .on("click", abstract_click); //Show abstract content

        rows.select("#papertext_row").data(data)
            .append('th')
            .append('svg')
            .attr('height', '25')
            .attr('width', '55')
            .style('padding-top', 10)
            .append('svg:image')
            .attr('id', 'htmlicon')
            .classed('clickable', true)
            .attr('xlink:href', 'images/html-icon.png')
            // .attr('height', '25')
            //  .attr('width', '25')
            .on("click", getFullpaper); //Show full content

        rows.select("#papertext_row").data(data)
            .append('th')
            .append('svg')
            .attr('height', '25')
            .attr('width', '55')
            .style('padding-top', 8)
            .append('svg:image')
            .attr('id', 'img_fulltext')
            .classed('clickable', true)
            .attr('xlink:href', 'images/pdf.png')
            .attr('height', '25')
            .attr('width', '25')
            .on("click", getFullpaper); //Show full content

        rows.select("#papertext_row").data(data)
            .append('th')
            .append('svg')
            .attr('height', '25')
            .attr('width', '55')
            .style('padding-top', 8)
            .append('svg:image')
            //.classed('clickable', true)
            .attr('xlink:href', 'images/cr-icon.png')
            .attr('height', '25')
            .attr('width', '25');

        var abstracttext = rows.select("td").data(data)
            .append('tr')
            .attr('id', 'abstract_text')
            .classed('invisible', true)
            .html(function(d, i) {
                let r = JSON.parse(d.ieeedata);
                return r.abstract;
            });

        var kwcol = rows.selectAll('td')
            .filter(function(d, i) { if (d.column == "Keywords" || i == 1) return d; })
            .attr('class', 'kwcolumn');

        //data parsing
        Usefulkws = [];

        for (k = 0; k < data.length; k++) {
            if (data[k].ieeedata != null) {
                let r = JSON.parse(data[k].ieeedata);
                if (r.index_terms != undefined) {
                    // let t = r.index_terms.ieee_terms;
                    // let a = r.index_terms.author_terms;
                    //   console.log("t=", t);
                    //   console.log("======================");
                    let t = r.index_terms.ieee_terms;
                    let a = r.index_terms.author_terms;

                    if (a.terms.length > 0) {
                        if (a.terms[0].includes(',') == true) {
                            let n = a.terms[0].split(',')
                            Usefulkws.push(n);
                        }
                        if (a.terms[0].includes(';') == true) {
                            let n = a.terms[0].split(';')
                            Usefulkws.push(n);
                        } else {
                            Usefulkws.push(a.terms);
                        }
                    } else {
                        //    console.log("a is undefined....... get ieee terms for i=", k);
                        if (t.length == 0 || t === undefined) {
                            Usefulkws.push(["--"]);
                            //Call keyword generator algorithm by inpur abstract text
                        } else {
                            if (t.terms[0] != undefined && t.terms[0].length > 0) {
                                if (t.terms[0].startsWith('and')) t.terms[0].replace('and', '');
                                if (t.terms[0].includes(',') == true) {
                                    let n = t.terms[0].split(',')
                                    Usefulkws.push(n);
                                }
                                if (t.terms[0].includes(';') == true) {
                                    let n = t.terms[0].split(';')
                                    Usefulkws.push(n);
                                } else { Usefulkws.push(t.terms); }
                            }
                        }
                    }
                }
            }
        }

        //cleaning keywords
        let testkw = "";
        for (uk = 0; uk < Usefulkws.length; uk++) {
            for (c = 0; c < Usefulkws[uk].length; c++) {
                testkw = (Usefulkws[uk])[c];
                if (testkw.startsWith('-')) {
                    testkw = testkw.replace('-', '');
                    (Usefulkws[uk])[c] = testkw.trim();
                } else if (testkw.startsWith('and')) {
                    testkw = testkw.replace('and', '');
                    (Usefulkws[uk])[c] = testkw.trim();
                }
                if (testkw.includes('$')) {
                    let keywordrem = testkw.substring(testkw.indexOf("$"), testkw.lastIndexOf("$") + 1);
                    (Usefulkws[uk])[c] = (testkw.replace(keywordrem, '')).trim();
                }
                //for acronym keywords
                if (testkw.includes('(') || testkw.includes(')')) {
                    let keywordrem = testkw.substring(testkw.indexOf("("), testkw.lastIndexOf(")") + 1);
                    (Usefulkws[uk])[c] = (testkw.replace(keywordrem, '')).trim();
                }
            }
        }


        var newkw = d3.selectAll(".kwcolumn").append('th').attr('class', 'Allkw_col');

        var Allkeywords = newkw.data(Usefulkws);

        var Allkw_groups = Allkeywords.selectAll("author_groups")
            .data(d => d)
            .enter()
            .append("tr")
            .attr('class', 'onekwrow');

        Allkw_groups
            .append("th")
            .attr('class', 'one_kw')
            .html(function(keyword, i) { return keyword; });


        syncSelectedLKW();
    }
    removeLoader();
    //highlight search terms in document titles
    var myHilitor = new Hilitor("resultbody"); // id of the element to parse
    myHilitor.apply(searchterm);
} //visualiseResults fn


function setpaginationvis(datalen, searchterm) {
    if (datalen == 25) {
        document.getElementById('txt_output').style.visibility = 'visible';
        document.getElementById('page1').style.visibility = 'visible';
        document.getElementById('page2').style.visibility = 'visible';
        document.getElementById('page3').style.visibility = 'visible';
        document.getElementById('page4').style.visibility = 'visible';
        document.getElementById('page5').style.visibility = 'visible';
    }

    if (datalen < 25) {
        document.getElementById('txt_output').style.visibility = 'hidden';
        //  document.getElementById('page1').style.visibility = 'hidden';
        document.getElementById('page2').style.visibility = 'hidden';
        document.getElementById('page3').style.visibility = 'hidden';
        document.getElementById('page4').style.visibility = 'hidden';
        document.getElementById('page5').style.visibility = 'hidden';
    }
    if (datalen > 25 && datalen < 50) {
        document.getElementById('txt_output').style.visibility = 'hidden';
        document.getElementById('page3').style.visibility = 'hidden';
        document.getElementById('page4').style.visibility = 'hidden';
        document.getElementById('page5').style.visibility = 'hidden';
    }
    if (datalen > 50 && datalen < 75) {
        document.getElementById('txt_output').style.visibility = 'hidden';
        document.getElementById('page4').style.visibility = 'hidden';
        document.getElementById('page5').style.visibility = 'hidden';
    }
    if (datalen > 75 && datalen < 100) {
        document.getElementById('txt_output').style.visibility = 'hidden';
        document.getElementById('page5').style.visibility = 'hidden';
    }
}


function CheckifSameColorPresentInSERPs(ptr_addsvg) {
    let presentflag = false; //by default not present
    let FullCOl1 = d3.select(ptr_addsvg.parentNode.parentNode.previousElementSibling);
    let Allsvgsofthiscol1 = (FullCOl1._groups[0])[0].childNodes[0].childNodes;

    if (Allsvgsofthiscol1.length != 0) {
        for (sc = 0; sc < Allsvgsofthiscol1.length; sc++) {
            let thissvgg1 = Allsvgsofthiscol1[sc].childNodes[0].firstChild;
            //  d3.select(thissvgg).style('fill', 'white');
            //console.log("[[[[[[[", Allsvgsofthiscol[sc]);
            //console.log(thissvgg.style.fill);
            let thiskww1 = Allsvgsofthiscol1[sc].childNodes[1].innerText;
            //console.log(thiskww, thissvgg);
            FindkeywordandSetColor(Allsvgsofthiscol[sc].childNodes[1], 'uncolorMe', RGBToHex(thissvgg.style.fill));
        }
    }

}


var kwclickevent_cntr = 0;
var colorpicker_dark_useflag = [0, 0, 0, 0, 0, 0, 0, 0, 0];
let unused_colorindex = -1;

//var colorpicker_light = ['#8dd3c7', '#ffed6f', '#bebada', '#556B2F', '#8B0000', '#7FFF00', '#f10e83', '#ff7f00', '#0000FF', '#B8860B']; //f10e83 dark pink c10b69
var colorpicker_light = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'];


function WSKeywordClick() {
    //    kwclickevent_cntr++;
    //reset back to color1 after 10 clicks of setcolor NOTE: don't count reset color clicks
    if (kwclickevent_cntr == colorpicker_light.length || kwclickevent_cntr == -1)
        kwclickevent_cntr = 0;

    //update colorpicker flag array
    // UPDATE FLAG ARRAY BY TRAVERSING EVERY KEYWORD IN SERP (not just unselected one)
    let thiscolor = "";
    for (r = 0; r < colorpicker_light.length; r++) {
        thiscolor = colorpicker_light[r];
        if (CheckColorEncodingforKeyword(thiscolor))
            colorpicker_dark_useflag[r] = 0;
        else colorpicker_dark_useflag[r] = 1;
    }

    let wordcell_ptr = d3.select(this)._groups[0][0];
    console.log("fixin.....", this);

    let svgc = this.previousElementSibling.childNodes[0]; //svg circle
    //let svgc = this;
    //console.log("***************svgc::", svgc);

    let coloravailable_flag;
    //select color that is not used previously
    //unused_colorindex = -1;
    for (r = 0; r < colorpicker_dark_useflag.length; r++) {
        if (colorpicker_dark_useflag[r] == 0) {
            unused_colorindex = r;
            coloravailable_flag = true;
            break;
        }
        coloravailable_flag = false;
    }

    if (svgc.style.fill == "" || svgc.style.fill == "white") {
        if (!coloravailable_flag) {
            alert('Unselect any keyword to highlight new one!');
            unused_colorindex = -1;
        } else {
            console.log("colorme");
            console.log("sending below in find and color:::");
            console.log("wordcell_ptr in kw click=", wordcell_ptr);
            console.log("colorpicker_light[unused_colorindex]=", colorpicker_light[unused_colorindex]);

            FindkeywordandSetColor(wordcell_ptr, colorpicker_light[unused_colorindex], "");
            colorpicker_dark_useflag[unused_colorindex] = 1;
            kwclickevent_cntr++;
        }
    } else {
        console.log("un-colorme");
        //  console.log(wordcell_ptr.previousElementSibling.childNodes[0]);
        let unselectedcolor = RGBToHex(wordcell_ptr.previousElementSibling.childNodes[0].style.fill);
        //  console.log("unselectedcolor in main==", unselectedcolor);
        FindkeywordandSetColor(wordcell_ptr, 'uncolorMe', unselectedcolor);
        kwclickevent_cntr--;
        unused_colorindex = -1;
    }

    function CheckColorEncodingforKeyword(testcolor) {
        // console.log("testcolor==", testcolor);

        var keywordscol = document.getElementsByClassName('kwcolumn');
        // console.log("keywordscol=", keywordscol);
        let teststylecolor;
        let allrowsofonepaper_ptr;
        let thissvgcircle;

        //on same page
        for (i = 0; i < keywordscol.length; i++) { //25
            allrowsofonepaper_ptr = keywordscol[i].childNodes[0].childNodes;
            //for each paper
            for (j = 0; j < allrowsofonepaper_ptr.length; j++) {
                thissvgcircle = allrowsofonepaper_ptr[j].childNodes[0].firstChild;
                teststylecolor = thissvgcircle.style.fill;
                // console.log("teststylecolor=", teststylecolor);
                if (teststylecolor == testcolor) {
                    return false;
                }
            }
        }
        //from previous page
        for (k = 0; k < savedkeywordsDict.length; k++) {
            thiscolor = savedkeywordsDict[k].color;
            if (thiscolor == testcolor) {
                console.log("color useed in prev SERP");
                return false;
            }
        }
        return true; //color is unused in all the SERP keywords
    }
}

function WSsvgClick() {
    console.log("in ws click...", this);
    // LogsvgInteraction(this);
    //reset back to color1 after 10 clicks of setcolor NOTE: don't count reset color clicks
    if (kwclickevent_cntr == colorpicker_light.length || kwclickevent_cntr == -1)
        kwclickevent_cntr = 0;

    //update colorpicker flag array
    // UPDATE FLAG ARRAY BY TRAVERSING EVERY KEYWORD IN SERP (not just unselected one)
    let thiscolor = "";
    for (r = 0; r < colorpicker_light.length; r++) {
        thiscolor = colorpicker_light[r];
        if (CheckColorEncodingforKeywordsvg(thiscolor))
            colorpicker_dark_useflag[r] = 0;
        else colorpicker_dark_useflag[r] = 1;
    }


    let wordcell_ptr = this.parentNode.parentNode.nextElementSibling;
    console.log("word in svg===", wordcell_ptr);

    let svgc = this.parentNode; //svg circle
    //  console.log("to send ********--------- (th) >>>>word in svg===", svgc);


    let coloravailable_flag;
    //select color that is not used previously
    for (r = 0; r < colorpicker_dark_useflag.length; r++) {
        if (colorpicker_dark_useflag[r] == 0) {
            unused_colorindex = r;
            coloravailable_flag = true;
            break;
        }
        coloravailable_flag = false;
    }

    if (svgc.style.fill == "" || svgc.style.fill == "white") {
        if (!coloravailable_flag) {
            alert('Unselect any keyword to highlight new one!');
            unused_colorindex = -1;
        } else {
            console.log("colorme");
            console.log("sending below in find and color:::");
            console.log("wordcell_ptr=", wordcell_ptr);
            console.log("colorpicker_light[unused_colorindex]=", colorpicker_light[unused_colorindex]);

            FindkeywordandSetColor(wordcell_ptr, colorpicker_light[unused_colorindex], "");
            colorpicker_dark_useflag[unused_colorindex] = 1;
            kwclickevent_cntr++;
        }
    } else {
        console.log("un-colorme");
        //  console.log(wordcell_ptr.previousElementSibling.childNodes[0]);
        let unselectedcolor = RGBToHex(wordcell_ptr.previousElementSibling.childNodes[0].style.fill);
        //  console.log("unselectedcolor in main==", unselectedcolor);
        FindkeywordandSetColor(wordcell_ptr, 'uncolorMe', unselectedcolor);
        kwclickevent_cntr--;
        unused_colorindex = -1;
    }

    function CheckColorEncodingforKeywordsvg(testcolor) {
        //  console.log("testcolor==", testcolor);

        var keywordscol = document.getElementsByClassName('kwcolumn');
        // console.log("keywordscol=", keywordscol);
        let teststylecolor;
        let allrowsofonepaper_ptr;
        let thissvgcircle;

        //on same page
        for (i = 0; i < keywordscol.length; i++) { //25
            allrowsofonepaper_ptr = keywordscol[i].childNodes[0].childNodes;
            //for each paper
            for (j = 0; j < allrowsofonepaper_ptr.length; j++) {
                thissvgcircle = allrowsofonepaper_ptr[j].childNodes[0].firstChild;
                teststylecolor = thissvgcircle.style.fill;
                // console.log("teststylecolor=", teststylecolor);
                if (teststylecolor == testcolor) {
                    return false;
                }
            }
        }
        //from previous page
        for (k = 0; k < savedkeywordsDict.length; k++) {
            thiscolor = savedkeywordsDict[k].color;
            if (thiscolor == testcolor) {
                console.log("color useed in prev SERP");
                return false;
            }
        }
        return true; //color is unused in all the SERP keywords
    }
}

function RGBToHex(rgb) {
    // Choose correct separator
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    // Turn "rgb(r,g,b)" into [r,g,b]
    rgb = rgb.substr(4).split(")")[0].split(sep);

    let r = (+rgb[0]).toString(16),
        g = (+rgb[1]).toString(16),
        b = (+rgb[2]).toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
}

function FindkeywordandSetColor(HTMLptr, color, selectedkwcolor) {
    let word = HTMLptr.innerText.toLowerCase();
    var keywordscol = document.getElementsByClassName('kwcolumn');
    ///save in session
    //console.log("savedkeywordsDict before save= ", savedkeywordsDict);
    // console.log("word=", word);

    var doneflag = false;

    var queue = [];
    for (i = 0; i < keywordscol.length; i++) {
        queue[i] = keywordscol[i];
    }
    // console.log("queue:------", queue);

    var curr;
    while (curr = queue.pop()) { //starts looking from bottom most SERP
        // console.log("queue curr:::", curr);
        // console.log("curr.textContent.toLowerCase()===", curr.textContent.toLowerCase());

        if (!curr.textContent.toLowerCase().match(word)) {
            continue; //ignore the col without that word
        }

        // console.log("curr.childNodes.length=", curr.childNodes.length);

        for (i = 0; i < curr.childNodes.length; ++i) {
            switch (curr.childNodes[i].nodeType) {
                case Node.TEXT_NODE: // 3
                    // console.log("word testttttt=", curr.childNodes[i].textContent.toLowerCase());
                    if (curr.childNodes[i].textContent.toLowerCase().match(word)) {
                        let svgcir = curr.previousElementSibling.childNodes[0];
                        //  console.log("svgcir==", svgcir);
                        if (color == 'uncolorMe') {
                            //if keyword already colored same as cliked kw color, do not change color
                            // console.log("svg unselectedcolor=", RGBToHex(svgcir.style.fill));
                            // console.log("got selectedkwcolor=", selectedkwcolor);
                            ////// if(svgcir.style.fill != selectedkwcolor)
                            // if (svgcir.style.fill == "")
                            //donot un-color the words saved in dict
                            if (RGBToHex(svgcir.style.fill) == selectedkwcolor) {
                                d3.select(svgcir).style('fill', 'white');
                                //make svg clickable
                                doneflag = true;
                            }
                        } else {
                            /// if (svgcir.style.fill != "" || svgcir.style.fill != "white") {
                            console.log("word=", word, "svg color===", svgcir.style.fill);
                            //if keyword already colored, do not change color
                            if (svgcir.style.fill == "" || svgcir.style.fill == "white") {
                                d3.select(curr).classed('SameKWswithinSERP', true);
                                // d3.select(svgcir).attr("visibility", "visible");
                                d3.select(svgcir).style('fill', color);
                                doneflag = true;
                            }
                        }
                    }
                    break;
                case Node.ELEMENT_NODE: // 1
                    queue.push(curr.childNodes[i]);
                    break;
            }
        }
    } //while

    if (doneflag) {
        if (color == 'uncolorMe') {
            for (t1 = 0; t1 < savedkeywordsDict.length; t1++) {
                if (word == savedkeywordsDict[t1].word) {
                    //    console.log("word to del==", word);
                    //    console.log("savedkeywordsDict[t1].word:::", savedkeywordsDict[t1].word);
                    break;
                }
            }
            savedkeywordsDict.splice(t1, 1);
        } else {
            savedkeywordsDict.push({
                word: word,
                color: color
            });
        }
        //update session var. 
        sessionStorage.setItem('savedkws', JSON.stringify(savedkeywordsDict));

        Object.keys(sessionStorage).map(function(c, i, a) {
            let d = sessionStorage.getItem(sessionStorage.key(i));
            if (c == 'savedkws') {
                savedkeywordsDict = JSON.parse(d);
                console.log("savedkeywordsDict after save==", savedkeywordsDict);
            }
        });
    }
}

function FindkeywordandSetColorinNewpage(Cword, color) {
    let word = Cword.toLowerCase();
    var keywordscol = document.getElementsByClassName('kwcolumn');
    ///save in session
    //console.log("savedkeywordsDict before save= ", savedkeywordsDict);

    var queue = [];
    for (i = 0; i < keywordscol.length; i++) {
        queue[i] = keywordscol[i];
    }
    // console.log("queue:------", queue);
    var curr;
    while (curr = queue.pop()) { //starts looking from bottom most SERP
        // console.log("queue curr:::", curr);
        if (!curr.textContent.toLowerCase().match(word)) {
            continue; //ignore the col without that word
        }

        for (var i = 0; i < curr.childNodes.length; ++i) {
            switch (curr.childNodes[i].nodeType) {
                case Node.TEXT_NODE: // 3
                    if (curr.childNodes[i].textContent.toLowerCase().match(word)) {
                        let svgcir = curr.previousElementSibling.childNodes[0];
                        if (svgcir.style.fill == "" || svgcir.style.fill == "white") {
                            d3.select(curr).classed('SameKWswithinSERP', true);
                            //  d3.select(curr).style('background', color);
                            d3.select(svgcir).style('fill', color);
                        }
                    }
                    break;
                case Node.ELEMENT_NODE: // 1
                    queue.push(curr.childNodes[i]);
                    break;
            }
        }
    }
}

function syncSelectedLKW() {
    let thiscolor, thisword;

    Object.keys(sessionStorage).map(function(c, i, a) {
        let d = sessionStorage.getItem(sessionStorage.key(i));
        if (c == 'savedkws') {
            savedkeywordsDict = JSON.parse(d);
        }
    });
    //read each word from session storage and set same color in SERP

    for (k = 0; k < savedkeywordsDict.length; k++) {
        thisword = savedkeywordsDict[k].word;
        thiscolor = savedkeywordsDict[k].color;
        // console.log("Color word=", thisword, "color===", thiscolor);
        FindkeywordandSetColorinNewpage(thisword, thiscolor);
    }
}

function getFullpaper(d) {
    let r = JSON.parse(d.ieeedata);
    let fullpaperurl = r.doi;
    window.open(fullpaperurl, '_blank');
}

function abstract_click(d, i) {
    let thisrow = d3.select(this.parentNode); //(d3.select(this)._groups[0])[0].parentNode;
    let abstracttext = d3.select(this.parentNode.parentNode).select('#abstract_text');
    let triangle_img = d3.select(this.parentNode).select('#display_triangle');

    let thistitle = (d3.select(this.parentNode.parentNode).select('#ptitle')._groups[0])[0].innerText;

    let rflag;

    if (triangle_img.classed("triangle-right") == true) rflag = true;
    if (triangle_img.classed("triangle-down") == true) rflag = false;

    console.log("rflag=", rflag);

    if (rflag == true) {
        triangle_img.classed("triangle-right", false);
        triangle_img.classed("triangle-down", true);
        abstracttext.classed('invisible', false); //show abstract text
    } else {
        triangle_img.classed("triangle-down", false);
        triangle_img.classed("triangle-right", true);
        abstracttext.classed('invisible', true); //hide abstract text
    }
}
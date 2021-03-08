if(false)
{
    var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d');

        /**
         * Measures the rendered width of arbitrary text given the font size and font face
         * @param {string} text The text to measure
         * @param {number} fontSize The font size in pixels
         * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
         * @returns {number} The width of the text
         **/
        function getWidth(text, fontSize, fontFace) {
            context.font = fontSize + 'px ' + fontFace;
            return context.measureText(text).width;
        }
}









drag = simulation => {
  
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
    
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

height = 600;
width = 600;

const dataLinks = {};
const dataNodes = {};



let simulation = null;

const svg = d3.select("#svgcontainer").append("svg")
    .style("flex-grow", "1")
    .attr("viewBox", [0, 0, width, height])
;

svg.call(d3.zoom()
    .on("zoom", function({transform}) {
        container.attr("transform", transform);
    }))
;




/// Marker ///
/*svg.append("svg:defs").append("svg:marker")
    .attr("id", "triangle")
    .attr("refX", -2)
    .attr("refY", 0)
    .attr("markerWidth", 3.5)
    .attr("markerHeight", 3.5)
    .attr("orient", "auto")
    .attr("viewBox", "-6, -6, 12, 12")
    .append("path")
    .attr("d", "M -6 -6 6 0 -6 6 -3 0")
    .style("fill", "#999")
    .attr("opacity", 0.6)
;*/


let container = svg.append("g");

let link = container.append("g")
    .attr("stroke", "#333")
    .attr("stroke-opacity", 0.3)
    .attr("stroke-width", 5)
    .attr("fill", "transparent")
    .attr("stroke-linecap", "round")
    .selectAll("path")
;

let node = container.append("g")
    .style("text-anchor", "middle")
    .style("dominant-baseline", "central")
    .classed("noselect", true)
    .selectAll("text")
;


function update()
{
    let links = Object.values(dataLinks);
    let nodes = Object.values(dataNodes);

    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-1500))
        //.force("center", d3.forceCenter(width / 2, height / 2))
        /*.force('collision', d3.forceCollide().radius(function(d) {
            return getWidth(d.id, 32, "Arial") / 2.;
        }))*/
        .force("x", d3.forceX(width / 2))
        .force("y", d3.forceY(height / 2))
    ;

    //console.log(links);

    link = link
        .data(links)
        .join("path")
        //.attr("marker-end", "url(#triangle)")
        .on("click", (e, d) => {
            loadWikiPage(d.source.id, d.linkId);
            //console.log(d.linkId);
        })
    ;

    link.each(function(d, i) {
        d3.select(this).selectAll("title")
            .data([links[i]])
            .enter().append("title")
            .html(d => `Link from "${d.source.id}" to "${d.target.id}"`);
    });
    

    node = node
        .data(nodes)
        .join("text")
        .text(d => d.id)
        .call(drag(simulation))
        .on("click", (e, d) => {
            loadWikiPage(d.id);
        })
    ;

    simulation.on("tick", () => {
        link
            .attr("d", (d) => {
                const O = new Vec2(d.source.x, d.source.y);
                const T = new Vec2(d.target.x, d.target.y);

                const U = T.subV(O).normalize();
                const R = new Vec2(-U.y, U.x);

                const RShift = R.mulS(6);
                const UShift = U.mulS(20);
                const centerShift = R.mulS(15);

                const center = O.lerp(T, 0.5).addV(centerShift);

                /*return `
                    M ${source.lerp(target, 0.15).addV(R.mulS(6)).toArray()}
                    Q ${source.lerp(target, 0.5).addV(R.mulS(18)).toArray()}
                    ${source.lerp(target, 0.85).addV(R.mulS(6)).toArray()}
                `*/

                return `
                    M ${O.addV(UShift).addV(RShift).toArray()}
                    Q ${O.lerp(T, 0.3).addV(centerShift).toArray()}
                    ${center.toArray()}
                    T ${T.subV(UShift).addV(RShift).toArray()}
                    
                    M ${center.addV(R.mulS(-10)).addV(U.mulS(-10)).toArray()}
                    L ${center.addV(R.mulS(0)).addV(U.mulS(10)).toArray()}
                    L ${center.addV(R.mulS(10)).addV(U.mulS(-10)).toArray()}
                `
            })
        ;

        node
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });
}


function addLink(source, target, linkId)
{
    let key = `${source}[to]${target}`;
    if(!(key in dataLinks))
    {
        dataLinks[key] = { "source": source, "target": target, "linkId": linkId };
        //                 dataNodes[source] dataNodes[target]

        return true;
    }

    return false;
}



function nodeColor(highlightTitel)
{
    node = node.attr("fill", (d) => {
        if(d.id == highlightTitel)
        {
            return "green";
        }
        return "black";
    });
}

function updateLink()
{
    d3.select("#shareA").attr("href", `${window.location.origin}/?pageids=${Object.values(dataNodes).map(d => d.pageid).join(';')}`);
}

function validId(titel)
{
    return titel.replace(/ /g, '_').replace(/^[^a-z]|[^\w:-]/gi, m => m.charCodeAt(0));
}


let linkFrom = {};
/*
If (x in linkFrom[y]) then there is a link to the page y in the page x.
linkFrom[y] contain all the pages with links to page y.
*/

let pageContainer = d3.select("#pageContainer");

function loadWikiPage(titel, scrollTo, eraseForwardQueue=true)
{
    titel = titel.replace(/_/g, ' ');

    let pr = null;

    if(!(titel in dataNodes))
    {
        pr = d3.html(`https://en.wikipedia.org/api/rest_v1/page/html/${titel}`).then(function(data)
        {
            if(currentPage != null) currentPage.style("display", "none");

            currentPage = pageContainer.append("div")
                .attr("id", validId(titel));
            ;
            currentPage.node().append(data.documentElement);


            if(simulation != null) simulation.stop();
            let pageid = currentPage.select("meta[property$=pageId]").attr("content");
            dataNodes[titel] = { "id": titel, "pageid": pageid };  // , "x": 0, "y": 0, "vx": 0, "vy": 0
            
            updateLink();

            currentPage.select("body")
                .style("height", "auto")
                .style("overflow", "visible")
                .style("background-color", "#fff")
                .insert("h1", ":first-child")
                    .style("font-size", "28.8px")
                    .style("margin-top", "0px")
                    .attr("class", "firstHeading")
                    .attr("id", "firstHeading")
                    .html(titel)
            ;
            
            currentPage.selectAll("a")
                .each(function() {
                    let last = d3.select(this).attr("href");

                    let mat = last.match(/^(?:(?:(?:https?:)?\/\/en\.wikipedia\.org\/wiki)|\.)\/([^#/]+)(?:#(.+))?/);
                    //  /^(?:(?:(?:https?:)?\/\/en\.wikipedia\.org\/wiki)|\.)\/([^#/]+)(?:#(.+))?/
                    //  /^(?:(?:https?:\/\/en\.wikipedia\.org\/wiki)|\.)\/([^#/]+)(?:#(.+))?/
                    //  /^\.\/([^#]+)(#(.+))?/
                    //  /^\.\/([^#]+)/

                    const linkTitel = (mat != null ? mat[1].replace(/_/g, ' ') : "");

                    if(mat != null)
                    {
                        d3.select(this).attr("href", `javascript:loadWikiPage(\`${linkTitel}\`, ${ typeof mat[2] === 'undefined' ? 'undefined' : `\`${mat[2]}\`` });`);

                        if(linkTitel != titel)
                        {
                            if(linkTitel in linkFrom)
                            {
                                /*let linksFromLinkTitel = linkFrom[linkTitel];
                                let lastSize = linksFromLinkTitel.size;
                                linksFromLinkTitel.add(titel);
                                if(lastSize == 1 && linksFromLinkTitel.size == 2)
                                {
                                    console.log(linkTitel);
                                }*/
                            }
                            else
                            {
                                linkFrom[linkTitel] = {};
                            }
                            
                            let id = d3.select(this).attr("id");

                            if(!(titel in linkFrom[linkTitel]))
                            {
                                if(id == null)
                                {
                                    id = validId(titel + " to " + linkTitel);
                                    d3.select(this).attr("id", id);
                                }
                                linkFrom[linkTitel][titel] = id;
                                //console.log(`set linkFrom[${linkTitel}][${titel}] = ${id}`);
                            }
                            
                            if(linkTitel in dataNodes)
                            {
                                addLink(titel, linkTitel, id);
                                //console.log(id);
                            }
                        }
                    }
                    else
                    {
                        d3.select(this).attr("target", "_blank");
                    }
                });
        })
        .then(function() {
            Object.keys(dataNodes).forEach((e) => {
                if(e in linkFrom)
                {
                    Object.entries(linkFrom[e]).forEach(l => {
                        //console.log(`get linkFrom[${e}][${l[0]}] = ${l[1]}`);
                        addLink(l[0], e, l[1]);
                    });
                }
            });

            update();
        });
    }
    else
    {
        pr = Promise.resolve().then(function()
        {
            let newPage = d3.select(`#pageContainer > #${validId(titel)}`);

            changePage(currentPage, newPage);

            currentPage = newPage;
        });
    }

    pr.then(function() {
        currentPage.selectAll(".highlight-yellow")
            .classed("highlight-yellow", false)
        ;

        nodeColor(titel);

        d3.select("#openInWikipediaA").attr("href", `./${titel}`);

        backStack.push([titel, scrollTo]);
        backButton.property('disabled', backStack.length < 2);

        if(eraseForwardQueue)
        {
            forwardQueue = [];
            forwardButton.property('disabled', true);
        }


        if(typeof scrollTo !== 'undefined')
        {
            //console.log(scrollTo);

            currentPage.select(`#${scrollTo}`)
                .classed("highlight-yellow", true)
                .node().scrollIntoView()
            ;
        }
        else
        {
            currentPage.node().scrollTop = 0;
        }

        searchButtonClick(false);
    });
}

//loadWikiPage("Glider (Conway's Life)");


let params = new URLSearchParams(location.search);
/*
    "pageids"
    "pages"
*/

let pr = null;
if(params.has("pageids"))
{
    let pageids = params.get("pageids").split(";").map(d => parseInt(d));
    // "{{Pageid to title|59082207}}{{Pageid to title|3390}}{{Pageid to title|1124109}}"
    
    pr = d3.text('https://en.wikipedia.org/api/rest_v1/transform/wikitext/to/html/Main_Page', {
        method:"POST",
        body: JSON.stringify({
            wikitext: pageids.map(id => `{{Pageid to title|${id}}}`).join(""),
            body_only: true,
            stash: true,
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then((data) => {
        var dataHtml = new DOMParser().parseFromString(data, "text/xml");
        return Array.from(dataHtml.firstChild.childNodes).map(d => d.innerHTML);
    });
}
else if(params.has("pages"))
{
    pr = Promise.resolve().then(() => {
        return params.get("pages").split(";");
    });
}


if(pr != null)
{
    pr.then((initPages) => {
        initPages.forEach(p => {
            loadWikiPage(p);
        });
    });
}

// TODO: use meta tags to get pageid









function titelOnInput(e)
{
    let searchString = e.target.value;

    let pr = null;
    
    if(searchString == "") pr = Promise.resolve().then(() => { return pagesFeed; });
    else pr = d3.json(`https://en.wikipedia.org/w/api.php?action=opensearch&origin=*&limit=10&search=${searchString}`)  // `https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&search=${searchString}&limit=10`
        .then(data => data[1]);

    pr.then(function(data)
        {
            let suggestions = d3.select("#suggestions");
            suggestions.html("");
            data.forEach(searchRes => {
                suggestions.append("a")
                    .attr("class", "suggestion")
                    .html(searchRes)
                    .on("click", () => {
                        loadWikiPage(searchRes);
                        //searchButtonClick();
                    })
                ;
            });
        })
    ;
}
inputTitel.on("input", titelOnInput);



var today = new Date(new Date().toUTCString());
var dd = String(today.getUTCDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0');
var yyyy = today.getFullYear();

// Won't work on month ends.


let pagesFeed = null;
d3.json(`https://en.wikipedia.org/api/rest_v1/feed/featured/${yyyy}/${mm}/${dd}`)
    .then((data) => 
    { 
        /* pagesFeed = [
            data.tfa,
            data.mostread.articles[0],
            data.mostread.articles[1],
            data.mostread.articles[2],
            data.mostread.articles[3],
            data.news[0].links[0],
            data.news[1].links[0],
            data.onthisday[0].pages[0],
            data.onthisday[1].pages[0],
            data.onthisday[2].pages[0]
        ]; */

        let mostread = "mostread" in data ? data.mostread.articles.map(d => d.normalizedtitle) : [];
        let news = "news" in data ? data.news.map(d => d.links[0].normalizedtitle) : [];
        let onthisday = "onthisday" in data ? data.onthisday.map(d => d.pages[0].normalizedtitle) : [];

        pagesFeed = [data.tfa.normalizedtitle];

        let mostreadNum = Math.min(4, mostread.length);
        Array.prototype.push.apply(pagesFeed, mostread.slice(0, mostreadNum));

        let newsNum = Math.min(2, news.length);
        Array.prototype.push.apply(pagesFeed, news.slice(0, newsNum));

        let onthisdayNum = Math.min(3, onthisday.length);
        Array.prototype.push.apply(pagesFeed, onthisday.slice(0, onthisdayNum));

        Array.prototype.push.apply(pagesFeed, mostread.slice(mostreadNum, mostreadNum + 10 - pagesFeed.length));
    })
    .then(() => titelOnInput({ "target": { "value": "" } }))
;


d3.select("#randmArticle").on("click", () => {
    d3.json(`https://en.wikipedia.org/api/rest_v1/page/random/title`)//(`https://www.mediawiki.org/w/api.php?action=query&list=random&rnnamespace=0`)
        .then((data) => 
        {
            loadWikiPage(data.items[0].title);
            //searchButtonClick();
        })
    ;
});








let backStack = [];
let forwardQueue = [];

let backButton = d3.select("#backButton");
let forwardButton = d3.select("#forwardButton");

backButton.on("click", () => {
    forwardQueue.push(backStack.pop());

    let page = backStack.pop();
    loadWikiPage(page[0], page[1], false);

    forwardButton.property('disabled', false);
});

forwardButton.on("click", () => {
    let page = forwardQueue.pop();
    loadWikiPage(page[0], page[1], false);

    forwardButton.property('disabled', forwardQueue.length < 1);
});
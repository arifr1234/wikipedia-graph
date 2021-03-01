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

const dataLinks = [];
const dataNodes = new Set();



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
svg.append("svg:defs").append("svg:marker")
    .attr("id", "triangle")
    .attr("refX", 3.5)
    .attr("refY", 0)
    .attr("markerWidth", 5)
    .attr("markerHeight", 5)
    .attr("orient", "auto")
    .attr("viewBox", "-6, -6, 12, 12")
    .append("path")
    .attr("d", "M -6 -6 6 0 -6 6 -3 0")
    .style("fill", "#999")
    //.attr("opacity", 0.6)
;


let container = svg.append("g");

let link = container.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
;

let node = container.append("g")
    .style("text-anchor", "middle")
    .style("dominant-baseline", "central")
    .selectAll("text")
;


let nodes = [];

function update()
{
    let links = dataLinks.map(d => Object.create(d));

    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-1200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        /*.force('collision', d3.forceCollide().radius(function(d) {
            return getWidth(d.id, 32, "Arial") / 2.;
        }))*/
        //.force("x", d3.forceX(width / 2))
        //.force("y", d3.forceY(height / 2))
    ;


    link = link
        .data(links)
        .join("line")
        .attr("marker-end", "url(#triangle)")
        .attr("stroke-width", 5)
    ;
    

    node = node
        .data(nodes)
        .join("text")
        .text(d => d.id)
        .attr("class", "noselect")
        .call(drag(simulation))
        .on("click", (e, d) => {
            loadWikiPage(d.id);
        })
    ;

    simulation.on("tick", () => {
        let i = (d) => d3.interpolate(d.source, d.target);

        link
            .attr("x1", d => i(d)(0.1).x)
            .attr("y1", d => i(d)(0.1).y)
            .attr("x2", d => i(d)(0.9).x)
            .attr("y2", d => i(d)(0.9).y);

        node
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });
}




function addLink(source, target)
{
    let newLink = { "source": source, "target": target };

    let found = false;

    for(let i = 0; i < dataLinks.length; i++)
    {
        if(dataLinks[i].source == newLink.source && dataLinks[i].target == newLink.target)
        {
            found = true;
            break;
        }
    }

    if(!found)
    {
        dataLinks.push(newLink);

        return true;
    }

    return false;
}


let linkFrom = {};
/*
If (x in linkFrom[y]) then there is a link to the page y in the page x.
linkFrom[y] contain all the pages with links to page y.
*/


function loadWikiPage(titel)
{
    titel = titel.replace(/_/g, ' ');

    let newPage = !dataNodes.has(titel);
    // Can also do dataNodes.add(titel); hare and then newPage = lastSize != newSize.


    d3.html(`https://en.wikipedia.org/api/rest_v1/page/html/${titel}`).then(function(data)
    {
        iframe.node().innerHTML = '';
        iframe.node().append(data.documentElement);
        
        iframe.select("body")
            .style("height", "auto")
            .style("overflow-y", "auto")
            .insert("h1", ":first-child")
            .style("font-size", "28.8px")
            .style("margin-top", "0px")
            .attr("class", "firstHeading")
            .attr("id", "firstHeading")
            .html(titel);

        let shouldUpdate = false;
        
        iframe.selectAll("a")
            .each(function() {
                let last = d3.select(this).attr("href");

                let mat = last.match(/^\.\/([^#]+)/);
                if(mat != null)
                {
                    const linkTitel = mat[1].replace(/_/g, ' ');

                    if(linkTitel != titel)
                    {
                        d3.select(this).attr("href", `javascript:loadWikiPage("${linkTitel}");`);

                        if(newPage)
                        {
                            if(dataNodes.has(linkTitel))
                            {
                                shouldUpdate |= addLink(titel, linkTitel);
                            }

                            if(linkTitel in linkFrom)
                            {
                                /*let linksFromLinkTitel = linkFrom[linkTitel];
                                let lastSize = linksFromLinkTitel.size;
                                linksFromLinkTitel.add(titel);
                                if(lastSize == 1 && linksFromLinkTitel.size == 2)
                                {
                                    console.log(linkTitel);
                                }*/

                                linkFrom[linkTitel].add(titel);
                            }
                            else
                            {
                                linkFrom[linkTitel] = new Set([titel]);
                            }
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
        if(newPage)
        {
            dataNodes.add(titel);
            nodes.push({ "id": titel });

            //update();
        }

        dataNodes.forEach((e) => {
            if(e in linkFrom)
            {
                linkFrom[e].forEach((l) => {
                    addLink(l, e);
                });
            }
        });

        if(newPage)
        {
            update();
        }
    });
}

loadWikiPage("Geometry");






//d3.html(`https://en.wikipedia.org/wiki/Special:Search`).then(function(data)
//{
    //data = `<div about="#mwt1" typeof="mw:Transclusion" data-mw='{"parts":[{"template":{"target":{"wt":"search box","href":"./Template:Search_box"},"params":{},"i":0}}]}' id="mwAQ">
    //<div class="mw-inputbox-centered" style="" typeof="mw:Extension/inputbox" about="#mwt3" data-mw='{"name":"inputbox","attrs":{},"body":{"extsrc":"\nbgcolor=transparent\ntype=fulltext\nprefix=Main Page/\nbreak=no\nwidth=22\nsearchbuttonlabel=Search\n"}}'><form name="searchbox" class="searchbox" action="/wiki/Special:Search"><input class="mw-searchInput searchboxInput mw-ui-input mw-ui-input-inline" name="search" type="text" value="" placeholder="" size="22" dir="ltr"/><input type="hidden" value="Main Page/" name="prefix"/> <input type="submit" name="fulltext" class="mw-ui-button" value="Search"/><input type="hidden" value="Search" name="fulltext"/></form></div>
    //</div>`;
    //searchDiv.node().innerHTML = data;//'';
    //searchDiv.node().append(data.documentElement);
//});
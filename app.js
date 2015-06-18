(function () {
    "use strict";

    var svg;
    var line;
    var year = 2000;
    var width = 1000,
        height = 700;

    // To scale and translate map
    var projection = d3.geo.mercator()
        .scale(600)
        .translate([width/2 - 220, height/2 +600]);

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var noDataDiv = div.append("div")
        .attr("class", "nodata")
        .text("No data is available for this country and year")
        .style("display", "hidden")
        .style("color", "black");

    var averagePerCountry = div.append("div")
        .attr("class", "averagepercountry")
        .style("color", "black");

    var barColor = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888"]);

    var path = d3.geo.path().projection(projection);

    var margin = {top: 20, right: 70, bottom: 10, left: 30},
        barWidth = 330 - margin.left - margin.right,
        barHeight = 230 - margin.top - margin.bottom;

    var x0 = d3.scale.ordinal()
        .rangeRoundBands([0, barWidth], .1);

    var x1 = d3.scale.ordinal();

    var y = d3.scale.linear()
        .range([barHeight, 0]);

    var xAxis = d3.svg.axis()
        .scale(x0)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(function(d) { return parseInt(d, 10) + "%"; });

    // http://blog.mondula.com/mapping-minimum-wages-europe#comment-21
    var eu = [
        40, // Austria
        56, // Belgium
        100, // Bulgaria
        191, // Croatia
        196, // Cyprus
        203, // Czech Republic
        208, // Denmark
        233, // Estonia
        246, // Finland
        250, // France
        276, // Germany
        300, // Greece
        348, // Hungary
        372, // Ireland
        352, // Iceland
        380, // Italy
        428, // Latvia
        440, // Lithuania
        442, // Luxembourg
        470, // Malta
        528, // Netherlands
        578, // Norway
        616, // Poland
        620, // Portugal
        642, // Romania
        703, // Slovakia
        705, // Slovenia
        724, // Spain
        752, // Sweden
        792, // Turkey
        826 // United Kingdom
    ];

    function isEuCountry(datum) {
        var code = parseInt(datum.properties.iso_n3, 10);
        return eu.indexOf(code) > -1;
    }

    function getColor(value){

        //value from 0 to 1
        // var hue=((1-(4/value))*100).toString(10);
        var hue=((150*(value/30))+20).toString(10);
        // of > 0
        if(hue > -1) {
            return ["hsl(3,",hue,"%,",80-hue/3,"%)"].join("");
        } else {
            return "black";
        }
    }



    d3.json("eu.json", function (error, europe) {
        if (error) return console.error(error);

        var eu = topojson.feature(europe, europe.objects.europe),
            countries = eu.features;

        // console.log(countries)


        d3.csv("unemployment/Unemployment.csv", function(error, data) {
            eu = topojson.feature(europe, europe.objects.europe),
                    countries = eu.features;
                for (var i = 0; i < data.length; i += 9) {
                    for (var j = 0; j < countries.length; j++) {
                        if (countries[j]['properties']['name'] === data[i]['GEO']) {

                            if (!countries[j].hasOwnProperty('unemploymentData')) {
                                countries[j].unemploymentData = [];

                            }
                            countries[j].unemploymentData[data[i]['TIME']] = [9];
                            for (var k = i; k < i + 9; k++) {
                                countries[j].unemploymentData[data[i]['TIME']][k - i] = data[k];
                            }
                        }
                    }

                }

            updateMap(countries, year);

            function updateYear(nYear) {
                // adjust the text on the range slider
                d3.select(".range-value").text(nYear);
                d3.select("#nYear").property("value", nYear);
                year = nYear;
                updateMap(countries, year);
            }


            function updateMap(countries, year){
                var firstDrawing;

                if (document.getElementsByClassName("countries-svg").length === 0) {

                    svg = d3.select("#container").append("svg")
                                         .attr("width", width)
                                         .attr("height", height)
                                         .classed("countries-svg", true);


                    firstDrawing = true;
                } else {
                    firstDrawing = false;
                }


                if (firstDrawing) {

                    svg.selectAll("path")
                        .data(countries)
                        .enter().append("path")
                        .attr("d", path)
                        .attr("class", "country")
                        .style("fill", function(d) {
                            if (d.hasOwnProperty('unemploymentData')) {
                                return getColor(d['unemploymentData'][year][0]['Value']);
                            } else {
                                return "grey";
                            }
                        })
                        .classed("eu-country", isEuCountry);




                } else {
                    var paths = d3.selectAll("svg.countries-svg path").data(countries);
                    paths.transition()
                        .duration(250)
                        .style("fill", function(d) {
                            if (d.hasOwnProperty('unemploymentData')) {
                                return getColor(d['unemploymentData'][year][0]['Value']);
                            } else {
                                return "grey";
                            }
                        });

                    paths.classed("eu-country", isEuCountry);
                }

                d3.selectAll(".eu-country")
                    .on("mouseover", function (d) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);

                        var firstDrawing;

                        if (document.getElementsByClassName("country-barsvg").length === 0) {
                            var barSvg = div.append("svg")
                                .attr("width", barWidth + margin.left + margin.right)
                                .attr("height", barHeight + margin.top + margin.bottom)
                                .classed("country-barsvg", true)
                                .append("g")
                                .attr("transform", "translate(" + margin.left + "," + margin.bottom + ")")
                                .classed("container-g", true);

                            firstDrawing = true;
                        } else {
                            var barSvg = d3.selectAll(".country-barsvg");
                            firstDrawing = false;
                        }

                        var twoGroups = {"Less than 25 years" : [], "From 25 to 74 years" : []};

                        for (var row in d['unemploymentData'][year]) {
                            if (d['unemploymentData'][year][row].AGE === "Less than 25 years") {
                                if (d['unemploymentData'][year][row].Value === ":") {
                                    twoGroups[d['unemploymentData'][year][row].AGE].push({ name: d['unemploymentData'][year][row].SEX, value: 0 });
                                } else {
                                    twoGroups[d['unemploymentData'][year][row].AGE].push({ name: d['unemploymentData'][year][row].SEX, value: d['unemploymentData'][year][row].Value });
                                }
                            } else if (d['unemploymentData'][year][row].AGE === "From 25 to 74 years") {
                                if (d['unemploymentData'][year][row].Value === ":") {
                                    twoGroups[d['unemploymentData'][year][row].AGE].push({ name: d['unemploymentData'][year][row].SEX, value: 0 });
                                } else {
                                    twoGroups[d['unemploymentData'][year][row].AGE].push({ name: d['unemploymentData'][year][row].SEX, value: d['unemploymentData'][year][row].Value });
                                }
                            }
                        }

                        if (twoGroups["Less than 25 years"][0].value === 0) {
                            barSvg.style("display", "none");
                            averagePerCountry.style("display", "none");
                            noDataDiv.style("display", "block");
                        } else {
                            barSvg.style("display", "block");
                            d3.select(".container-g").style("display", "block");
                            averagePerCountry.style("display", "block");
                            noDataDiv.style("display", "none");
                        }

                        if (d['properties']['name'] === "Germany (until 1990 former territory of the FRG)") {
                            var countryName = "Germany";
                        } else {
                            var countryName = d['properties']['name'];
                        }

                        averagePerCountry.text("Average unemployment for " + countryName + " in " + year + ": " + d['unemploymentData'][year][0].Value + "%");

                        var sexNames = ["Males", "Females", "Total"];
                        x0.domain(Object.keys(twoGroups).map(function(d) { return d; }));
                        x1.domain(sexNames).rangeRoundBands([0, x0.rangeBand()]);

                        var max = 0;
                        d3.values(twoGroups).forEach(function(d) {
                            d.forEach(function(f) {
                                if (f.value !== ":" && parseFloat(f.value) > max) {
                                    max = parseFloat(f.value);
                                }
                            });
                        });

                        var max = d3.max(d3.values(twoGroups), function(d) { return d3.max(d, function(d) { return parseFloat(d.value); }); });
                        y.domain([0, max]).nice();

                        if (firstDrawing) {
                            barSvg.append("g")
                                .attr("class", "x axis")
                                .attr("transform", "translate(5," + barHeight + ")")
                                .call(xAxis);

                             barSvg.append("g")
                                .attr("class", "y axis")
                                .call(yAxis)
                                .append("text")
                                .attr("transform", "rotate(-90)")
                                .attr("y", 4)
                                .attr("dy", ".70em")
                                .style("text-anchor", "end")
                                .text("Population")
                                .classed("tick_text");

                            var ageGroup = barSvg.selectAll(".yeargroup")
                                .data(d3.values(twoGroups))
                                .enter().append("g")
                                .attr("class", "g")
                                .attr("transform", function(d, i) {
                                    if (i === 0) {
                                        return "translate(" + (parseInt(x0("Less than 25 years")) + 5).toString() + ",0)";
                                    } else if (i === 1) {
                                        return "translate(" + (parseInt(x0("From 25 to 74 years")) + 5).toString() + ",0)";
                                    }
                                })
                                .classed("yeargroup", true);

                            ageGroup.selectAll("rect")
                                .data(function(d) {return d; })
                                .enter().append("rect")
                                .attr("width", x1.rangeBand())
                                .attr("x", function(d) { return x1(d.name); })
                                .attr("y", function(d) { return y(d.value); })
                                .attr("height", function(d) { return barHeight - y(d.value); })
                                .style("fill", function(d) { return barColor(d.name); })
                                .classed("barchart-rect", true);

                            var legend = barSvg.selectAll(".legend")
                                  .data(sexNames.slice())
                                .enter().append("g")
                                  .attr("class", "legend")
                                  .attr("transform", function(d, i) { return "translate(70," + i * 20 + ")"; });

                            legend.append("rect")
                                .attr("x", barWidth - 18)
                                .attr("width", 18)
                                .attr("height", 18)
                                .style("fill", barColor);

                            legend.append("text")
                                .attr("x", barWidth - 24)
                                .attr("y", 9)
                                .attr("dy", ".35em")
                                .style("text-anchor", "end")
                                .text(function(d) { return d; });
                        } else {
                            var newYAxis = d3.select("g.y")
                                .call(yAxis)
                                .append("text")
                                .attr("transform", "rotate(-90)")
                                .attr("y", 6)
                                .attr("dy", ".71em")
                                .style("text-anchor", "end")
                                .classed("tick_text");

                            var yeargroups = d3.selectAll(".yeargroup").data(d3.values(twoGroups));
                            var rects = yeargroups.selectAll(".barchart-rect")
                                .data(function(d) { return d; })
                                .attr("width", x1.rangeBand())
                                .attr("x", function(d) { return x1(d.name); })
                                .attr("y", function(d) { return y(d.value); })
                                .attr("height", function(d) { return barHeight - y(d.value); })
                                .style("fill", function(d) { return barColor(d.name); })
                                .classed("barchart-rect", true);
                        }

                        div.style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                    })
                    .on("click", function(d) {
                        console.log(d);
                        drawChart(d);
                    });
                }

            function drawChart(country) {
                console.log(country);
                var countrydata = [];
                for(var row in country['unemploymentData']) {
                    console.log("row");
                    console.log(country['unemploymentData'][row][0]['Value']);
                    if(!isNaN(country['unemploymentData'][row][0]['Value'])) {
                        countrydata.push({year: parseInt(row), value: parseFloat(country['unemploymentData'][row][0]['Value'])});
                    }
                }

                console.log(countrydata);

                var margin = {top: 20, right: 20, bottom: 30, left: 50},
                width = 500 - margin.left - margin.right,
                height = 300 - margin.top - margin.bottom;


                var xgraph = d3.scale.linear()
                    .range([0, width]);

                var ygraph = d3.scale.linear()
                    .range([height, 0]);

                var xAxisLine = d3.svg.axis()
                    .scale(xgraph)
                    .orient("bottom")
                    .tickFormat(d3.format("d"));

                var yAxisLine = d3.svg.axis()
                    .scale(ygraph)
                    .orient("left");

                var line = d3.svg.line()
                    .x(function(d) { return xgraph(d.year); })
                    .y(function(d) { return ygraph(d.value); });

                var graph = d3.select(".aGraph").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                 // xgraph.domain(d3.extent(countrydata, function(d) {

                 //    return d['year']; }));

                xgraph.domain([2000,2015]);

                 ygraph.domain([0, d3.max(countrydata, function(d) {
                    console.log(d.value);
                    return d.value; })]);

                // ygraph.domain([0,12]);
                 console.log(ygraph);
                  graph.append("g")
                      .attr("class", "xgraph axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxisLine);

                  graph.append("g")
                      .attr("class", "ygraph axis")
                      .call(yAxisLine)
                    .append("text")
                      .attr("transform", "rotate(-90)")
                      .attr("ygraph", 6)
                      .attr("dy", ".71em")
                      .style("text-anchor", "end")
                      .text("Percent (%)");

                  graph.append("path")
                      .datum(countrydata)
                      .attr("class", "line")
                      .attr("d", line);
            }

            d3.select("#nYear").on("input", function() {
              updateYear(+this.value);
            });

            updateYear(2000);
        });

    });

})();
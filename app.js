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
        .range(["#8dd3c7", "#80b1d3", "#fb8072"]);

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

    function getTrendColor(value, min, max) {
        if (Math.abs(min) >= Math.abs(max) && min < 0) {
            max = Math.abs(min);
            var oldRange = max - min;
        } else if (Math.abs(max) > Math.abs(min) && max > 0) {
            min = max * -1;
            var oldRange = max - min;
        }

        var newRange = 1 - 0;
        var newValue = (((value - min) * newRange) / oldRange) + 0;

        //value from 0 to 1
        var hue = ((1 - newValue) * 120).toString(10);
        return ["hsl(",hue,",100%,40%)"].join("");
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
        var euUnion = [];
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

                for (var i = 0; i < data.length; i += 9) {
                    if (data[i]['GEO'] === 'European Union (28 countries)') {
                        euUnion.push({year: data[i]['TIME'], value: data[i]['Value']});
                    }
                }
                var maxEU = d3.max(euUnion, function(d) {
                        console.log(d.value)
                        console.log("max")
                        return parseFloat(d.value); });
                console.log(maxEU)

            var minTrend = 0;
            var maxTrend = 0;

            var marginGraph = {top: 30, right: 20, bottom: 30, left: 50},
                widthGraph = 500 - marginGraph.left - marginGraph.right,
                heightGraph = 300 - marginGraph.top - marginGraph.bottom;


            var xgraph = d3.scale.linear()
                .range([0, widthGraph]);

            var ygraph = d3.scale.linear()
                .range([heightGraph, 0]);

            var xAxisLine = d3.svg.axis()
                .scale(xgraph)
                .orient("bottom")
                .tickFormat(d3.format("d"));

            var yAxisLine = d3.svg.axis()
                .scale(ygraph)
                .tickFormat(function(d) { return parseFloat(d, 10) + "%"; })
                .orient("left");

            var line = d3.svg.line()
                .x(function(d) { return xgraph(d.year); })
                .y(function(d) { return ygraph(d.value); });

            xgraph.domain([2000,2015]);
            ygraph.domain([0,maxEU+10]).nice();

            var graph = d3.select(".aGraph").append("svg")
                        .attr("class", "linegraph")
                        .attr("width", widthGraph + marginGraph.left + marginGraph.right)
                        .attr("height", heightGraph + marginGraph.top + marginGraph.bottom)
                      .append("g")
                        .attr("transform", "translate(" + marginGraph.left + "," + marginGraph.top + ")");

                    graph.append("g")
                      .attr("class", "xgraph axis")
                      .attr("transform", "translate(0," + heightGraph + ")")
                      .call(xAxisLine);

                    graph.append("g")
                        .attr("class", "ygraph axis")
                        .call(yAxisLine)
                      .append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("ygraph", 6)
                        .attr("dy", ".71em")
                        .style("text-anchor", "end")
                        .text("Population");

                    graph.append("path")
                        .attr("class", "line");

                    graph.append("path")
                        .datum(euUnion)
                        .attr("class", "EUline")
                        .attr("d", line);

                    var graphTitle = graph.append("text")
                        .attr("x", (widthGraph / 2))
                        .attr("y", -10 - (marginGraph.top / 4))
                        .attr("text-anchor", "middle")
                        .style("font-size", "16px")
                        .style("font-family", "sans-serif");

                        graphTitle.append("svg:tspan").attr("class", "europe").style("fill", "red").text("Europe");
                        graphTitle.append("svg:tspan").attr("class", "vs").style("fill", "black").text("");
                        graphTitle.append("svg:tspan").attr("class", "country").style("fill", "steelblue").text("");



            updateMap(countries, year);

            function updateYear(nYear) {
                // adjust the text on the range slider
                d3.select(".range-value").style("font-size", "20px").text(nYear);
                // $('.slider').val(nYear);
                year = nYear;
                updateMap(countries, year);
            }

            function updateTrend(year1, year2) {
                d3.select(".range-value").style("font-size", "11px").text(year1 + " - " + year2);
                minTrend = maxTrend = 0;

                countries.forEach(function(d) {
                    if (d.hasOwnProperty('unemploymentData') &&
                        d['unemploymentData'][year1][0]['Value'] !== ":" &&
                        d['unemploymentData'][year2][0]['Value'] !== ":") {
                        var diff = parseFloat((parseFloat(d['unemploymentData'][year2][0]['Value']) - parseFloat(d['unemploymentData'][year1][0]['Value'])).toPrecision(2));
                        maxTrend = Math.max(diff, maxTrend);
                        minTrend = Math.min(diff, minTrend);
                    }
                });

                var paths = d3.selectAll("svg.countries-svg path").data(countries);
                paths.transition()
                    .duration(250)
                    .style("fill", function(d) {
                        if (d.hasOwnProperty('unemploymentData')) {
                            if (d['unemploymentData'][year1][0]['Value'] !== ":" && d['unemploymentData'][year2][0]['Value'] !== ":") {
                                var diff = parseFloat((parseFloat(d['unemploymentData'][year2][0]['Value']) - parseFloat(d['unemploymentData'][year1][0]['Value'])).toPrecision(2));
                                return getTrendColor(diff, minTrend, maxTrend);
                            } else {
                                return "black";
                            }
                        } else {
                            return "grey";
                        }
                    });

                paths.classed("eu-country", isEuCountry);
                updateLegend();
                // svg.selectAll("path")
                //     .style("fill", "grey");
            }



            // Drawing gradient legend for map

            var w = 140, h = 400;
            var legend;
            var key = d3.select(".color-legend").append("svg").attr("width", w).attr("height", h);
            var yLegend;
            var yAxisLegend;


            function updateLegend() {
                if ($("#typeSelect").val() === "peryear") {
                    console.log("updateLegend")
                    key.selectAll("g.axis").remove();
                    key.selectAll("defs").remove();
                    key.selectAll("rect").remove();
                    for (var i = 0; i < 30; i+=5) {

                        legend = key.append("defs").append("svg:linearGradient").attr("id", "gradient").attr("x1", "100%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");
                        legend.append("stop").attr("offset", "0%").attr("stop-color", getColor(i+5)).attr("stop-opacity", 1);

                        legend.append("stop").attr("offset", "100%").attr("stop-color", getColor(i)).attr("stop-opacity", 1);

                        key.append("rect").attr("width", w - 100).attr("height", 50).attr("x", 40).attr("y", 250-i*10).style("fill", "url(#gradient)").attr("transform", "translate(0, 10)");
                    }

                    yLegend = d3.scale.linear().range([300, 0]).domain([0, 30]);
                    yAxisLegend = d3.svg.axis().scale(yLegend).tickFormat(function(d) { return parseFloat(d, 10) + "%"; }).orient("left");
                    key.append("g").attr("class", "yLegend axis").attr("transform", "translate(40,10)").call(yAxisLegend).append("text").attr("transform", "rotate(-90)").attr("y", 50).attr("dy", ".71em").style("text-anchor", "end").text("Unemployment Rate");



                } else {
                    key.selectAll("g.axis").remove();
                    key.selectAll("defs").remove();
                    key.selectAll("rect").remove();
                    for (var j = 0; j < 120; j+=1) {
                        legend = key.append("defs").append("svg:linearGradient").attr("id", "gradient").attr("x1", "100%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");
                        legend.append("stop").attr("offset", "0%").attr("stop-color", ["hsl(",j-0.5,",100%,40%)"].join("")).attr("stop-opacity", 1);

                        legend.append("stop").attr("offset", "100%").attr("stop-color", ["hsl(",j + 0.5,",100%,40%)"].join("")).attr("stop-opacity", 1);

                        key.append("rect").attr("width", w - 100).attr("height", 3).attr("x", 40).attr("y",  j*(300/120)).style("fill", "url(#gradient)").attr("transform", "translate(0, 10)");
                    }

                    var maxVal;

                    if (Math.abs(minTrend) >= Math.abs(maxTrend) && minTrend < 0) {
                         maxVal = Math.abs(minTrend);
                    } else if (Math.abs(maxTrend) > Math.abs(minTrend) && maxTrend > 0) {
                         maxVal = maxTrend;
                    }

                    yLegend = d3.scale.linear().range([300, 0]).domain([-maxVal, maxVal]);
                    yAxisLegend = d3.svg.axis().scale(yLegend).tickFormat(function(d) { console.log(d); return parseFloat(d, 10) + "%"; }).orient("left");
                    key.append("g").attr("class", "yLegend axis").attr("transform", "translate(40,10)").call(yAxisLegend);
                    key.append("g").attr("class", "yLegend axis").attr("transform", "translate(40,10)").call(yAxisLegend).append("text").attr("transform", "rotate(-90)").attr("y", 50).attr("x", 300).attr("dy", ".71em").style("text-anchor", "end").text("Increase");
                }
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
                        if ($("#typeSelect").val() === "peryear") {
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
                        } else if ($("#typeSelect").val() === "trend") {
                            if (document.getElementsByClassName("country-barsvg").length !== 0) {
                                d3.selectAll(".country-barsvg").style("display", "none");
                            }
                            noDataDiv.style("display", "none");

                            div.transition()
                                .duration(200)
                                .style("opacity", .9);

                            var trendvalues = $(".trend-slider").val();
                            var year1 = parseInt(trendvalues[0]);
                            var year2 = parseInt(trendvalues[1]);
                            if (d['properties']['name'] === "Germany (until 1990 former territory of the FRG)") {
                                var countryName = "Germany";
                            } else {
                                var countryName = d['properties']['name'];
                            }
                            var diff = parseFloat((parseFloat(d['unemploymentData'][year2][0]['Value']) - parseFloat(d['unemploymentData'][year1][0]['Value'])).toPrecision(2));

                            if (diff > 0.0) {
                                averagePerCountry.text("Unemployment trend development for " + countryName + " in the period " + year1 + " - " + year2 + ": " + diff + "% increase");
                            } else if (diff <= 0.0) {
                                averagePerCountry.text("Unemployment trend development for " + countryName + " in the period " + year1 + " - " + year2 + ": " + diff * -1.0 + "% decrease");
                            }

                            div.style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 28) + "px");
                        }
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




            var previousCountry = euUnion;
            var previousname = "Europe";
            function drawChart(country) {

                if (country['properties']['name'] === "Germany (until 1990 former territory of the FRG)") {
                    var name = "Germany";
                } else {
                    var name = country['properties']['name'];
                }

                function updateData1(countrydata) {
                    var graph = d3.select(".aGraph").transition();

                    xgraph.domain([2000,2015]);

                    var countryMax = d3.max(countrydata, function(d) {
                        return d.value; });
                    if(countryMax > maxEU) {
                        ygraph.domain([0, countryMax]).nice();
                    } else {
                        ygraph.domain([0, maxEU]).nice();
                    }


                    graph.select(".EUline")   // change the line
                        .duration(750)
                        .attr("d", line(euUnion));
                    graph.select(".line")   // change the line
                        .duration(750)
                        .attr("d", line(countrydata));
                    graph.select(".xgraph.axis") // change the x axis
                        .duration(750)
                        .call(xAxisLine);
                    graph.select(".ygraph.axis") // change the y axis
                        .duration(750)
                        .call(yAxisLine);


                    graphTitle.select(".europe").text("Europe");
                    graphTitle.select(".vs").text(" vs. ");
                    graphTitle.select(".country").text(name);


                }


                function updateData2(country1, country2, name1, name2) {
                    var graph = d3.select(".aGraph").transition();

                    xgraph.domain([2000,2015]);

                    var countryMax1 = d3.max(country1, function(d) {
                        return d.value; });
                    var countryMax2 = d3.max(country2, function(d) {
                        return d.value; });

                    if(countryMax1 > countryMax2) {
                        ygraph.domain([0, countryMax1]).nice();
                    } else {
                        ygraph.domain([0, countryMax2]).nice();
                    }


                    graph.select(".EUline")   // change the line
                        .duration(750)
                        .attr("d", line(country1));
                    graph.select(".line")   // change the line
                        .duration(750)
                        .attr("d", line(country2));
                    graph.select(".xgraph.axis") // change the x axis
                        .duration(750)
                        .call(xAxisLine);
                    graph.select(".ygraph.axis") // change the y axis
                        .duration(750)
                        .call(yAxisLine);

                    graphTitle.select(".europe").text(name1);
                    graphTitle.select(".vs").text(" vs. ");
                    graphTitle.select(".country").text(name2);
                }

                var countrydata = [];

                for(var row in country['unemploymentData']) {
                    console.log("row");
                    console.log(country['unemploymentData'][row][0]['Value']);
                    if(!isNaN(country['unemploymentData'][row][0]['Value'])) {
                        countrydata.push({year: parseInt(row), value: parseFloat(country['unemploymentData'][row][0]['Value'])});
                    }
                }


                if ($("#typeSelect").val() === "peryear") {
                    updateData1(countrydata);
                } else {
                    updateData2(previousCountry, countrydata, previousname, name);
                }

                previousCountry = countrydata;
                previousname = name;
            }



            $("#typeSelect").change(function() {
                if ($("#typeSelect").val() === "peryear") {
                    updateYear(+$(".per-year-slider").val());
                    $('#header-title').text("Unemployment in europe in the year:");
                    updateLegend();
                } else if ($("#typeSelect").val() === "trend") {
                    var trendvalues = $(".trend-slider").val();
                    updateTrend(parseInt(trendvalues[0]), parseInt(trendvalues[1]));
                    $('#header-title').text("Unemployment trend in europe in the period:");
                    updateLegend();
                }

                $('.per-year-slider').toggle();
                $('.trend-slider').toggle();
            });

            $(".per-year-slider").on("slide", function() {
              updateYear(+$(".per-year-slider").val());
            });

            $(".trend-slider").on("slide", function() {
                var trendvalues = $(".trend-slider").val();
                updateTrend(parseInt(trendvalues[0]), parseInt(trendvalues[1]));
            });
            updateLegend();
            updateYear(2000);
        });

    });

})();
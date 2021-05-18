var low_rating = 0;
var high_rating = 9999;
var input_rating = false;
var start_date = new Date("2013-01-01")
var end_date = new Date("2021-01-31")


var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var $games = $('#games')
$games.html("0/0" + "  (" + "0.00" + "%)")

/*
GET DATA

1. Cleaned databases of lichess games
2. Opening reference file obtained from https://lichess.org/forum/general-chess-discussion/eco-code-csv-sheet
3. Opening frequences per year
*/
var filepath = "https://raw.githubusercontent.com/6859-sp21/final-project-howgoodisyourchessopening-fp/main/datafiles/"
var filenames = ["lichess_db_standard_rated_2013-01-cleaned-small.csv",
                 "lichess_db_standard_rated_2013-07-cleaned-small.csv",
                 "lichess_db_standard_rated_2014-01-cleaned-small.csv",
                 "lichess_db_standard_rated_2014-07-cleaned-small.csv",
                 "lichess_db_standard_rated_2015-01-cleaned-small.csv",
                 "lichess_db_standard_rated_2015-07-cleaned-small.csv",
                 "lichess_db_standard_rated_2016-01-cleaned-small.csv",
                 "lichess_db_standard_rated_2016-07-cleaned-small.csv",
                 "lichess_db_standard_rated_2017-01-cleaned-small.csv",
                 "lichess_db_standard_rated_2017-07-cleaned-small.csv",
                 "lichess_db_standard_rated_2018-01-cleaned-small.csv",
                 "lichess_db_standard_rated_2018-07-cleaned-small.csv",
                 "lichess_db_standard_rated_2019-01-cleaned-small.csv",
                 "lichess_db_standard_rated_2019-07-cleaned-small.csv",
                 "lichess_db_standard_rated_2020-01-cleaned-small.csv",
                 "lichess_db_standard_rated_2020-07-cleaned-small.csv",
                 "lichess_db_standard_rated_2021-01-cleaned-small.csv"]



function fetchAndFilter(filename) {

}

var data_promises = []
for (var i = 0; i < filenames.length; i++) {
  data_promises = data_promises.concat(d3.tsv(filepath + filenames[i], d3.autoType))
}
var master_data = Promise.all(
  data_promises
).then(function(allData) {
  return d3.merge(allData);
})

// console.log("MASTER LOAD: ", master_data);
// var nut = master_data.then(function(d) {console.log(d); return d;});
// console.log(nut)
var opening_data = master_data;

openingDatabaseFilename = "openingDatabaseClean.tsv"
openingDatabase = d3.tsv(filepath + openingDatabaseFilename, d3.autoType)
openingDatabaseMap = {}
openingDatabase.then(function(data) {
  for (var i = 0; i < data.length; i++) {
    openingDatabaseMap[data[i]['Name']] = data[i]['Opening Moves'];
  }
});

console.log(openingDatabaseMap);
var first_move = getMostCommonMove(opening_data, "")
// var first_move ="e4"
var common_move = first_move


/*
USER INPUT

Instantiate user input parameters and create handlers
*/

$( function() {
  $( "#slider" ).slider();
} );

$('#chessColor').on('change', function() {analyze(game.pgn(), this.value)})

function filterByRating() {
  low_rating = document.getElementById("input-rating-low").value;
  high_rating = document.getElementById("input-rating-high").value;
  // console.log(low_rating);
  // console.log(high_rating);
  updateStatus(true);
}

function filterByDate() {
  start_date = new Date(document.getElementById("start-date").value);
  end_date = new Date(document.getElementById("end-date").value);
  updateStatus(true);
}

$('#startBtn').on('click', function() {reset()})
function reset() {
  // console.log("RESET!!")
  game.reset()
  board.start(false)
  num_games = 1
  common_move = first_move
  updateStatus()
}

$('#commonBtn').on('click', function() {doMostCommon()})
function doMostCommon() {
  // console.log("COMMON:", common_move, common_move.length)
  var move = game.move(common_move)

  //console.log(move)
  onSnapEnd()
  updateStatus()
}

function loadPGN(pgn) {
  console.log("LOADING:   ", pgn);

  console.log(game.load_pgn(pgn));
  onSnapEnd()
  updateStatus();
}

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  })

  // illegal move
  if (move === null) return 'snapback'

  updateStatus()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}


function filterData() {
  var openingData = opening_data;
  var filterColor = "WhiteElo"
  if (chessColor === 'black') {
    filterColor = "BlackElo"
  }
  opening_data.then(function(data) {

    // Filter games by rating and date.
    openingData = data.filter(function (d) {
      var elo = d.WhiteElo
      if (chessColor === 'black') {
        elo = d.BlackElo
      }
      var date_dot = d.Date
      var date_str = date_dot.replace(/\./g, "-");
      // console.log(date_str)
      var date = new Date(date_str)
      // console.log(date)

      return elo >= low_rating && elo <= high_rating && date >= start_date && date <= end_date;
    });
    console.log("WOAH: ", openingData)
    return openingData;
  });
}


function updateStatus (update_time_graph=false) {

  // var filter_data = filterData();
  // console.log("FILTERED: ", filter_data)

  analyze(game.pgn(), document.getElementById("chessColor").value, update_time_graph)
  if (update_time_graph) {
    // plotOpeningsOverTime();
    makeTreemap();
  }
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    //console.log(num_games)
    prefix = "Make a move! ("
    if (num_games === 0) {
      prefix = "No Available Game Data ("
    }
    else if (common_move === "") {
      prefix = "No Common Move ("
    }

    status = prefix + moveColor + ' to move)'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
  // console.log(game.pgn())
  // analyze(game.pgn())
}

function handleClick(event){
    // console.log(document.getElementById("openingMoves").value);
    analyze(document.getElementById("openingMoves").value, document.getElementById("chessColor").value);
    return false;
}


function getMostCommonMove(data, pgn, low=0, high=9999) {
  var modeMap = {};
  var maxEl = data[0], maxCount = 0;
  // console.log(pgn)
  try {
    var date_str = data[0].Date.replace(/\./g, "-");
    var date = new Date(date_str)
  }
  catch(e) {
    console.log(e);
  }

  for (var i=0; i < data.length; i++) {
    var move = pgn
    var offset = 0
    if (move.length > 0) {
      offset = 1
    }
    var game_pgn = data[i].Moves.slice(pgn.length+offset, pgn.length+10)
    var first_space = game_pgn.indexOf(" ")
    var next_move = game_pgn.substring(0, first_space)
    if (next_move.includes(".")) {
      var move_pgn = game_pgn.substring(first_space+1)
      var second_space = move_pgn.indexOf(" ")
      next_move = game_pgn.substring(first_space+1, first_space + second_space+1)
    }
    move += " " + next_move
    if(modeMap[next_move] == null) {
      modeMap[next_move] = 1;
    }
    else {
        modeMap[next_move]++;
    }
    if(modeMap[next_move] > maxCount)
    {
        maxEl = next_move;
        maxCount = modeMap[next_move];
    }

  }
  // console.log(maxEl)
  return maxEl
}

/*
OPENINGS OVER TIME

Create plot of common openings over time. Reference: https://observablehq.com/@d3/multi-line-chart
*/

width_time = 500;
height_time = 200;
margin = ({top: 20, right: 20, bottom: 30, left: 30});
d3.select("#openings-over-time-svg")
  .attr("viewBox", [0, 0, width_time, height_time])
  .style("overflow", "visible");

function plotOpeningsOverTime() {
  var a = performance.now()
  opening_data.then(function(data) {
    var filterColor = "WhiteElo"
    if (chessColor === 'black') {
      filterColor = "BlackElo"
    }

    // Filter games by rating and date.
    var openingData = data.filter(function (d) {
      var a = performance.now()
      var elo = d.WhiteElo
      if (chessColor === 'black') {
        elo = d.BlackElo
      }
      var date_dot = d.Date
      var date_str = date_dot.replace(/\./g, "-");
      var date = new Date(date_str)

      var b = performance.now()

      // console.log(b-a + 'ms')

      return elo >= low_rating && elo <= high_rating && date >= start_date && date <= end_date;
    });

    var b = performance.now()
    // console.log(b-a + 'ms')

    // Get most common openings
    var openingFrequencies = {}
    var numOpenings = 10;
    for (var i = 0; i < openingData.length; i++) {
      openingName = openingData[i].Opening.split(':')[0];
      if (!(openingName in openingFrequencies)) {
        openingFrequencies[openingName] = 0;
      }
      openingFrequencies[openingName] += 1;
    }
    keysSorted = Object.keys(openingFrequencies).sort(function(a,b){return openingFrequencies[b]-openingFrequencies[a]});
    var openingsToPlot = keysSorted.slice(0, numOpenings);
    // console.log(openingsToPlot);

    function getOpeningFrequencies(data) {
      freqs = {}
      for (var i = 0; i < data.length; i++) {
        openingName = data[i].Opening.split(':')[0];
        if (!(openingName in freqs)) {
          freqs[openingName] = 0;
        }
        freqs[openingName] += 1;
      }
      freqsToPlot = []
      for (var i = 0; i < openingsToPlot.length; i++) {
        freqsToPlot.push(100 * freqs[openingsToPlot[i]] / data.length);
        // freqsToPlot.push(freqs[openingsToPlot[i]]);
      }
      return freqsToPlot;
    }

    // Group data by month
    // Reference: https://stackoverflow.com/questions/40847912/group-data-by-calendar-month
    var nested_data = d3.nest()
      // .key(function(d) { return d.Date.split('.').slice(0, 2).join('.'); })
      .key(function(d) {
        var incDate = new Date(d.Date.replace(/\./g, "-"));
        incDate.setDate(incDate.getDate()+1);
        // console.log(incDate);
        return incDate.getUTCFullYear() + "." + (incDate.getUTCMonth()+1);
      })
      .sortKeys(d3.ascending)
      .rollup(getOpeningFrequencies)
      .entries(openingData);
    // console.log(nested_data);
    var keys = nested_data.map(function(d){ return d.key; });
    var dates = []
    for (var i = 0; i < keys.length; i++) {
      dates.push(new Date(keys[i].replace(/\./g, "-")));
    }
    var linegraph_data = {
      "dates": dates,
      "series": []
    }
    for (var i = 0; i < openingsToPlot.length; i++) {
      openingFreqs = []
      for (var j = 0; j < keys.length; j++) {
        openingFreqs.push(nested_data[j].value[i]);
      }
      linegraph_data["series"].push({
        "name": openingsToPlot[i],
        "values": openingFreqs
      })
    }
    // console.log(linegraph_data);

    const svg = d3.select("#openings-over-time-svg")

    x = d3.scaleUtc()
        .domain(d3.extent(linegraph_data.dates))
        .range([margin.left, width_time - margin.right])
    y = d3.scaleLinear()
        .domain([0, d3.max(linegraph_data.series, d => d3.max(d.values))]).nice()
        .range([height_time - margin.bottom, margin.top])
    xAxis = g => g
        .attr("transform", `translate(0,${height_time - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width_time / 80).tickSizeOuter(0))
    yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("% Games"))

    line = d3.line()
        .defined(d => !isNaN(d))
        .x((d, i) => x(linegraph_data.dates[i]))
        .y(d => y(d))

    svg.select("#openings-over-time-xAxis")
        .call(xAxis);
    svg.select("#openings-over-time-yAxis")
        .call(yAxis);

    const path = svg.select("#openings-over-time-paths")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
      .selectAll("path")
      .data(linegraph_data.series)
      .join("path")
        .style("mix-blend-mode", "multiply")
        .attr("d", d => line(d.values));

    function hover(svg, path) {
      if ("ontouchstart" in document) svg
          .style("-webkit-tap-highlight-color", "transparent")
          .on("touchmove", moved)
          .on("touchstart", entered)
          .on("touchend", left)
      else svg
          .on("mousemove", moved)
          .on("mouseenter", entered)
          .on("mouseleave", left);

      const dot = svg.append("g")
          .attr("display", "none");

      dot.append("circle")
          .attr("r", 2.5);

      dot.append("text")
          .attr("font-family", "sans-serif")
          .attr("font-size", 10)
          .attr("text-anchor", "middle")
          .attr("y", -8);

      function moved(event) {
        event.preventDefault();
        const pointer = d3.pointer(event, this);
        const xm = x.invert(pointer[0]);
        const ym = y.invert(pointer[1]);
        const i = d3.bisectCenter(linegraph_data.dates, xm);
        const s = d3.least(linegraph_data.series, d => Math.abs(d.values[i] - ym));
        path.attr("stroke", d => d === s ? null : "#ddd").filter(d => d === s).raise();
        dot.attr("transform", `translate(${x(linegraph_data.dates[i])},${y(s.values[i])})`);
        dot.select("text").text(s.name);
      }

      function entered() {
        path.style("mix-blend-mode", null).attr("stroke", "#ddd");
        dot.attr("display", null);
      }

      function left() {
        path.style("mix-blend-mode", "multiply").attr("stroke", null);
        dot.attr("display", "none");
      }
    }
    svg.call(hover, path);

    const clickPath = svg.select("#openings-over-time-clickpaths")
        .attr("fill", "none")
        .attr('stroke', 'black').attr('stroke-width', 3)
        .attr('stroke-opacity', 0)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .style("cursor", "pointer")
      .selectAll("path")
      .data(linegraph_data.series)
      .join("path")
        .style("mix-blend-mode", "multiply")
        .attr("d", d => line(d.values));

    clickPath.on('click', function(event, d) {
      // FOR MATT
      console.log(d);
      var opening_pgn = openingDatabaseMap[d.name];
      console.log(opening_pgn);
      // $(window).scrollTop($('#visual-container').position().top);
      $('html, body').animate({scrollTop: $("#vis1").offset().top
            }, 2000);
      loadPGN(opening_pgn);
    })

    clickPath.on("mouseover", function(event, d) {
          d3.select(this).attr('stroke-opacity', 1);
          })
      .on("mouseout", function(event, d) {
          d3.select(this).attr('stroke-opacity', 0);
      });

  })
}


/*
WIN/DRAW RATES

Create graph with win/draw rate based on moves played.
*/

width_time = 400;
height_time = 200;
margin = ({top: 20, right: 20, bottom: 30, left: 30});
d3.select("#openings-over-time-svg")
  .attr("viewBox", [0, 0, width_time, height_time])
  .style("overflow", "visible");

// var div = d3.select("#win-graph").append("div")
//     .attr("class", "tooltip")
//     .style("opacity", 0);

const colorWin = "ForestGreen";
const colorDraw = "LightSkyBlue";

function analyze(val, chessColor, update_time=false) {
  opening_data.then(function(data) {
    var filterColor = "WhiteElo"
    if (chessColor === 'black') {
      filterColor = "BlackElo"
    }
    var openingData1 = data.filter(function (d) {
      var elo = d.WhiteElo
      if (chessColor === 'black') {
        elo = d.BlackElo
      }
      var date_dot = d.Date
      var date_str = date_dot.replace(/\./g, "-");
      var date = new Date(date_str)

      return elo >= low_rating && elo <= high_rating && date >= start_date && date <= end_date;
    });


    var openingData = openingData1.filter(function (d) {
      return d.Moves.startsWith(val);
    });

    num_games = openingData.length
    common_move = getMostCommonMove(openingData, val)
    var proportion = (openingData.length/data.length*100).toFixed(3)

    $games.html(String(openingData.length) + "  (" + String(proportion) + "%)")

    height_move = 270;
    width_move = 500;
    margin = ({top: 20, right: 20, bottom: 60, left: 50});

    var a = performance.now()

    const svg = d3.select("#analysis")
      .attr("viewBox", [0, 0, width_move, height_move]);

    x = d3.scaleLinear()
      .domain([500, 3200]).nice()
      .range([margin.left, width_move - margin.right])


    function getWinRate(d) {
      if (d.length === 0) {
        return 0;
      }
      var wins = 0;
      for (var i = 0; i < d.length; i++) {
        if (chessColor === 'white' && d[i].Result === "1-0") {
          wins++;
        }
        if (chessColor === 'black' && d[i].Result === "0-1") {
          wins++;
        }
      }
      return 100.0*wins/d.length;
    }


    function getDrawRate(d) {
      if (d.length === 0) {
        return 0;
      }
      var draws = 0;
      for (var i = 0; i < d.length; i++) {
        if (d[i].Result === "1/2-1/2") {
          draws++;
        }
      }
      return 100.0*draws/d.length;
    }

    thresholds = x.ticks(20)

    if (chessColor === 'white') {
      bins = d3.histogram()
        .value(d => d.WhiteElo)
        .domain(x.domain())
        .thresholds(thresholds)(openingData);
    }
    else {
      bins = d3.histogram()
        .value(d => d.BlackElo)
        .domain(x.domain())
        .thresholds(thresholds)(openingData);
    }

    y = d3.scaleLinear()
      .domain([0, 100]).nice()
      .range([height_move - margin.bottom, margin.top])

    xAxis = g => g
      .attr("transform", `translate(0,${height_move-margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width_move / 80 ).tickSizeOuter(0))
      .call(g => g.append("text")
        .attr("x", width_move - margin.right)
        .attr("y", -4)
        .attr("fill", "currentColor")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end"));

    yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(height_move / 40))
      .call(g => g.select(".domain").remove())
      .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold"));

    svg.select("#xAxisLabel")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left/2)
      .attr("x", 0 - ((height_move-margin.bottom)/ 2))
      .attr("dy", "-0.5em")
      .attr("font-size", 10)
      .style("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text("Win/Draw Rate (%)");

    svg.select("#yAxisLabel")
      .attr("y", height_move-margin.bottom/2)
      .attr("x", (width_move+margin.left)/2)
      .attr("dy", "0.4em")
      .attr("dx", "-0.7em")
      .attr("font-size", 10)
      .style("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text("Rating (Elo)");

    wins = svg.select("#wins")
      .attr("fill", colorWin)
      .selectAll("rect")
      .data(bins)
      .join("rect");

    wins.transition()
        .duration(400)
          .attr("x", d => x(d.x0) + 1)
          .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
          .attr("y", d => y(getWinRate(d)+getDrawRate(d)))
          .attr("height", d => y(0) - y(getWinRate(d)))
          .delay(function(d,i){
            return(100)
          });

    draws = svg.select("#draws")
        .attr("fill", colorDraw)
        .selectAll("rect")
        .data(bins)
        .join("rect")

    draws.transition()
          .duration(400)
          .attr("x", d => x(d.x0) + 1)
          .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
          .attr("y", d => y(getDrawRate(d)))
          .attr("height", d => y(0) - y(getDrawRate(d)))
          .delay(function(d,i){
            return(100)
          });

    // Create outlines
    outlines = svg.select("#outlines")
      .attr("fill-opacity", 0)
      .attr('stroke', 'black').attr('stroke-width', 1)
      .attr('stroke-opacity', 0)
      .selectAll("rect")
      .data(bins)
      .join("rect");

    outlines.attr("x", d => x(d.x0) + 1)
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", d => y(getWinRate(d)+getDrawRate(d)))
      .attr("height", d => y(0) - y(getWinRate(d)+getDrawRate(d)));

    var div = d3.select("#win-graph-tooltip");

    outlines.on("mouseover", function(event, d) {
          d3.select(this).attr('stroke-opacity', 2);
          div.transition()
              .duration(200)
              .style("opacity", .9);
          div.html("Number of games: " + d.length + "<br>" + "Wins: " + (getWinRate(d)).toFixed(1) + "%" + "<br>" + "Draws: " + (getDrawRate(d)).toFixed(1) + "%")
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
          })
      .on("mouseout", function(event, d) {
          d3.select(this).attr('stroke-opacity', 0);
          div.transition()
              .duration(500)
              .style("opacity", 0);
      });

    svg.select("#xAxis")
      .call(xAxis);

    svg.select("#yAxis")
      .call(yAxis);

    var b = performance.now()
    // console.log(b-a + 'ms');

  });
}

/*
TREEMAP (TEST)
*/
width = 954
height = 500
color = d3.scaleOrdinal(d3.schemeCategory10)
// treemap = data => d3.treemap()
//     .tile(d3.treemapSquarify)
//     .size([width, height])
//     .padding(1)
//     .round(true)
//   (d3.hierarchy(data)
//       .sum(d => d.value)
//       .sort((a, b) => b.value - a.value))


function makeTreemap() {
  // Filter games by rating and date.
  opening_data.then(function(data) {

    var openingData = data.filter(function (d) {
      var a = performance.now()
      var elo = d.WhiteElo
      if (chessColor === 'black') {
        elo = d.BlackElo
      }
      var date_dot = d.Date
      var date_str = date_dot.replace(/\./g, "-");
      var date = new Date(date_str)

      var b = performance.now()

      // console.log(b-a + 'ms')

      return elo >= low_rating && elo <= high_rating && date >= start_date && date <= end_date;
    });

    // Get most common openings
    var openingFrequencies = {}
    var numOpenings = 10;
    for (var i = 0; i < openingData.length; i++) {
      openingName = openingData[i].Opening.split(':')[0];
      if (!(openingName in openingFrequencies)) {
        openingFrequencies[openingName] = 0;
      }
      openingFrequencies[openingName] += 1;
    }
    keysSorted = Object.keys(openingFrequencies).sort(function(a,b){return openingFrequencies[b]-openingFrequencies[a]});
    var openingsToPlot = keysSorted.slice(0, numOpenings);
    console.log(openingFrequencies);
    console.log(openingsToPlot);

    data = [
      {
        name: "Origin",
        parent: null,
        value: null
      }
    ]

    for (var i=0; i < numOpenings; i++) {
      data.push({
        name: openingsToPlot[i],
        parent: "Origin",
        value: (100 * openingFrequencies[openingsToPlot[i]] / openingData.length).toFixed(1)
      })
    }

    console.log(data);

    // console.log(data);
    // stratify the data: reformatting for d3.js
    var root = d3.stratify()
      .id(function(d) { return d.name; })   // Name of the entity (column name is name in csv)
      .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
      (data);
    root.sum(function(d) { return +d.value })   // Compute the numeric value for each entity

    d3.treemap()
      .size([width, height])
      .padding(4)
      (root)

    const svg = d3.select("#openings-treemap-svg")
        .attr("viewBox", [0, 0, width, height])
        .style("font", "18px sans-serif");

    // Clear treemap before building new one.
    svg.selectAll("g").remove();

    const leaf = svg.selectAll("g")
      .data(root.leaves())
      .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    leaf.append("title")
        .text(d => d.name);

    // Make tooltips
    // const tooltip = d3.select("#openings-treemap-tooltip")
    //     .attr("viewBox", [0, 0, width, height])
    //
    // const tooltip_leaf = svg.selectAll("g")
    //   .data(root.leaves())
    //   .join("div")
    //     .attr("transform", d => `translate(${d.x0},${d.y0})`);
    //
    // tooltip_leaf.append("div")
    //     // .attr("id", d => (d.leafUid = DOM.uid("leaf")).id)
    //     // .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
    //     // .attr("fill-opacity", 0.6)
    //     .attr("width", d => d.x1 - d.x0)
    //     .attr("height", d => d.y1 - d.y0)
    //     .attr('stroke', 'black').attr('stroke-width', 1)
    //     .attr('stroke-opacity', 0)
    //     .attr('id', d => "openings-treemap-tooltip"+d.data.name)
    //     .style("cursor", "pointer")
    //     .style("position", "relative")
    //
    // for (var i=0; i < data.length; i++) {
    //   if (data[i].name != "Origin") {
    //     console.log("openings-treemap-tooltip"+data[i].name);
    //     tooltipBoard = Chessboard("openings-treemap-tooltip"+data[i].name);
    //     tooltipGame = new Chess();
    //     tooltipGame.load_pgn(openingDatabaseMap[data[i].name]);
    //     tooltipBoard.position(tooltipGame.fen());
    //   }
    // }

    leaf.append("rect")
        .attr("id", d => "openings-treemap-node-"+d.data.name)
        .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
        .attr("fill-opacity", 0.6)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr('stroke', 'black').attr('stroke-width', 1)
        .attr('stroke-opacity', 0)
        .style("cursor", "pointer")
        .style("position", "relative")
        .on('mouseover', function(event, d) {
          console.log(d);
          d3.select(this).attr('stroke-opacity', 2);

          // On mouseover, show a chessboard with this opening
          // boardTooltipDiv = leaf.append("div")
          //                      .attr("id", "openings-treemap-tooltip");
          boardTooltipDiv = d3.select("#openings-treemap-tooltip");

          // tooltipSize = 0.7 * Math.min(d.y1-d.y0, d.x1-d.x0);
          tooltipSize = 200;
          boardTooltipDiv.style("width", tooltipSize+"px")
                         .style("height", tooltipSize+"px")
                         .style("position", "absolute");

          tooltipBoard = Chessboard("openings-treemap-tooltip");
          tooltipGame = new Chess();
          tooltipGame.load_pgn(openingDatabaseMap[d.data.name]);
          tooltipBoard.position(tooltipGame.fen())
          boardTooltipDiv.transition()
              .duration(200)
              .style("opacity", .9);

          // Position the tooltip
          var bodyRect = document.body.getBoundingClientRect();
          var elemRect = document.getElementById("openings-treemap-node-"+d.data.name).getBoundingClientRect();
          var offsetTop = elemRect.top - bodyRect.top;
          var offsetLeft = elemRect.left - bodyRect.left;

          console.log(offsetTop);
          console.log(offsetLeft);

          boardTooltipDiv.style("left", offsetLeft + "px")
                         .style("top", offsetTop + "px");
        })
        .on('mouseout', function(event, d) {
          d3.select(this).attr('stroke-opacity', 0);
          boardTooltipDiv = d3.select("#openings-treemap-tooltip");
          boardTooltipDiv.transition()
              .duration(500)
              .style("opacity", 0);
          // boardTooltipDiv.remove();
        });

    leaf.append("clipPath")
      .append("use")

    leaf.append("text")
        .attr("clip-path", d => d.clipUid)
      .selectAll("tspan")
      .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(d.value + "%"))
      .join("tspan")
        .attr("x", 3)
        .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
        .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        .text(d => d);

    var clickTreeNode = leaf.selectAll("rect")
    clickTreeNode.on('click', function(event, d) {
      console.log(d);
      var opening_pgn = openingDatabaseMap[d.data.name];
      console.log(opening_pgn);
      $('html, body').animate({scrollTop: $("#vis1").offset().top
            }, 2000);
      loadPGN(opening_pgn);
    })
  });
}


/*
CONFIGURE CHESSBOARD
*/
var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
board = Chessboard('myBoard', config)


/*
STARTUP SCRIPTS
*/
updateStatus(true)

svg = d3.select("#analysis");
svg.append("rect")
    .attr("x", 380).attr("y", 6).attr("width",100).attr("height",48)
    .style("fill", "azure")
    .style("stroke", "black")
    .style("stroke-width", "1px")
    .style("fill-opacity", "70%")
svg.append("rect").attr("x", 390).attr("y", 14).attr("width",20).attr("height",13).style("fill", colorWin)
svg.append("rect").attr("x", 390).attr("y", 34).attr("width",20).attr("height",13).style("fill", colorDraw)
svg.append("text").attr("x", 420).attr("y", 20).text("% Wins").style("font-size", "11px").attr("alignment-baseline","middle")
svg.append("text").attr("x", 420).attr("y", 40).text("% Draws").style("font-size", "11px").attr("alignment-baseline","middle")

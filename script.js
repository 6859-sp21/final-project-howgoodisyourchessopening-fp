var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var $games = $('#games')
$games.html("0/0" + "  (" + "0.00" + "%)")
var master_data = d3.tsv("https://raw.githubusercontent.com/6859-sp21/a4-howgoodisyourchessopening/main/2021-02-cleaned_1000000.csv", d3.autoType)

var num_games = master_data.length
var first_move = getMostCommonMove(master_data, "")
var common_move = first_move

var low_rating = 0;
var high_rating = 9999;
var input_rating = false;
var start_date = new Date("2021-02-01")
var end_date = new Date("2021-02-28")


$('#chessColor').on('change', function() {analyze(game.pgn(), this.value)})


function filterByRating() {
  low_rating = document.getElementById("input-rating-low").value;
  high_rating = document.getElementById("input-rating-high").value;
  // console.log(low_rating);
  // console.log(high_rating);
  updateStatus();
}


function filterByDate() {
  start_date = new Date(document.getElementById("start-date").value);
  end_date = new Date(document.getElementById("end-date").value);
  updateStatus();
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

function updateStatus () {
  analyze(game.pgn(), document.getElementById("chessColor").value)
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
    console.log(date_str)
    var date = new Date(date_str)
    console.log(date);
    console.log(date >= start_date && date <= end_date);
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
    // console.log(game_pgn)
    var first_space = game_pgn.indexOf(" ")
    var next_move = game_pgn.substring(0, first_space)
    if (next_move.includes(".")) {
      // console.log("NO NUT")
      var move_pgn = game_pgn.substring(first_space+1)
      // console.log(move_pgn)
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


var div = d3.select("#win-graph").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


const colorWin = "ForestGreen";
const colorDraw = "LightSkyBlue";



function analyze(val, chessColor) {
  console.log(start_date)
  console.log(end_date)
  // console.log("ANALYZE");
  // d3.tsv("https://raw.githubusercontent.com/6859-sp21/a4-howgoodisyourchessopening/main/2021-02-cleaned_1000000.csv", d3.autoType).then(function(data) {
  master_data.then(function(data) {
    // document.getElementById('main').append(val);
    // console.log(data.length)
    var filterColor = "WhiteElo"
    if (chessColor === 'black') {
      filterColor = "BlackElo"
    }
    // var openingData = data.filter(d => d.Moves.startsWith(val));
    var openingData = data.filter(function (d) {
      var elo = d.WhiteElo
      if (chessColor === 'black') {
        elo = d.BlackElo
      }
      var date_dot = d.Date
      var date_str = date_dot.replace(/\./g, "-");
      // console.log(date_str)
      var date = new Date(date_str)
      // console.log(date)

      return elo >= low_rating && elo <= high_rating && d.Moves.startsWith(val) && date >= start_date && date <= end_date;
    });

    num_games = openingData.length
    // console.log(num_games)

    common_move = getMostCommonMove(openingData, val)

    // console.log(openingData);
    var proportion = (openingData.length/data.length*100).toFixed(3)

    $games.html(String(openingData.length) + "  (" + String(proportion) + "%)")
    // var elos = new Array(openingData.length);
    // for (var i=0; i < openingData.length; i++) {
    //   elos[i] = openingData[i].WhiteElo;
    // }
    // console.log(elos);
    // Formatting parameters
    height = 270;
    width = 500;
    margin = ({top: 20, right: 20, bottom: 60, left: 50});

    const svg = d3.select("#analysis")
      .attr("viewBox", [0, 0, width, height]);

    x = d3.scaleLinear()
      .domain([500, 3200]).nice()
      // .domain([bins[0].x0, bins[bins.length - 1].x1])
      .range([margin.left, width - margin.right])


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

    // console.log(bins);

          // KDE code from https://observablehq.com/@d3/kernel-density-estimation
          // function kde(kernel, thresholds, data) {
          //   return thresholds.map(t => [t, d3.mean(data, d => kernel(t - d))]);
          // }
          // function epanechnikov(bandwidth) {
          //   return x => Math.abs(x /= bandwidth) <= 1 ? 0.75 * (1 - x * x) / bandwidth : 0;
          // }
          // bandwidth = 1;
          // resultsArr = openingData.map(d => isWin(d.Result));
          // console.log(resultsArr);
          // density = kde(epanechnikov(bandwidth), thresholds, resultsArr);
          // console.log(density);

    y = d3.scaleLinear()
      // .domain([0, d3.max(bins, d => getWinRate(d))]).nice()
      .domain([0, 100]).nice()
      .range([height - margin.bottom, margin.top])

    // line = d3.line()
    //     .curve(d3.curveBasis)
    //     .x(d => x(d[0]))
    //     .y(d => y(d[1]));

    xAxis = g => g
      .attr("transform", `translate(0,${height-margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80 ).tickSizeOuter(0))
      .call(g => g.append("text")
        .attr("x", width - margin.right)
        .attr("y", -4)
        .attr("fill", "currentColor")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end"));
//         .text("Rating (Elo)"))

    yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(height / 40))
      .call(g => g.select(".domain").remove())
      .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold"));
//         .text("Win/Draw Rate (%)"))
    
    svg.select("#xAxisLabel")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left/2)
      .attr("x", 0 - ((height-margin.bottom)/ 2))
      .attr("dy", "-0.5em")
      .attr("font-size", 10)
      .style("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text("Win/Draw Rate (%)");      
      
    svg.select("#yAxisLabel")
      .attr("y", height-margin.bottom/2)
      .attr("x", (width+margin.left)/2)
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
            // console.log(i) ;
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


  });
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
board = Chessboard('myBoard', config)

updateStatus()

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
var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var $games = $('#games')
var master_data = d3.tsv("https://raw.githubusercontent.com/6859-sp21/a4-howgoodisyourchessopening/main/2021-02-cleaned_100000.csv", d3.autoType)
var search_data = master_data

$('#startBtn').on('click', function() {reset()})

function reset() {
    console.log("RESET!!")
    game.reset()
    board.start(false)
    search_data = master_data
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
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
  // console.log(game.pgn())
  analyze(game.pgn())


}

function handleClick(event){
    // console.log(document.getElementById("openingMoves").value);
    analyze(document.getElementById("openingMoves").value);
    return false;
}

var div = d3.select("#win-graph").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function analyze(val) {
  console.log("ANALYZE");
  // d3.tsv("https://raw.githubusercontent.com/6859-sp21/a4-howgoodisyourchessopening/main/2021-02-cleaned_1000000.csv", d3.autoType).then(function(data) {
  master_data.then(function(data) {
    // document.getElementById('main').append(val);
    // console.log(data.length);
    var openingData = data.filter(d => d.Moves.startsWith(val));

    // console.log(openingData);

    $games.html(openingData.length)
    var elos = new Array(openingData.length);
    for (var i=0; i < openingData.length; i++) {
      elos[i] = openingData[i].WhiteElo;
    }
    // console.log(elos);
    // Formatting parameters
    height = 200;
    width = 500;
    margin = ({top: 20, right: 20, bottom: 30, left: 40});

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
        if (d[i].Result === "1-0") {
          wins++;
        }
      }
      return 1.0*wins/d.length;
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
      return 1.0*draws/d.length;
    }

    // function getMostCommonNextMove(d) {
    //   if (d.length === 0) {
    //     return 0;
    //   }
    //   moves =
    //   for (var i = 0; i < d.length; i++) {
    //     nextMoves = d[i].Moves.substr(val.length+1);
    //     if (nextMoves[1] === '.') {
    //       nextMoves = nextMoves.substr(3);
    //     }
    //     nextMove = nextMoves.split(' ', 2)[0];
    //     if ()
    //   }
    // }

    thresholds = x.ticks(20)
    bins = d3.histogram()
      .value(d => d.WhiteElo)
      .domain(x.domain())
      .thresholds(thresholds)(openingData);
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
      .domain([0, 1]).nice()
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
        .attr("text-anchor", "end")
        .text("Rating"))

    yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(height / 40))
      .call(g => g.select(".domain").remove())
      .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Win/Draw Rate"))

    colorWin = "ForestGreen";
    colorDraw = "LightSkyBlue";

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
          div.html("Number of games: " + d.length + "<br>" + "Wins: " + (getWinRate(d)*100).toFixed(1) + "%" + "<br>" + "Draws: " + (getDrawRate(d)*100).toFixed(1) + "%")
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

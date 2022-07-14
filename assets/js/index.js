// Remove contextual menu when cliquing left mouse button
//  $("body").bind("contextmenu", function(event) {
//     event.preventDefault();
// });


// Default SVG canvas
var drawingSize = {
	"width": 800,
	"height": 800
};
var draw = SVG("drawing").size(drawingSize.width, drawingSize.height);
var canvas = $("#drawing");
var canvasOffset = canvas.offset();
let Stack = [];

// Others main variables
var gameStarted = false;
var gameEnded = false;
var boxes = [];
var tubes = [];
var totalMoves = 0;
var Playerobject = null; 
var currentSelectedBox = null;

var numberOfTubes = {
	"rows": 2,
	"columns": 4
};
var numberOfBoxesInTubes = 4;

// Choice of the initial empty tube
var emptyTube = {
	"row": getRandomNumber(numberOfTubes.rows),
	"column": getRandomNumber(numberOfTubes.columns)
};

var boxesInfos = {
	"size": {
		"width": 50,
		"height": 50
	},
	"spaceBetween": {
		"upDown": 3
	},
	"colors": ["FA84C9", "99CCCC", "FFFE59", "E0E0E0", "FB952C", "AA5EF6", "56CF3E"] // Add colors if more then 8 tubes !!!
};
var tubeInfos = {
	"size": {
		"width": boxesInfos.size.width + 20,
		"height": numberOfBoxesInTubes * (boxesInfos.size.height + boxesInfos.spaceBetween.upDown) - boxesInfos.spaceBetween.upDown + 20
	},
	"border": {
		"color": "white",
		"thickness": 2
	},
	"inner": {
		"color": "#404040"
	},
	"spaceBetween": {
		"sideway": 80,
		"upDown": 80
	}
};

var colorsAlreadyDrawn = [];

var totalTubesWidth = numberOfTubes.columns * (tubeInfos.size.width + tubeInfos.spaceBetween.sideway) - tubeInfos.spaceBetween.sideway + 2 * (tubeInfos.border.thickness / 2); // 2 half-border (left and right)
var totalTubesHeight = numberOfTubes.rows * (tubeInfos.size.height + tubeInfos.spaceBetween.upDown) - tubeInfos.spaceBetween.upDown + (tubeInfos.border.thickness / 2); // 1 half-border down side
var startTubesX = (drawingSize.width - totalTubesWidth) / 2;
var startTubesY = (drawingSize.height - totalTubesHeight) / 2;


function unsetElements(elements) {
	for (let i = 0; i < elements.length; i++) {
        elements[i].remove();
	}
	return elements;
}

function pf(e) {
	console.log(e);
}

function getDistance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function getRandomNumber(value1, value2 = 0) {
	let min = value1, max = value2;
	if (value2 === 0) {
		min = 0;
		max = value1;
	}
	return Math.floor((Math.random() * (max - min)) + min);
}

function getNewBoxColor() {
	let randomColorNumber;
	do {
		randomColorNumber = getRandomNumber(boxesInfos.colors.length);
	} while (colorsAlreadyDrawn[randomColorNumber] === 0);
	colorsAlreadyDrawn[randomColorNumber] -= 1;
	return boxesInfos.colors[randomColorNumber];
}

function calculateBoxPosition(iRowTube, iColumnTube, iBox) {
	let startTubeX = startTubesX + iColumnTube * (tubeInfos.size.width + tubeInfos.spaceBetween.sideway);
	let startTubeY = startTubesY + iRowTube * (tubeInfos.size.height + tubeInfos.spaceBetween.upDown);
	return {
		"x": startTubeX + 10,
		"y": startTubeY + (numberOfBoxesInTubes - iBox - 1) * (boxesInfos.size.height + boxesInfos.spaceBetween.upDown) + 10
	};
}

function calculateTubePosition(iRow, iColumn) {
	return {
		"x": startTubesX + iColumn * (tubeInfos.size.width + tubeInfos.spaceBetween.sideway),
		"y": startTubesY + iRow * (tubeInfos.size.height + tubeInfos.spaceBetween.upDown)
	};
}

function addNewBox(iRowTube, iColumnTube) {
	addBox(iRowTube, iColumnTube, getNewBoxColor());
}

function addBox(iRowTube, iColumnTube, boxColor) {
	let iBox = boxes[iRowTube][iColumnTube].length;
	let boxPosition = calculateBoxPosition(iRowTube, iColumnTube, iBox);
	let box = draw.circle(boxesInfos.size.width, boxesInfos.size.height).attr({fill: "#" + boxColor}).move(boxPosition.x, boxPosition.y);
	boxes[iRowTube][iColumnTube].push({"element": box, "color": boxColor});
}

function addTube(iRow, iColumn) {
	let tubePosition = calculateTubePosition(iRow, iColumn);
	let tube = draw.polyline([
		tubePosition.x, tubePosition.y,
		tubePosition.x, tubePosition.y+tubeInfos.size.height,
		tubePosition.x+tubeInfos.size.width, tubePosition.y+tubeInfos.size.height,
		tubePosition.x+tubeInfos.size.width, tubePosition.y
	]).attr({fill: tubeInfos.inner.color}).stroke({width: tubeInfos.border.thickness, color: tubeInfos.border.color});
	tubes[iRow][iColumn] = tube;
}

function mouseInTube(mousePosition) {
	for (let iRow = 0; iRow < numberOfTubes.rows; iRow++) {
		for (let iColumn = 0; iColumn < numberOfTubes.columns; iColumn++) {
			let tubeX = tubes[iRow][iColumn].x();
			let tubeY = tubes[iRow][iColumn].y();
			if (mousePosition.x > tubeX - 15 && mousePosition.x < tubeX + tubeInfos.size.width + 15) {
				if (mousePosition.y > tubeY - 15 && mousePosition.y < tubeY + tubeInfos.size.height + 15) {
					return {'row': iRow, 'column': iColumn};
				}
			}
		}
	}
}

function moveCurrentBoxToTube(tube) {
	addBox(tube.row, tube.column, currentSelectedBox.color);
	removeCurrentBox();
}

function removeCurrentBox() {
	boxes[currentSelectedBox.row][currentSelectedBox.column][currentSelectedBox.iBox].element.remove();
	boxes[currentSelectedBox.row][currentSelectedBox.column].splice(-1, 1);
}

function initTubes() {
	for (let iRow = 0; iRow < numberOfTubes.rows; iRow++) {
		tubes[iRow] = [];
		for (let iColumn = 0; iColumn < numberOfTubes.columns; iColumn++) {
			addTube(iRow, iColumn);
		}
	}
}

function initBoxes() {
	for (let iRow = 0; iRow < numberOfTubes.rows; iRow++) {
		boxes[iRow] = [];
		for (let iColumn = 0; iColumn < numberOfTubes.columns; iColumn++) {
			boxes[iRow][iColumn] = [];
			if (iRow !== emptyTube.row || iColumn !== emptyTube.column) {
				for (let iBox = 0; iBox < numberOfBoxesInTubes; iBox++) {
					addNewBox(iRow, iColumn);
				}
			}
		}
	}
}

function getPos(boxes){
	for(let i = 0; i < boxes.length; i++){
		for(let j = 0; j < boxes[i].length; j++){
			for(let k = 0; k < boxes[i][j].length; k++){
				// console.log(boxes[i][j][k]);
			}
		}
	}
}

function undo(){
	if(Stack.length != 0){
		Stack.pop();
		boxes = Stack[Stack.length - 1];
	}
}


function checkIfGameIsEnded() {
	Stack.push(boxes);
	getPos(boxes);
	totalMoves++;
	if (gameEnded) return true;
	for (let iRow = 0; iRow < numberOfTubes.rows; iRow++) {
		for (let iColumn = 0; iColumn < numberOfTubes.columns; iColumn++) {
			let boxesInTube = boxes[iRow][iColumn].length;
			if (boxesInTube === numberOfBoxesInTubes) {
				let colorFirstBoxOfTube = boxes[iRow][iColumn][0].color;
				for (let iBox = 1; iBox < numberOfBoxesInTubes; iBox++) {
					if (boxes[iRow][iColumn][iBox].color !== colorFirstBoxOfTube) return false;
				}
			} else if (boxesInTube !== 0) {
				return false;
			}
		}
	}
	return true;
}

// When mouse down
$(canvas).mousedown(function(event) {

	if (gameStarted) {

		if (!gameEnded) { // If then current game isn't finished yet

			let mousePosition = {
				"x": event.pageX - canvasOffset.left,
				"y": event.pageY - canvasOffset.top
			};
			
			if (event.which === 1) { // When left clicking

				let tube = mouseInTube(mousePosition);

				if (currentSelectedBox === null) { // If no box is currently selected
					if (typeof tube !== "undefined") { // If the click is on a tube
						if (boxes[tube.row][tube.column].length > 0) { // If there is a box in the tube clicked
							let iBox = boxes[tube.row][tube.column].length - 1;
							currentSelectedBox = {
								"row": tube.row,
								"column": tube.column,
								"color": boxes[tube.row][tube.column][iBox].color,
								"iBox": iBox
							};
							boxes[tube.row][tube.column][iBox].element.dmove(0, -30); // Move it upward
						}
					}
				} else { // If a box is currently selected
					if (typeof tube === "undefined" || boxes[tube.row][tube.column].length === 4 || (tube.row === currentSelectedBox.row && tube.column === currentSelectedBox.column)) { // If the click is out of a tube or, the tube clicked is already full, or the tube clicked is the same as where is the current selected box
						boxes[currentSelectedBox.row][currentSelectedBox.column][currentSelectedBox.iBox].element.dmove(0, 30); // Reset position
						currentSelectedBox = null;
					} else { // A box is selected and the tube clicked is not full
						moveCurrentBoxToTube(tube);
						currentSelectedBox = null;
						gameEnded = checkIfGameIsEnded();
						if (gameEnded) {
							localStorage.setItem("currScore" , document.getElementById("timer").innerText);
							var currScore =  document.getElementById("timer").innerText;
							document.getElementById("timer").style.display = "none";
							if(Playerobject == null){
								var PlayerName = prompt("Well Done! Time Taken: " + localStorage.getItem("currScore") + " and Total Moves Done: " + totalMoves + "If you broke the global highscore then click on \"Save Score\"");
								Playerobject = {
									name: PlayerName,
									moves: totalMoves,
									score: currScore
								}
								// localStorage.setItem("PlayerObject" , Playerobject);
								localStorage.setItem("name" , PlayerName);
								localStorage.setItem("moves" , totalMoves);
								

								console.log(JSON.stringify(Playerobject));
							}
							else {
								alert("Well Done! Time Taken: " + localStorage.getItem("currScore") + " and Total Moves Done: " + totalMoves + ". Your Score has been updated.")
							}
						}
					}
				}
			} else { // When right clicking
				if (currentSelectedBox !== null) { // If a box is currently selected
					boxes[currentSelectedBox.row][currentSelectedBox.column][currentSelectedBox.iBox].element.dmove(0, 30); // Reset position
					currentSelectedBox = null;
				}
			}
		} else {
			startGame();
		}
	}
});

function initVariables() {
	gameEnded = false;
	boxes = [];
	tubes = [];

	currentSelectedBox = null;

	// Select empty tube
	emptyTube = {
		"row": getRandomNumber(numberOfTubes.rows),
		"column": getRandomNumber(numberOfTubes.columns)
	};


	colorsAlreadyDrawn = [];
	for (var i = 0; i < boxesInfos.colors.length; i++) {
		colorsAlreadyDrawn.push(numberOfBoxesInTubes);
	}
}

function startGame() {
	// // Inits
	initVariables();

	// Tubes' init
	initTubes();

	// Boxes' init
	initBoxes();

	getPos(boxes);

	gameStarted = true;
}

startGame();
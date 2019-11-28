// required inputs
// 0 - free space
// 1 - block
// 2 - your vehicle (singleton - assumption)
// 3 - your home (singleton - assumption)
// -2 - already visited

const initialFuel = 6;
const rows = 12, cols = 12;
const inputMatrix = [
//   0  1  2  3   4  5  6  7  8  9 10 11
    [1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1], // 0
    [1, 0, 0, 0,  0, 0, 0, 0, 0, 0, 3, 1], // 1
    [1, 0, 1, 1,  0, 0, 0, 0, 1, 1, 0, 1], // 2
    [1, 0, 1, 1,  0, 0, 0, 0, 1, 1, 0, 1], // 3
    [1, 0, 1, 1,  0, 0, 4, 0, 1, 1, 0, 1], // 4
    [1, 0, 1, 1,  0, 0, 0, 0, 1, 1, 0, 1], // 5
    [1, 0, 0, 0, 11, 0, 0, 0, 7, 0, 0, 1], // 6
    [1, 0, 1, 1,  1, 1, 0, 1, 0, 0, 0, 1], // 7
    [1, 0, 1, 1,  1, 1, 0, 1, 0, 0, 0, 1], // 8
    [1, 0, 1, 1,  1, 1, 5, 0, 0, 0, 0, 1], // 9
    [1, 2, 0, 0,  0, 0, 0, 0, 0, 0, 0, 1], // 10
    [1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1], // 11
];

// one-way binding
// for above input
// inputMatrix.forEach((row, i, matrix) => {
//     row.forEach((value, j) => {
//         matrix[i].__defineSetter__(j, function(newValue) { 
//             document.querySelector(`[data-1w-bind="(${i},${j})"]`).textContent = newValue;
//         });
//         matrix[i].__defineGetter__(j, function() { return value; });
//     });
// });

let blockColors = [
    "#ccc",
    "#444",
    "#da4fbc",
    "#39c139",
    "blue"
];

// move logger for UI basis
let moveLogger = [];
let vehicle = null;
let blockWidth = null, blockHeight = null;

// get req. elements reference
var animationContainer = document.getElementById('animation-container');

function setWidth(element, value) {
    element
}

function designUI() {
    // add elements based on input matrix
    // let numOfBlocks = rows * cols;
    let html = '';
    inputMatrix.forEach( (row, i) => {
        row.forEach( (value, j) => {
            html += `<div data-1w-bind="(${i},${j})" style="float: left; width: ${100/rows}%; height: ${100/cols}%; background-color: ${value > 3 ? blockColors[4] : value != 2 ? blockColors[value] : blockColors[0]};"></div>`;
            value == 2? html += `<div id="vehicle" style="float: left; width: ${100/rows}%; height: ${100/cols}%; background-color: ${blockColors[value]}; position: absolute; transform: translate(${j * 100 / cols}%, ${i * 100 / rows}%);"></div>`: null;
        });
    });

    animationContainer.innerHTML = html;
    // save vehicle-reference
    vehicle = document.getElementById("vehicle");
}

// in move-logger, first value
// is starting-point of vehicle
// so, ignore it.
// ---------------
// current-move
let currentMoveIndex = 1;
let startTime = null;

// We use this function for animating
// the path
function moveBlock(currentTime) {
    if(!startTime) startTime = currentTime;
    let timeGap = currentTime - startTime;
    // console.log(currentMoveIndex);
    if(timeGap >= 500) { // i.e 1sec
        // console.log(currentMoveIndex);
        // get co-ordinates
        let {x,y} = moveLogger[currentMoveIndex];
        // go to next move
        currentMoveIndex++;
        // move block
        vehicle.style.transform = `translate(${y * blockWidth}px, ${x * blockHeight}px)`;

        // check if reached destination
        if(currentMoveIndex == moveLogger.length) return;

        // reset start-time
        startTime = performance.now();
    }

    requestAnimationFrame(moveBlock);
}

function startAnimation() {
    // get block's width and height
    // https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements
    let domRect = vehicle.getBoundingClientRect();
    blockWidth = domRect.height;
    blockHeight = domRect.width;
    console.log(blockWidth);
    console.log(blockHeight);

    let {x, y} = moveLogger[0];
    vehicle.style.transform = `translate(${y * blockWidth}px, ${x * blockHeight}px)`;
    // use requestAnimationFrame
    // want to know why ?
    // open the below link
    // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    requestAnimationFrame(moveBlock);
}

function getNewMatrix(matrix) {
    let newMatrix = [];
    matrix.forEach( (row, i) => {
        newMatrix[i] = [];
        row.forEach( (value, j) => {
            newMatrix[i][j] = value;
        });
    });
    // one-way binding gor newMatrix
    
    return newMatrix;
}

function copyRoute(route) {
    let newRoute = [];
    route.forEach(obj => {
        newRoute.push({
            x: obj.x,
            y: obj.y
        });
    });
    return newRoute;
}

function PathFinder(initialFuel, rows, cols, matrix) {
    this.fuel = initialFuel;
    this.rows = rows;
    this.cols = cols;
    // this.matrix = getNewMatrix(matrix);
    this.matrix = matrix;
    this.vehiclePosition = {
        x: -1,
        y: -1
    }
    this.allPossibleRoutes = [];
    // current-route and src-destination route are different
    // bcoz current-route will be manipulated even after the route was found
    // but src-destination will not (it actually contains the whole route)
    this.currentRoute = [];
    // must be null
    this.srcDestRoute = null;

    this.getVehiclePosition = () => {
        for(let x = 0; x < this.rows; x++) {
            for(let y = 0; y < this.cols; y++ ) {
                if(this.matrix[x][y] == 2) {
                    this.vehiclePosition.x = x;
                    this.vehiclePosition.y = y;
                    console.log(this.vehiclePosition);
                }
            }
        }
    }

    // safety check functions
    this.canMoveUp = () => {
        let x = this.vehiclePosition.x;
        let y = this.vehiclePosition.y;
        return x > 0 && this.matrix[x - 1][y] != 1 && this.fuel && this.matrix[x - 1][y] >= 0;
    }
    this.canMoveRight = () => {
        let x = this.vehiclePosition.x;
        let y = this.vehiclePosition.y;
        return (y + 1) < this.cols && this.matrix[x][y + 1] != 1 && this.fuel && this.matrix[x][y + 1] >= 0;
    }
    this.canMoveDown = () => {
        let x = this.vehiclePosition.x;
        let y = this.vehiclePosition.y;
        return (x + 1) < this.rows && this.matrix[x + 1][y] != 1 && this.fuel && this.matrix[x + 1][y] >= 0;
    }
    this.canMoveLeft = () => {
        let x = this.vehiclePosition.x;
        let y = this.vehiclePosition.y;
        return y > 0 && this.matrix[x][y - 1] != 1 && this.fuel && this.matrix[x][y - 1] >= 0;
    }
    
    // support functions
    this.burnUnitFuel = () => {
        this.fuel --;
        console.log(this.fuel);
    }

    // this.fillUnitFuel = () => {
    //     this.fuel ++;
    //     console.log(this.fuel);
    // }

    this.fillFuel = (fuel) => {
        this.fuel += fuel;
        console.log(this.fuel);
    }


    this.recordMoveInCurrentRoute = () => {
        let x = this.vehiclePosition.x;
        let y = this.vehiclePosition.y;
        // insert into current route
        this.currentRoute.push({x,y});
        // fill fuel in that move (can be 0 or more than 3)
        this.fillFuel(this.matrix[x][y] < 4? 0: this.matrix[x][y]);
        // mark as visited if not home
        if(this.matrix[x][y] != 3) {
            if(this.matrix[x][y] == 2)
                this.matrix[x][y] = -2;
            else
                this.matrix[x][y] = this.matrix[x][y]*-1 - 2;
        }
        // console.log(this.currentRoute);
        // log move
        moveLogger.push({x,y});
    }

    this.retraceOneStepBack = () => {
        // take last move from the current route
        // and assign it to vehicle

        // below is the wrong way, bcoz in js,
        // assigning one obj to another using '=' operator
        // doesnot copy, but both points to same obj
        // this.vehiclePosition = this.currentRoute[ this.currentRoute.length - 2 ];
        this.vehiclePosition.x = this.currentRoute[ this.currentRoute.length - 2 ].x;
        this.vehiclePosition.y = this.currentRoute[ this.currentRoute.length - 2 ].y;
        console.log(this.vehiclePosition);
        // remove the last move
        let lastMove = this.currentRoute.pop();
        // take current-poition of vehicle
        let {x,y} = this.vehiclePosition;
        // mark the move as unvisited
        this.matrix[lastMove.x][lastMove.y] = this.matrix[lastMove.x][lastMove.y]*-1 - 2;
        // fill one unit fuel that was spent for last move
        // and empty 'n' unitsof fuel taken in last step
        this.fillFuel(this.matrix[x][y] + 2 + 1);
        // log move
        moveLogger.push({x,y});
    }

    this.reachedHome = () => {
        let x = this.vehiclePosition.x;
        let y = this.vehiclePosition.y;
        return this.matrix[x][y] == 3;
    }
    // move functions
    this.moveUp = () => {
        this.vehiclePosition.x--;
        console.log(this.vehiclePosition);
        this.burnUnitFuel();
    }

    this.moveRight = () => {
        this.vehiclePosition.y ++;
        console.log(this.vehiclePosition);
        this.burnUnitFuel();
    }

    this.moveDown = () => {
        this.vehiclePosition.x ++;
        console.log(this.vehiclePosition);
        this.burnUnitFuel();
    }

    this.moveLeft = () => {
        this.vehiclePosition.y --;
        console.log(this.vehiclePosition);
        this.burnUnitFuel();
    }

    // main functions
    this.getRouteToHome = () => {
        console.log(this.matrix);
        if(this.reachedHome()) return;
        // choose move
        if(this.canMoveUp()) {
            // make move
            this.moveUp();
            // checked if reached home
            if(this.reachedHome()) {
                // record move
                this.recordMoveInCurrentRoute();
                // assign only if src-destination route does not exists
                this.srcDestRoute = this.srcDestRoute ? this.srcDestRoute : copyRoute(this.currentRoute);
                return;
            }
            // record move
            this.recordMoveInCurrentRoute();
            // repeat the process
            this.getRouteToHome();
        }
        if(this.reachedHome()) return;
        console.log(this.matrix);
        if(this.canMoveRight()) {
            // make move
            this.moveRight();
            // checked if reached home
            if(this.reachedHome()) {
                // record move
                this.recordMoveInCurrentRoute();
                // assign only if src-destination route does not exists
                this.srcDestRoute = this.srcDestRoute ? this.srcDestRoute : copyRoute(this.currentRoute);
                return;
            }
            // record move
            this.recordMoveInCurrentRoute();
            // repeat the process
            this.getRouteToHome();
        }
        if(this.reachedHome()) return;
        console.log(this.matrix);
        if(this.canMoveDown()) {
            // make move
            this.moveDown();
            // checked if reached home
            if(this.reachedHome()) {
                // record move
                this.recordMoveInCurrentRoute();
                // assign only if src-destination route does not exists
                this.srcDestRoute = this.srcDestRoute ? this.srcDestRoute : copyRoute(this.currentRoute);
                return;
            }
            // record move
            this.recordMoveInCurrentRoute();
            // repeat the process
            this.getRouteToHome();
        }
        if(this.reachedHome()) return;
        console.log(this.matrix);
        if(this.canMoveLeft()) {
            // make move
            this.moveLeft();
            // checked if reached home
            if(this.reachedHome()) {
                // record move
                this.recordMoveInCurrentRoute();
                // assign only if src-destination route does not exists
                this.srcDestRoute = this.srcDestRoute ? this.srcDestRoute : copyRoute(this.currentRoute);
                return;
            }
            // record move
            this.recordMoveInCurrentRoute();
            // repeat the process
            this.getRouteToHome();
        }
        console.log(this.matrix);
        if(this.reachedHome()) return;
        // stuck somewhere or fuel is empty
        this.retraceOneStepBack();
    }

    this.getHome = () => {
        debugger;
        while(!this.reachedHome()) {
            let madeMove = false;
            // choose a move
            if(this.canMoveUp()) {
                // make a move
                this.moveUp();
                madeMove = true;
            }
            else if(this.canMoveRight()) {
                // make a move
                this.moveRight();
                madeMove = true;

            }
            else if(this.canMoveDown()) {
                // make a move
                this.moveDown();
                madeMove = true;

            }
            else if(this.canMoveLeft()) {
                // make a move
                this.moveLeft();
                madeMove = true;

            }
            else {
                // stuck somewhere or fuel is empty
                this.retraceOneStepBack();
            }

            // record move if made a move
            if(madeMove)
                this.recordMoveInCurrentRoute();
        }
        // assign only if src-destination route does not exists
        this.srcDestRoute = this.srcDestRoute ? this.srcDestRoute : copyRoute(this.currentRoute);
        return;
    }

    this.findPath = () => {
        // find where vehice is
        this.getVehiclePosition();
        // record vehicle's initial position in current route
        this.recordMoveInCurrentRoute();
        // find path to home
        // this.getRouteToHome();
        this.getHome();
        
        // print the route
        console.log(this.srcDestRoute);
         
        return this.srcDestRoute;
    }
}

// design UI
designUI();

// abd
// get Path
let pathFinder = new PathFinder(initialFuel, rows, cols, inputMatrix);
let path =  pathFinder.findPath();

// start Animation
startAnimation();

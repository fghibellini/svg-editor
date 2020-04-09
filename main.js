

const canvas = document.getElementById("canvas");

let isPressed = false;
const points = [];
let current = null;
let handlePointA = null;
let handlePointB = null;
let handleLine = null;

function addPoint(p) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", p.x);
  circle.setAttribute("cy", p.y);
  circle.setAttribute("r", 4);
  circle.setAttribute("fill", "cyan");
  canvas.appendChild(circle);
  return circle;
}

function addLine(p) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", p.x1);
  line.setAttribute("y1", p.y1);
  line.setAttribute("x2", p.x2);
  line.setAttribute("y2", p.y2);
  line.setAttribute("stroke", "black");
  canvas.appendChild(line);
  return line;
}

function bezierFocus(p) {
}

canvas.addEventListener("mouseup", evt => {
  //if (isMouseDown) {
    const { x, y } = evt;
    addPoint({ x, y });
  //}
}, true);

canvas.addEventListener("mousemove", evt => {
  if (isPressed) {
    const { x, y } = evt;
    // handle A
    handlePointA.setAttribute("cx", x);
    handlePointA.setAttribute("cy", y);
    // handleB
    const pB = { x: current.x - (x - current.x), y: current.y - (y - current.y) };
    handlePointB.setAttribute("cx", pB.x);
    handlePointB.setAttribute("cy", pB.y);
    // handle-line
    handleLine.setAttribute("x1", x);
    handleLine.setAttribute("y1", y);
    handleLine.setAttribute("x2", pB.x);
    handleLine.setAttribute("y2", pB.y);
  }
}, true);

canvas.addEventListener("mousedown", evt => {
  isPressed = true;
  const { x, y } = evt;
  addPoint({ x, y });
  current = { x, y };
  handlePointA = addPoint({ x, y });
  handlePointB = addPoint({ x, y });
  handleLine = addLine({ x1: x, y1: y, x2: x, y2: y });
}, true);

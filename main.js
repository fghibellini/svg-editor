

const canvas = document.getElementById("canvas");

let isPressed = false;
const points = [];
const segments = [];
let current = null;
let handlePointA = addPoint({ x: 0, y: 0 });
let handlePointB = addPoint({ x: 0, y: 0 });
let handleLine = addLine({ x1: 0, y1: 0, x2: 0, y2: 0 });
let lastSegment = null;

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

canvas.addEventListener("mouseup", evt => {
  if (isPressed) {
    const { x, y } = evt;
    isPressed = false;
    handleLine.setAttribute("visibility", "hidden");
    handlePointA.setAttribute("visibility", "hidden");
    handlePointB.setAttribute("visibility", "hidden");
    lastSegment = null;
  }
}, true);

canvas.addEventListener("mousemove", evt => {
  if (isPressed) {
    const { x, y } = evt;
    updateHandles({ x, y });
  }
}, true);

function updateHandles({ x, y}) {
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
  if (lastSegment) {
    const prev = points[points.length - 2];
    lastSegment.setAttribute("d", `M ${prev.x} ${prev.y} C ${prev.x} ${prev.y} ${pB.x} ${pB.y} ${current.x} ${current.y}`);
  }
}

canvas.addEventListener("mousedown", evt => {
  isPressed = true;
  handleLine.setAttribute("visibility", "visible");
  handlePointA.setAttribute("visibility", "visible");
  handlePointB.setAttribute("visibility", "visible");
  const { x, y } = evt;
  addPoint({ x, y });
  current = { x, y };
  points.push(current);
  updateHandles({ x, y });
  if (points.length > 1) {
    const prev = points[points.length - 2];
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${prev.x} ${prev.y} L ${x} ${y}`);
    path.setAttribute("stroke", "pink");
    canvas.appendChild(path);
    lastSegment = path;
  }
}, true);


function onResize() {
  const height = window.innerHeight;
  const width = window.innerWidth;
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
  canvas.setAttribute("viewBox", `0 0 ${width} ${height}`);
}

window.addEventListener("resize", evt => {
  onResize();
}, true);


const canvas = document.getElementById("canvas");

let drawingBezier = false;
let isPressed = false;
const points = [];
const segments = [];
let current = null;
let handlePointA = addPoint({ x: 0, y: 0 });
let handlePointB = addPoint({ x: 0, y: 0 });
let handleLine = addLine({ x1: 0, y1: 0, x2: 0, y2: 0 });
let currentPoint = null;
let lastSegment = null;
let clickingPoint = null;

onResize();

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
  if (drawingBezier) {
    if (isPressed) {
      const { x, y } = evt;
      isPressed = false;
      handleLine.setAttribute("visibility", "hidden");
      handlePointA.setAttribute("visibility", "hidden");
      handlePointB.setAttribute("visibility", "hidden");
      lastSegment = null;
      currentPoint.setAttribute("fill", "#ccc");
      currentPoint = null;
      drawingBezier = false;
    } else if (clickingPoint) {
      const t = clickingPoint;
      points.push(t);
      const prev = points[points.length - 2];
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${prev.x} ${prev.y} C ${prev.hx} ${prev.hy} ${t.x} ${t.y} ${t.x} ${t.y}`);
      path.setAttribute("stroke", "pink");
      path.setAttribute("fill", "none");
      canvas.appendChild(path);
      lastSegment = null;
      currentPoint = null;
      drawingBezier = false;
    }
  } else {
    //if (clickingPoint) {

    //}
  }
}, true);

canvas.addEventListener("mousemove", evt => {
  if (isPressed) {
    const { x, y } = evt;
    current.hx = x;
    current.hy = y;
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
    lastSegment.setAttribute("d", `M ${prev.x} ${prev.y} C ${prev.hx} ${prev.hy} ${pB.x} ${pB.y} ${current.x} ${current.y}`);
  }
}

canvas.addEventListener("mousedown", evt => {
  const t = evt.target._Z_point;
  if (t) {
    clickingPoint = t;
  } else {
    isPressed = true;
    drawingBezier = true;
    handleLine.setAttribute("visibility", "visible");
    handlePointA.setAttribute("visibility", "visible");
    handlePointB.setAttribute("visibility", "visible");
    const { x, y } = evt;
    currentPoint = addPoint({ x, y });
    current = { x, y, hx: x, hy: y };
    points.push(current);
    currentPoint._Z_point = current;
    updateHandles({ x, y });
    if (points.length > 1) {
      const prev = points[points.length - 2];
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${prev.x} ${prev.y} L ${x} ${y}`);
      path.setAttribute("stroke", "pink");
      path.setAttribute("fill", "none");
      canvas.appendChild(path);
      lastSegment = path;
    }
  }
}, true);

canvas.addEventListener("mouseover", evt => {
  //currentPoint.setAttribute("fill", "#ff0000");
  console.log("mouseenter");
  console.log(evt.target);
  const point = evt.target._Z_point;
  if (point) {
    evt.target.setAttribute("fill", "#ff0000");
  }
}, true);

canvas.addEventListener("mouseleave", evt => {
  //currentPoint.setAttribute("fill", "#ff0000");
  const point = evt.target._Z_point;
  if (point) {
    evt.target.setAttribute("fill", "#ccc");
  }
}, true);


const canvas = document.getElementById("canvas");
const zIndexHandles = document.createElementNS("http://www.w3.org/2000/svg", "g");
const zIndexLines = document.createElementNS("http://www.w3.org/2000/svg", "g");
canvas.appendChild(zIndexLines);
canvas.appendChild(zIndexHandles);

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

onResize();

// editor state
const objects = [];
let bezierState = {
  drawingBezier: false, // is currently drawing a bezier curve
  isPressed: false, // ?
  points: [],
  handlePointA: addPoint({ x: 0, y: 0 }),
  handlePointB: addPoint({ x: 0, y: 0 }),
  handleLine: addLine({ x1: 0, y1: 0, x2: 0, y2: 0 }),
  clickingPoint: null
};

canvas.addEventListener("mouseup", evt => {
  const { drawingBezier, isPressed, points, clickingPoint } = bezierState;
  if (drawingBezier) {
    if (isPressed) {
      console.log("mouseup is pressed");
      const { x, y } = evt;
      const current = points[points.length - 1];
      bezierState.isPressed = false;
      //current.$hdl_line.setAttribute("visibility", "hidden");
      //current.$rgt_hdl.setAttribute("visibility", "hidden");
      //current.$lft_hdl.setAttribute("visibility", "hidden");
    } else if (clickingPoint && clickingPoint === points[0]) {
      console.log("mouseup clicking point");
      const t = clickingPoint;
      points.push(t);
      const prev = points[points.length - 2];
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${prev.x} ${prev.y} C ${prev.hx} ${prev.hy} ${t.x - (t.hx - t.x)} ${t.y - (t.hy - t.y)} ${t.x} ${t.y}`);
      path.setAttribute("stroke", "pink");
      path.setAttribute("fill", "none");
      zIndexLines.insertAdjacentElement('afterend', path);
      bezierState.drawingBezier = false;
      objects.push({ isClosed: true, points }); // TODO map points
      bezierState.points = [];
    }
  } else {
    if (clickingPoint) {

    }
  }
}, true);

canvas.addEventListener("mousemove", evt => {
  const { x, y } = evt;
  const { isPressed, points, clickingPoint } = bezierState;
  console.log("mousemove");
  if (isPressed) {
    console.log("is pressed");
    const current = points[points.length - 1];
    current.hx = x;
    current.hy = y;
    onHandleChange(current);
  } else if (clickingPoint) {
    console.log("moving point!");
    clickingPoint.x = x;
    clickingPoint.y = y;
    onHandleChange(clickingPoint);
  } else {
    console.log("nothing");
  }
}, true);

function computeHandleB({ x, y, hx, hy }) {
  return { x: x - (hx - x), y: y - (hy - y) }
}

function onHandleChange(p) {
  const { x, y, hx, hy, $hdl_line, $rgt_hdl, $lft_hdl, $lft_seg, prev, next } = p;
  // handle A
  $rgt_hdl.setAttribute("cx", hx);
  $rgt_hdl.setAttribute("cy", hy);
  // handleB
  const pB = { x: x - (hx - x), y: y - (hy - y) };
  $lft_hdl.setAttribute("cx", pB.x);
  $lft_hdl.setAttribute("cy", pB.y);
  // handle-line
  $hdl_line.setAttribute("x1", hx);
  $hdl_line.setAttribute("y1", hy);
  $hdl_line.setAttribute("x2", pB.x);
  $hdl_line.setAttribute("y2", pB.y);
  if ($lft_seg) {
    $lft_seg.setAttribute("d", `M ${prev.x} ${prev.y} C ${prev.hx} ${prev.hy} ${pB.x} ${pB.y} ${x} ${y}`);
  }
  if (next) {
    const npb = computeHandleB(next); // next point B
    next.$lft_seg.setAttribute("d", `M ${x} ${y} C ${hx} ${hy} ${npb.x} ${npb.y} ${next.x} ${next.y}`);
  }
  p.$el.setAttribute("cx", x);
  p.$el.setAttribute("cy", y);
}

canvas.addEventListener("mousedown", evt => {
  const t = evt.target._Z_point;
  if (t) {
    console.log("setting clickingPoint");
    bezierState.clickingPoint = t;
  } else {
    const { x, y } = evt;
    const { drawingBezier, isPressed, points } = bezierState;

    bezierState.drawingBezier = true;
    bezierState.isPressed = true;

    const $lft_hdl = addPoint({ x: 0, y: 0 });
    const $rgt_hdl = addPoint({ x: 0, y: 0 });
    const $hdl_line = addLine({ x1: 0, y1: 0, x2: 0, y2: 0 });
    const $el = addPoint({ x, y });
    const current = { x, y, hx: x, hy: y, $el, $lft_seg: null, $lft_hdl, $rgt_hdl, $hdl_line, prev: points.length > 0 ? points[points.length - 1] : null, next: null }
    $el._Z_point = current;
    if (points.length > 0) {
      points[points.length - 1].next = current;
    }
    points.push(current);

    if (points.length > 1) {
      const prev = points[points.length - 2];
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${prev.x} ${prev.y} L ${x} ${y}`);
      path.setAttribute("stroke", "pink");
      path.setAttribute("fill", "none");
      zIndexLines.insertAdjacentElement('afterend', path);
      current.$lft_seg = path;
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
  console.log("mouseleave");
  const point = evt.target._Z_point;
  if (point) {
    evt.target.setAttribute("fill", "#ccc");
  }
}, true);

function addPoint(p) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", p.x);
  circle.setAttribute("cy", p.y);
  circle.setAttribute("r", 4);
  circle.setAttribute("fill", "cyan");
  zIndexHandles.insertAdjacentElement('afterend', circle);
  return circle;
}

function addLine(p) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", p.x1);
  line.setAttribute("y1", p.y1);
  line.setAttribute("x2", p.x2);
  line.setAttribute("y2", p.y2);
  line.setAttribute("stroke", "black");
  zIndexLines.insertAdjacentElement('afterend', line);
  return line;
}


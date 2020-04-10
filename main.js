
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

const MIN_MOVEMENT = 3;

const HS = {
  Left: "<left>",
  Right: "<right>"
};

// editor state
const objects = [];
let bezierState = {
  drawingBezier: false, // is currently drawing a bezier curve
  isPressed: false, // ?
  points: [],
  handlePointA: addPoint({ x: 0, y: 0 }),
  handlePointB: addPoint({ x: 0, y: 0 }),
  handleLine: addLine({ x1: 0, y1: 0, x2: 0, y2: 0 }),
  clickedPoint: null,
  clickedPointStartingCoords: null,
  clickedPointWasMoved: false,
  clickedHandle: null
};

canvas.addEventListener("mouseup", evt => {
  const { drawingBezier, isPressed, points, clickedPoint, clickedPointWasMoved, clickedHandle } = bezierState;
  if (isPressed) {
    const { x, y } = evt;
    const current = points[points.length - 1];
    bezierState.isPressed = false;
    //current.$hdl_line.setAttribute("visibility", "hidden");
    //current.$rgt_hdl.setAttribute("visibility", "hidden");
    //current.$lft_hdl.setAttribute("visibility", "hidden");
  } else if (clickedHandle) {
    bezierState.clickedHandle = null;
  } else if (clickedPoint && clickedPointWasMoved) {
    bezierState.clickedPoint = null;
  } else if (clickedPoint && clickedPoint === points[0]) {
    const t = clickedPoint;
    const prev = points[points.length - 1];
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${prev.x} ${prev.y} C ${prev.x + prev.hx} ${prev.y + prev.hy} ${t.x - t.hx} ${t.y - t.hy} ${t.x} ${t.y}`);
    path.setAttribute("stroke", "pink");
    path.setAttribute("fill", "none");
    zIndexLines.insertAdjacentElement('afterend', path);
    t.$lft_seg = path;
    t.prev = prev;
    prev.next = t;

    bezierState.drawingBezier = false;
    objects.push({ isClosed: true, points }); // TODO map points
    bezierState.points = [];
    bezierState.clickedPoint = null;
  } else {
    // TODO highlight handles ?
  }
}, true);

function computeDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

canvas.addEventListener("mousemove", evt => {
  const { x, y } = evt;
  const { isPressed, points, clickedPoint, clickedPointWasMoved, clickedPointStartingCoords, clickedHandle } = bezierState;
  if (isPressed) {
    const current = points[points.length - 1];
    current.hx = x - current.x;
    current.hy = y - current.y;
    onHandleChange(current);
  } else if (clickedHandle) {
    const point = clickedHandle.point;
    if (clickedHandle.side == HS.Right) {
      point.hx = x - point.x;
      point.hy = y - point.y;
    } else {
      point.hx = point.x - x;
      point.hy = point.y - y;
    }
    onHandleChange(point);
  } else if (clickedPoint) {
    if (clickedPointWasMoved || computeDistance(evt, clickedPointStartingCoords) > MIN_MOVEMENT) {
      bezierState.clickedPointWasMoved = true;
      clickedPoint.x = x;
      clickedPoint.y = y;
      onHandleChange(clickedPoint);
    }
  } else {
  }
}, true);

function onHandleChange(p) {
  const { x, y, hx, hy, $hdl_line, $rgt_hdl, $lft_hdl, $lft_seg, prev, next } = p;
  // handle A
  $rgt_hdl.setAttribute("cx", x + hx);
  $rgt_hdl.setAttribute("cy", y + hy);
  // handleB
  $lft_hdl.setAttribute("cx", x - hx);
  $lft_hdl.setAttribute("cy", y - hy);
  // handle-line
  $hdl_line.setAttribute("x1", x + hx);
  $hdl_line.setAttribute("y1", y + hy);
  $hdl_line.setAttribute("x2", x - hx);
  $hdl_line.setAttribute("y2", y - hy);
  if ($lft_seg) {
    $lft_seg.setAttribute("d", `M ${prev.x} ${prev.y} C ${prev.x + prev.hx} ${prev.y + prev.hy} ${x - hx} ${y - hy} ${x} ${y}`);
  }
  if (next) {
    next.$lft_seg.setAttribute("d", `M ${x} ${y} C ${x + hx} ${y + hy} ${next.x - next.hx} ${next.y - next.hy} ${next.x} ${next.y}`);
  }
  p.$el.setAttribute("cx", x);
  p.$el.setAttribute("cy", y);
}

canvas.addEventListener("mousedown", evt => {
  const t = evt.target._Z_point;
  const r = evt.target._Z_handle;
  if (t) {
    bezierState.clickedPoint = t;
    bezierState.clickedPointWasMoved = false;
    bezierState.clickedPointStartingCoords = { x: evt.x, y: evt.y };
  } else if (r) {
    bezierState.clickedHandle = r;
  } else {
    const { x, y } = evt;
    const { drawingBezier, isPressed, points } = bezierState;

    bezierState.drawingBezier = true;
    bezierState.isPressed = true;

    const $lft_hdl = addPoint({ x: 0, y: 0 });
    const $rgt_hdl = addPoint({ x: 0, y: 0 });
    const $hdl_line = addLine({ x1: 0, y1: 0, x2: 0, y2: 0 });
    const $el = addPoint({ x, y });
    const current = { x, y, hx: 0, hy: 0, $el, $lft_seg: null, $lft_hdl, $rgt_hdl, $hdl_line, prev: points.length > 0 ? points[points.length - 1] : null, next: null }
    $el._Z_point = current;
    $lft_hdl._Z_handle = { point: current, side: HS.Left };
    $rgt_hdl._Z_handle = { point: current, side: HS.Right };
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


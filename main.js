
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

window.addEventListener("contextmenu", evt => {
  evt.preventDefault();
});

window.addEventListener("keydown", evt => {
  if (evt.key === 'c') {
    closeCurve();
  }
}, true);

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
    closeCurve();
  } else {
    // TODO highlight handles ?
  }
}, true);

function createClosedBezierCurve(points) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke", "none");
  path.setAttribute("fill", "rgba(0,255,0,0.3)");
  zIndexLines.insertAdjacentElement('afterend', path);

  const fp = points[0];
  const lp = points[points.length - 1]; // last point
  const d = [`M ${fp.x} ${fp.y}`].concat(points.slice(0, points.length - 1).map((p, i) => {
    const n = points[i+1];
    return `C ${p.x + p.hx} ${p.y + p.hy} ${n.h2x === null ? n.x - n.hx : n.x + n.h2x} ${n.h2x === null ? n.y - n.hy : n.y + n.h2y} ${n.x} ${n.y}`;
  })).concat([`C ${lp.x + lp.hx} ${lp.y + lp.hy} ${fp.h2x === null ? fp.x - fp.hx : fp.x + fp.h2x} ${fp.h2x === null ? fp.y - fp.hy : fp.y + fp.h2y} ${fp.x} ${fp.y}`]).join(" ");

  path.setAttribute("d", d);
  return path;
}

function bezierToPoints(points) {
  return points.map(({ x, y, hx, hy, h2x, h2y }) => ({ x, y, hx, hy, h2x, h2y }));
}

function closeCurve() {
  const { drawingBezier, isPressed, points, clickedPoint, clickedPointWasMoved, clickedHandle } = bezierState;
  const t = points[0];
  const prev = points[points.length - 1];
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", `M ${prev.x} ${prev.y} C ${prev.x + prev.hx} ${prev.y + prev.hy} ${t.x - t.hx} ${t.y - t.hy} ${t.x} ${t.y}`);
  path.setAttribute("stroke", "pink");
  path.setAttribute("fill", "none");
  zIndexLines.insertAdjacentElement('afterend', path);
  t.$lft_seg = path;
  t.prev = prev;
  prev.next = t;

  const ps = bezierToPoints(points);
  console.log("ps:");
  console.log(ps);
  const singlePath = createClosedBezierCurve(ps);

  bezierState.drawingBezier = false;
  objects.push({ isClosed: true, points: ps, path: singlePath }); // TODO map points
  bezierState.points = [];
  bezierState.clickedPoint = null;
}

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
      if (point.h2x === null) {
        point.hx = point.x - x;
        point.hy = point.y - y;
      } else {
        point.h2x = x - point.x;
        point.h2y = y - point.y;
      }
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
  const { x, y, hx, hy, h2x, h2y, $hdl_line, $rgt_hdl, $lft_hdl, $lft_seg, prev, next } = p;
  // handle A
  $rgt_hdl.setAttribute("cx", x + hx);
  $rgt_hdl.setAttribute("cy", y + hy);
  // handleB
  $lft_hdl.setAttribute("cx", h2x === null ? x - hx : x + h2x);
  $lft_hdl.setAttribute("cy", h2x === null ? y - hy : y + h2y);
  // handle-line
  if (h2x === null) {
    $hdl_line.setAttribute("d", `M ${x - hx} ${y - hy} L ${x + hx} ${y + hy}`);
  } else {
    $hdl_line.setAttribute("d", `M ${x + h2x} ${y + h2y} L ${x} ${y} L ${x + hx} ${y + hy}`);
  }
  if ($lft_seg) {
    $lft_seg.setAttribute("d", `M ${prev.x} ${prev.y} C ${prev.x + prev.hx} ${prev.y + prev.hy} ${h2x === null ? x - hx : x + h2x} ${h2x === null ? y - hy : y + h2y} ${x} ${y}`);
  }
  if (next) {
    next.$lft_seg.setAttribute("d", `M ${x} ${y} C ${x + hx} ${y + hy} ${next.h2x === null ? next.x - next.hx : next.x + next.h2x} ${next.h2y === null ? next.y - next.hy : next.y + next.h2y} ${next.x} ${next.y}`);
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
    const point = r.point;
    if (evt.ctrlKey && point.h2x === null) {
      point.h2x = - point.hx;
      point.h2y = - point.hy;
    }
    bezierState.clickedHandle = r;
  } else {
    const { x, y } = evt;
    const { drawingBezier, isPressed, points } = bezierState;

    bezierState.drawingBezier = true;
    bezierState.isPressed = true;

    const $lft_hdl = addPoint({ x: 0, y: 0 });
    const $rgt_hdl = addPoint({ x: 0, y: 0 });
    const $hdl_line = addLine({ x1: 0, y1: 0, x2: 0, y2: 0 }); // TODO initial position
    const $el = addPoint({ x, y });
    const current = { x, y, hx: 0, hy: 0, h2x: null, h2y: null, $el, $lft_seg: null, $lft_hdl, $rgt_hdl, $hdl_line, prev: points.length > 0 ? points[points.length - 1] : null, next: null }
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
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", `M ${p.x1} ${p.y1} l ${p.x2} ${p.y2}`);
  line.setAttribute("stroke", "black");
  line.setAttribute("fill", "none");
  zIndexLines.insertAdjacentElement('afterend', line);
  return line;
}


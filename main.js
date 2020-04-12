
const canvas = document.getElementById("canvas");
const zIndexHandles = document.createElementNS("http://www.w3.org/2000/svg", "g");
const zIndexHandleLines = document.createElementNS("http://www.w3.org/2000/svg", "g");
const zIndexLines = document.createElementNS("http://www.w3.org/2000/svg", "g");
canvas.appendChild(zIndexLines);
canvas.appendChild(zIndexHandleLines);
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
  } else if (evt.key === 'h') {
    showAllHandles(bezierState);
  } else if (evt.key === 'a' && !bezierState.drawingBezier) {
    bezierState.isAddingPoint = true;
    bezierState.$newPoint = addPoint({ x: 0, y: 0 });
  } else if (evt.key === 'Esc' || evt.key === 'Escape') {
    unselectBezier();
  }
}, true);

const MIN_MOVEMENT = 3;
const HIT_PROXIMITY = 5;

const HS = {
  Left: "<left>",
  Right: "<right>"
};

// editor state
const objects = [];
let clickedObject = null;
let bezierState = {
  drawingBezier: true, // is currently drawing a bezier curve
  isPressed: false, // ?
  points: [],
  isClosed: false,
  $path: null,
  clickedPoint: null,
  clickedPointStartingCoords: null,
  clickedPointWasMoved: false,
  clickedHandle: null,
  isAddingPoint: false,
  $newPoint: null
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
  } else if (clickedObject) {
    bezierState = clickedObject;
    showAllHandles(bezierState);
    clickedObject = null;
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

function unselectBezier() {
  hideAllHandles(bezierState);
  bezierState = {
    drawingBezier: false, // is currently drawing a bezier curve
    isPressed: false, // ?
    points: [],
    isClosed: false,
    $path: null,
    clickedPoint: null,
    clickedPointStartingCoords: null,
    clickedPointWasMoved: false,
    clickedHandle: null,
    isAddingPoint: false,
    $newPoint: null
  };
}

function minimum(xs) {
  return xs.reduce((a, b) => Math.min(a, b));
}

function projectOnBezier(points, t) {
  const ps = points.map(p => {
    const n = p.next;
    const curve = new Bezier(p.x, p.y, p.x + p.hx, p.y + p.hy, n.h2x === null ? n.x - n.hx : n.x + n.h2x, n.h2x === null ? n.y - n.hy : n.y + n.h2y, n.x, n.y);
    const projection = curve.project(t);
    return { segment: p, projection, distance: computeDistance(t, projection) };
  });
  return ps.reduce((a, b) => {
    return a.distance < b.distance ? a : b;
  });
}

function distanceFromBezier(points, t) {
  const distances = points.map(p => {
    const n = p.next;
    const curve = new Bezier(p.x, p.y, p.x + p.hx, p.y + p.hy, n.h2x === null ? n.x - n.hx : n.x + n.h2x, n.h2x === null ? n.y - n.hy : n.y + n.h2y, n.x, n.y);
    const projection = curve.project(t);
    return computeDistance(t, projection);
  });
  return minimum(distances);
}

function computeBezierPath(closed, points) {
  const fp = points[0];
  const lp = points[points.length - 1]; // last point
  return [`M ${fp.x} ${fp.y}`].concat(points.slice(0, points.length - 1).map((p, i) => {
    const n = points[i+1];
    return `C ${p.x + p.hx} ${p.y + p.hy} ${n.h2x === null ? n.x - n.hx : n.x + n.h2x} ${n.h2x === null ? n.y - n.hy : n.y + n.h2y} ${n.x} ${n.y}`;
  })).concat(closed ? [`C ${lp.x + lp.hx} ${lp.y + lp.hy} ${fp.h2x === null ? fp.x - fp.hx : fp.x + fp.h2x} ${fp.h2x === null ? fp.y - fp.hy : fp.y + fp.h2y} ${fp.x} ${fp.y}`] : []).join(" ");
}


// function createClosedBezierCurve(points) {
//   const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
//   path.setAttribute("stroke", "none");
//   path.setAttribute("fill", "rgba(0,255,0,0.3)");
//   zIndexLines.insertAdjacentElement('afterend', path);
// 
//   const d = computeBezierPath(true, points);
//   path.setAttribute("d", d);
//   return path;
// }

// function bezierToPoints(parent, points) {
//   return points.map(({ x, y, hx, hy, h2x, h2y }) => ({ x, y, hx, hy, h2x, h2y, parent }));
// }

function closeCurve() {
  const { drawingBezier, isPressed, points, clickedPoint, clickedPointWasMoved, clickedHandle, $path } = bezierState;
  const t = points[0];
  const prev = points[points.length - 1];
  // const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  // path.setAttribute("d", `M ${prev.x} ${prev.y} C ${prev.x + prev.hx} ${prev.y + prev.hy} ${t.x - t.hx} ${t.y - t.hy} ${t.x} ${t.y}`);
  // path.setAttribute("stroke", "pink");
  // path.setAttribute("fill", "none");
  // zIndexHandleLines.insertAdjacentElement('afterend', path);
  t.prev = prev;
  prev.next = t;

  objects.push(bezierState); // TODO map points
  bezierState.isClosed = true;

  refreshBezierPath(bezierState);

  bezierState.drawingBezier = false;
  showAllHandles(bezierState);
  //bezierState = {
  //  drawingBezier: false, // is currently drawing a bezier curve
  //  isPressed: false, // ?
  //  points: [],
  //  isClosed: false,
  //  $path: null,
  //  clickedPoint: null,
  //  clickedPointStartingCoords: null,
  //  clickedPointWasMoved: false,
  //  clickedHandle: null
  //};
}

function computeDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

canvas.addEventListener("mousemove", evt => {
  const { x, y } = evt;
  const { isPressed, points, clickedPoint, clickedPointWasMoved, clickedPointStartingCoords, clickedHandle, isAddingPoint } = bezierState;
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
  } else if (isAddingPoint) {
    const p = bezierState.$newPoint;
    const pr = projectOnBezier(bezierState.points, { x, y });
    p.setAttribute("cx", pr.projection.x);
    p.setAttribute("cy", pr.projection.y);
    p.setAttribute("fill", "red");
  } else {
  }
}, true);

function onHandleChange(p) {
  const { x, y, hx, hy, h2x, h2y, $hdl_line, $rgt_hdl, $lft_hdl, prev, next } = p;
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
  //if ($lft_seg) {
  //  $lft_seg.setAttribute("d", `M ${prev.x} ${prev.y} C ${prev.x + prev.hx} ${prev.y + prev.hy} ${h2x === null ? x - hx : x + h2x} ${h2x === null ? y - hy : y + h2y} ${x} ${y}`);
  //}
  //if (next) {
  //  next.$lft_seg.setAttribute("d", `M ${x} ${y} C ${x + hx} ${y + hy} ${next.h2x === null ? next.x - next.hx : next.x + next.h2x} ${next.h2y === null ? next.y - next.hy : next.y + next.h2y} ${next.x} ${next.y}`);
  //}
  refreshBezierPath(p.parent);
  p.$el.setAttribute("cx", x);
  p.$el.setAttribute("cy", y);
}

function refreshBezierPath({ isClosed, points, $path }) {
  if ($path) {
    const d = computeBezierPath(isClosed, points);
    $path.setAttribute("d", d);
  }
}

function hideHandles(point) {
  point.$lft_hdl.setAttribute("visibility", "hidden");
  point.$rgt_hdl.setAttribute("visibility", "hidden");
  point.$el.setAttribute("visibility", "hidden");
  point.$hdl_line.setAttribute("visibility", "hidden");
}

function hideAllHandles(parent) {
  parent.points.forEach(point => {
    point.$lft_hdl.setAttribute("visibility", "hidden");
    point.$rgt_hdl.setAttribute("visibility", "hidden");
    point.$el.setAttribute("visibility", "hidden");
    point.$hdl_line.setAttribute("visibility", "hidden");
  });
}

function showAllHandles(parent) {
  parent.points.forEach(point => {
    point.$lft_hdl.setAttribute("visibility", "visible");
    point.$rgt_hdl.setAttribute("visibility", "visible");
    point.$el.setAttribute("visibility", "visible");
    point.$hdl_line.setAttribute("visibility", "visible");
  });
}

function vecDiff(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

canvas.addEventListener("mousedown", evt => {
  const t = evt.target._Z_point;
  const r = evt.target._Z_handle;
  // const s = evt.target._Z_path;

  const _clickedObject = objects.length < 1 ? null :
    (function() {
      const distances = objects.map(o => ({ obj: o, d: distanceFromBezier(o.points, { x: evt.x, y: evt.y }) }));
      const closest = distances.reduce((a, b) => {
        return a.d < b.d ? a : b;
      });
      return closest.d < HIT_PROXIMITY ? closest.obj : null;
    })();

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
  } else if (bezierState.isAddingPoint) {
    const pr = projectOnBezier(bezierState.points, { x: evt.x, y: evt.y });
    const curve = (function() {
      const p = pr.segment;
      const n = p.next;
      return new Bezier(p.x, p.y, p.x + p.hx, p.y + p.hy, n.h2x === null ? n.x - n.hx : n.x + n.h2x, n.h2x === null ? n.y - n.hy : n.y + n.h2y, n.x, n.y);
    })();
    const split = curve.split(pr.projection.t);

    // new point
    const { x, y } = split.right.points[0];
    const { x: hx, y: hy } = vecDiff(split.right.points[1], { x, y });
    const { x: h2x, y: h2y } = vecDiff(split.left.points[2], { x, y });
    const { x: prev_hx, y: prev_hy } = vecDiff(split.left.points[1], pr.segment);
    const { x: next_h2x, y: next_h2y } = vecDiff(split.right.points[2], pr.segment.next);
    const $lft_hdl = addPoint({ x: x + h2x, y: y + h2y });
    const $rgt_hdl = addPoint({ x: x + hx, y: y + hy });
    const $hdl_line = addLine({ x1: x + h2x, y1: y + h2y, x2: x + hx, y2: y + hy });
    $hdl_line.setAttribute("d", `M ${x + h2x} ${y + h2y} L ${x} ${y} L ${x + hx} ${y + hy}`);
    const $el = addPoint({ x, y });
    $el.setAttribute("r", 4);
    $el.setAttribute("fill", "blue");
    const new_point = { x, y, hx, hy, h2x, h2y, $el, $lft_hdl, $rgt_hdl, $hdl_line, prev: pr.segment, next: pr.segment.next, parent: pr.segment.parent };
    new_point.prev.next = new_point;
    new_point.next.prev = new_point;

    if (new_point.prev.h2x === null) {
      // split the handles on prev
      new_point.prev.h2x = - new_point.prev.hx;
      new_point.prev.h2y = - new_point.prev.hy;
    }
    // update prev handles
    new_point.prev.hx = prev_hx;
    new_point.prev.hy = prev_hy;

    new_point.next.h2x = next_h2x;
    new_point.next.h2y = next_h2y;

    onHandleChange(new_point.prev);
    onHandleChange(new_point.next);

    const i = new_point.parent.points.findIndex(x => x === pr.segment);
    new_point.parent.points.splice(i + 1, 0, new_point);
    refreshBezierPath(new_point.parent);

    // $el._Z_point = current;
    // $lft_hdl._Z_handle = { point: current, side: HS.Left };
    // $rgt_hdl._Z_handle = { point: current, side: HS.Right };

    // pr.segment

    // TODO remove
    const p = bezierState.$newPoint;
    p.setAttribute("cx", -100);
    p.setAttribute("cy", -100);
  } else if (_clickedObject) {
    clickedObject = _clickedObject;
  } else if (bezierState.drawingBezier) {
    const { x, y } = evt;
    const { drawingBezier, isPressed, points } = bezierState;

    bezierState.isPressed = true;

    const $lft_hdl = addPoint({ x: 0, y: 0 });
    const $rgt_hdl = addPoint({ x: 0, y: 0 });
    const $hdl_line = addLine({ x1: 0, y1: 0, x2: 0, y2: 0 }); // TODO initial position
    const $el = addPoint({ x, y });
    $el.setAttribute("r", 4);
    const current = { x, y, hx: 0, hy: 0, h2x: null, h2y: null, $el, $lft_hdl, $rgt_hdl, $hdl_line, prev: points.length > 0 ? points[points.length - 1] : null, next: null, parent: bezierState }
    $el._Z_point = current;
    $lft_hdl._Z_handle = { point: current, side: HS.Left };
    $rgt_hdl._Z_handle = { point: current, side: HS.Right };
    if (points.length > 0) {
      const prev = points[points.length - 1];
      prev.next = current;
      hideHandles(prev);
    }
    points.push(current);

    if (points.length === 2) {
      const prev = points[0];
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${prev.x} ${prev.y} L ${x} ${y}`);
      path.setAttribute("stroke", "pink");
      path.setAttribute("fill", "none");
      zIndexLines.insertAdjacentElement('afterend', path);
      path._Z_path = bezierState;
      bezierState.$path = path;
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
    evt.target.setAttribute("fill", "#333");
  }
}, true);

function addPoint(p) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", p.x);
  circle.setAttribute("cy", p.y);
  circle.setAttribute("r", 3);
  circle.setAttribute("fill", "#333");
  zIndexHandles.insertAdjacentElement('afterend', circle);
  return circle;
}

function addLine(p) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", `M ${p.x1} ${p.y1} l ${p.x2} ${p.y2}`);
  line.setAttribute("stroke", "#333");
  line.setAttribute("fill", "none");
  zIndexHandleLines.insertAdjacentElement('afterend', line);
  return line;
}


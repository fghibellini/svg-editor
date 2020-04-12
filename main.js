
/*
 * CONFIG VARIABLES
 */
const MIN_MOVEMENT = 3;
const HIT_PROXIMITY = 5;

// Handle Side
const HS = {
  Left: Symbol("<left>"),
  Right: Symbol("<right>")
};

const canvas = document.getElementById("canvas");

/*
 * These elements are used to be able to add new nodes at specific positions of
 * the SVG tree.
 */
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

// editor state
const objects = [];
let clickedObject = null;
let bezierState = emptyBezierState();

(function init() {
  onResize();
  bezierState.drawingBezier = true;
})();

canvas.addEventListener("mouseup", evt => {
  const { isPressed, points, clickedPoint, clickedPointWasMoved, clickedHandle } = bezierState;
  if (isPressed) {
    const current = points[points.length - 1];
    bezierState.isPressed = false;
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

function emptyBezierState() {
  return {
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
  }
}

function unselectBezier() {
  hideAllHandles(bezierState);
  bezierState = emptyBezierState();
}

/*
 * Every point on a bezier curve has 2 handles.
 * The "right" handle, i.e. the one pointing towards the `.next` node
 * is always described by the relative coordinates [hx, hy].
 * The "left" handle can have one of 3 possible representations.
 *
 * 1. symmetric handle - h2x = null, h2y = null
 *    -------------------------------------------------
 *    In this case the handle is the mirror immage of the "right" handle.
 *    i.e. [-hx, -hy]
 *
 * 2. parallel handle - h2x != null, h2y = null
 *    -----------------------------------------
 *    The handle has the opposite direction of the "right" handle but `h2x`
 *    encodes the absolute length of it. i.e. [-hx*h2x,-hy*h2x]
 *
 * 3. separate handles - h2x != null, h2y != null
 *    -------------------------------------------
 *    The two handles bear no relationship.
 *    The [h2x, h2y] are the relative coordinates of the left handle.
 */
function handlePoints(p) {
  const { x, y, hx, hy, h2x, h2y } = p;
  if (h2y === null) {
    if (h2x === null) {
      return { right: { x: x + hx, y: y + hy }, left: { x: x - hx, y: y - hy } };
    } else {
      return { right: { x: x + hx, y: y + hy }, left: { x: x - hx * h2x, y: y - hy * h2x } };
    }
  } else {
    return { right: { x: x + hx, y: y + hy }, left: { x: x + h2x, y: y + h2y } };
  }
}

function projectOnBezier(points, t) {
  const ps = points.map(p => {
    const n = p.next;
    const ph = handlePoints(p);
    const nh = handlePoints(n);
    const curve = new Bezier(p, ph.right, nh.left, n);
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
    const ph = handlePoints(p);
    const nh = handlePoints(n);
    const curve = new Bezier(p, ph.right, nh.left, n);
    const projection = curve.project(t);
    return computeDistance(t, projection);
  });
  return minimum(distances);
}

function svgBezierPath(closed, points) {
  const fp = points[0]; // first point
  const lp = points[points.length - 1]; // last point
  const fph = handlePoints(fp); // first point handles
  const lph = handlePoints(lp); // last point handles
  return (
    [`M ${fp.x} ${fp.y}`]
    .concat(points.slice(0, points.length - 1).map((p, i) => {
      const n = points[i+1]; // next
      const ph = handlePoints(p); // ... handles
      const nh = handlePoints(n); // ... handles
      return `C ${ph.right.x} ${ph.right.y} ${nh.left.x} ${nh.left.y} ${n.x} ${n.y}`;
    }))
    .concat(closed ? [`C ${lph.right.x} ${lph.right.y} ${fph.left.x} ${fph.left.y} ${fp.x} ${fp.y}`] : [])
    .join(" ")
  );
}

function closeCurve() {
  const { isPressed, points, clickedPoint, clickedPointWasMoved, clickedHandle, $path } = bezierState;
  // close loop
  const fp = points[0]; // first point
  const lp = points[points.length - 1]; // last point
  fp.prev = lp;
  lp.next = fp;
  // create object
  bezierState.isClosed = true;
  bezierState.drawingBezier = false;
  objects.push(bezierState); // TODO map points
  // update view
  refreshBezierPath(bezierState);
  showAllHandles(bezierState);
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
  const { x, y, h2y, $hdl_line, $rgt_hdl, $lft_hdl, prev, next } = p;
  const { left, right } = handlePoints(p);
  // point
  p.$el.setAttribute("cx", x);
  p.$el.setAttribute("cy", y);
  // handle right
  $rgt_hdl.setAttribute("cx", right.x);
  $rgt_hdl.setAttribute("cy", right.y);
  // handle left
  $lft_hdl.setAttribute("cx", left.x);
  $lft_hdl.setAttribute("cy", left.y);
  // handle-line(s)
  $hdl_line.setAttribute("d",
    h2y === null
      ? `M ${right.x} ${right.y} L ${left.x} ${left.y}`
      : `M ${right.x} ${right.y} L ${x} ${y} L ${left.x} ${left.y}`
  );
  // TODO separate
  refreshBezierPath(p.parent);
}

function refreshBezierPath({ isClosed, points, $path }) {
  if ($path) { // null when fewer than 2 points
    const d = svgBezierPath(isClosed, points);
    $path.setAttribute("d", d);
  }
}

function setHandleVisible(isVisible, point) {
  const visibility = isVisible ? "visible": "hidden";
  point.$lft_hdl.setAttribute("visibility", visibility);
  point.$rgt_hdl.setAttribute("visibility", visibility);
  point.$el.setAttribute("visibility", visibility);
  point.$hdl_line.setAttribute("visibility", visibility);
}

function hideAllHandles(parent) {
  parent.points.forEach(point => setHandleVisible(false, point));
}

function showAllHandles(parent) {
  parent.points.forEach(point => setHandleVisible(true, point));
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

    // TODO remove
    const p = bezierState.$newPoint;
    p.setAttribute("cx", -100);
    p.setAttribute("cy", -100);
  } else if (_clickedObject) {
    clickedObject = _clickedObject;
  } else if (bezierState.drawingBezier) {
    const { x, y } = evt;
    const { isPressed, points } = bezierState;

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
      setHandleVisible(false, prev);
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


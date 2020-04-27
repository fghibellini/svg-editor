
/*
 * CONFIG VARIABLES
 */
const MIN_MOVEMENT = 3;
const HIT_PROXIMITY = 5;
const SQ_HDL_HW = 3; // SQUARE_HANDLE_HALF_WIDTH

// Object Type
const ObjectType = {
  Ellipse: Symbol("<EllipseObject>"),
  Bezier: Symbol("<BezierObject>")
};

// Tools
const Tools = {
  Elipse: Symbol("<ElipseTool>"),
  Bezier: Symbol("<BezierTool>")
};

// Handle Side
const HS = {
  Left: Symbol("<LeftHandle>"),
  Right: Symbol("<RightHandle>")
};

// Selection Box Handle
const SBH = {
  TL: Symbol("<TopLeft>"),
  TR: Symbol("<TopRight>"),
  BL: Symbol("<BottomLeft>"),
  BR: Symbol("<BottomRight>"),
  T: Symbol("<Top>"),
  L: Symbol("<Left>"),
  R: Symbol("<Right>"),
  B: Symbol("<Bottom>")
};

const MODE = {
  Objekt: Symbol("<ObjectMode>"),
  Edit: Symbol("<EditMode>")
};

const canvas = document.getElementById("canvas");

/*
 * These elements are used to be able to add new nodes at specific positions of
 * the SVG tree.
 */
const zIndexHandles = document.createElementNS("http://www.w3.org/2000/svg", "g");
const zIndexHandleLines = document.createElementNS("http://www.w3.org/2000/svg", "g");
const zIndexLines = document.createElementNS("http://www.w3.org/2000/svg", "g");

function appendZIndexHandles() {
  canvas.appendChild(zIndexLines);
  canvas.appendChild(zIndexHandleLines);
  canvas.appendChild(zIndexHandles);
}

function onResize() {
  const height = window.innerHeight;
  const width = window.innerWidth;
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
  canvas.setAttribute("viewBox", `0 0 ${width} ${height}`);
  refreshStatusBox();
}

window.addEventListener("resize", evt => {
  onResize();
}, true);

window.addEventListener("contextmenu", evt => {
  evt.preventDefault();
});

window.addEventListener("keydown", keyDown, true);

function keyDown(evt) {
  if (evt.key === 'c') {
    closeCurve();
  } else if (evt.key === 'h') {
    showAllHandles(bezierState);
  } else if (evt.key === 'a' && !bezierState.drawingBezier) {
    bezierState.isAddingPoint = true;
    bezierState.$newPoint = addPoint({ x: 0, y: 0 });
  } else if (evt.key === 'Esc' || evt.key === 'Escape') {
    unselectBezier();
  } else if (evt.key === 'Tab') {
    evt.preventDefault();
    evt.stopPropagation();
    if (mode === MODE.Objekt) {
      switchToEditMode();
      // refreshStatusBox();
    } else {
      switchToObjektMode();
      // refreshStatusBox();
    }
  }
}

// editor state
const objects = [];
let selectedTool = Tools.Bezier;
let mode = MODE.Objekt;
let clickedObject = null;
let activeObject = null;
let bezierState = emptyBezierState();
let elipseState = emptyElipseState();
let objectMode = {
  selectionBox: null,
  $g: null,
  initialState: null, // set while switching to object mode
  mouseDownState: null, // set on mousedown
  currentState: null // set on mousemove
};

function resetAllState() {
  objects.splice(0, objects.length);
  selectedTool = Tools.Bezier;
  mode = MODE.Objekt;
  clickedObject = null;
  activeObject = null;
  bezierState = emptyBezierState();
  elipseState = emptyElipseState();
  objectMode = {
    selectionBox: null,
    $g: null,
    initialState: null, // set while switching to object mode
    mouseDownState: null, // set on mousedown
    currentState: null // set on mousemove
  };
  canvas.innerHTML = '';
  init();
}

let $statusBox = newInfoBox();

function refreshStatusBox() {
  $statusBox.innerHTML = mode === MODE.Objekt ? "[Object]" : "[Edit]";
  const bbox = $statusBox.getBoundingClientRect();
  $statusBox.setAttribute("x", document.body.clientWidth - bbox.width - 10);
  $statusBox.setAttribute("y", 20);
}

function init() {
  appendZIndexHandles();
  onResize();
  bezierState.drawingBezier = true;
}

init();

// hacky
setInterval(() => {
  refreshStatusBox();
}, 50);

function distanceFromObject(point, object) {
  if (object.type === ObjectType.Bezier) {
    return distanceFromBezier(object.points, point);
  } else if (object.type === ObjectType.Ellipse) {
    return distanceFromEllipse(object, point);
  } else {
    throw Error("Unexpected ObjectType");
  }
}

canvas.addEventListener("mousedown", mouseDown, true);
canvas.addEventListener("mousemove", mouseMove, true);
canvas.addEventListener("mouseup", mouseUp, true);

function mouseDown(evt) {
  const t = evt.target._Z_point;
  const r = evt.target._Z_handle;
  const v = evt.target._Z_selectionBoxFrame;
  const s = evt.target._Z_selectionBoxHandle;
  // const s = evt.target._Z_path;

  const _clickedObject = objects.length < 1 ? null :
    (function() {
      const distances = objects.map(o => ({ obj: o, d: distanceFromObject(evt, o) }));
      const closest = distances.reduce((a, b) => {
        return a.d < b.d ? a : b;
      });
      console.log(`closest object (${closest.d}):`);
      //console.log(closest.obj);
      return closest.d < HIT_PROXIMITY ? closest.obj : null;
    })();

  if (t) {
    bezierState.clickedPoint = t;
    bezierState.clickedPointWasMoved = false;
    bezierState.clickedPointStartingCoords = { x: evt.x, y: evt.y };
  } else if (v) {
    objectMode.mouseDownState = {
      x: evt.x,
      y: evt.y,
      sbh: null
    };
  } else if (s) {
    objectMode.mouseDownState = {
      x: evt.x,
      y: evt.y,
      sbh: s.sbh
    };
  } else if (r) {
    const point = r.point;
    if (evt.ctrlKey && point.h2x === null) {
      point.h2x = - point.hx;
      point.h2y = - point.hy;
    }
    bezierState.clickedHandle = r;
  } else if (selectedTool === Tools.Elipse) {
    elipseState.$element = newEllipse();
    elipseState.center = { x: evt.x, y: evt.y };
    elipseState.$element.setAttribute("cx", elipseState.center.x);
    elipseState.$element.setAttribute("cy", elipseState.center.y);
    elipseState.$element.setAttribute("rx", 0);
    elipseState.$element.setAttribute("ry", 0);
    elipseState.isPressed = true;
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
}

function mouseMove(evt) {
  const { x, y } = evt;
  const { isPressed, points, clickedPoint, clickedPointWasMoved, clickedPointStartingCoords, clickedHandle, isAddingPoint } = bezierState;
  if (selectedTool === Tools.Elipse && elipseState.isPressed) {
    elipseState.isCircle = evt.shiftKey;
    if (elipseState.isCircle) {
      const r = computeDistance(evt, elipseState.center);
      elipseState.$element.setAttribute("rx", r);
      elipseState.$element.setAttribute("ry", r);
    } else {
      const d = vecDiff(evt, elipseState.center);
      elipseState.$element.setAttribute("rx", abs(d.x));
      elipseState.$element.setAttribute("ry", abs(d.y));
    }
  } else if (isPressed) {
    const current = points[points.length - 1];
    current.hx = x - current.x;
    current.hy = y - current.y;
    onHandleChange(current);
  } else if (objectMode.mouseDownState && objectMode.mouseDownState.sbh === null) {
    // ----
    // MOVE
    // ----
    const delta = vecDiff(evt, objectMode.mouseDownState);
    // const evtTL = coordsToTopLeft(objectMode.mouseDownState.sbh, evt, objectMode.initialState);
    // const initTL = coordsToTopLeft(objectMode.mouseDownState.sbh, objectMode.mouseDownState, objectMode.initialState);
    const tl = vecAdd(objectMode.initialState, delta);
    const br = vecAdd(tl, { x: objectMode.initialState.width, y: objectMode.initialState.height });
    objectMode.$g.setAttribute("transform", `translate(${delta.x}, ${delta.y})`);
    selectionBoxSetPosition(objectMode.selectionBox, tl, br);
  } else if (objectMode.mouseDownState && objectMode.mouseDownState.sbh !== null) {
    // ------
    // RESIZE
    // ------
    const delta = vecDiff(evt, objectMode.mouseDownState);
    const tld = { // top-left delta
      x: isLeftEdge(objectMode.mouseDownState.sbh) ? delta.x : 0,
      y: isTopEdge(objectMode.mouseDownState.sbh) ? delta.y : 0
    };
    const tl = vecAdd(objectMode.initialState, tld);
    // const evtTL = coordsToTopLeft(objectMode.mouseDownState.sbh, evt, objectMode.initialState);
    // const initTL = coordsToTopLeft(objectMode.mouseDownState.sbh, objectMode.mouseDownState, objectMode.initialState);
    const newDimensions = {
      x: objectMode.initialState.width +
          (isRightEdge(objectMode.mouseDownState.sbh) ? delta.x :
           isLeftEdge(objectMode.mouseDownState.sbh) ? (- delta.x) :
           0),
      y: objectMode.initialState.height +
          (isBottomEdge(objectMode.mouseDownState.sbh) ? delta.y :
           isTopEdge(objectMode.mouseDownState.sbh) ? (- delta.y) :
           0)
    };
    const mat = multiplyMatrices(
      translateMat(-objectMode.initialState.x, -objectMode.initialState.y),
      scaleMat(newDimensions.x / objectMode.initialState.width, newDimensions.y / objectMode.initialState.height)
    );
    if (false) {
      // bezier
      const points_ = transformBezierPoints(
        bezierState.points,
        objectMode.initialState,
        {
          x: newDimensions.x / objectMode.initialState.width,
          y: newDimensions.y / objectMode.initialState.height
        },
        tld
      );
      activeObject.points_ = points_; // save for mouseup
      refreshBezierPath({
        isClosed: true,
        points: points_,
        $path: bezierState.$path
      });
    } else {
      // ellipse
      //activeObject.center = { x: };
      const hs = horizontalSignum(objectMode.mouseDownState.sbh);
      const vs = verticalSignum(objectMode.mouseDownState.sbh);
      console.log(objectMode.mouseDownState.sbh);
      console.log(`vs: ${vs}`);
      console.log(`hs: ${hs}`);
      console.log(`delta: ${JSON.stringify(delta)}`);
      activeObject.$element.setAttribute("cx", activeObject.center.x + abs(hs) * delta.x / 2);
      activeObject.$element.setAttribute("cy", activeObject.center.y + abs(vs) * delta.y / 2);
      activeObject.$element.setAttribute("rx", activeObject.rx + hs * delta.x / 2);
      activeObject.$element.setAttribute("ry", activeObject.ry + vs * delta.y / 2);
    }
    // 1. move to origin
    // 2. resize
    // 3. move back into position
    // 4. apply translation
   // objectMode.$g.setAttribute("transform", [
   //   `matrix(${mat[0]} ${mat[3]} ${mat[1]} ${mat[4]} ${mat[2]} ${mat[5]})`
   //   // `scale(${newDimensions.x / objectMode.initialState.width} ${newDimensions.y / objectMode.initialState.height})`
   //   // `translate(${objectMode.initialState.x}, ${objectMode.initialState.y})`,
   //   // `translate(${tld.x}, ${tld.y})`
   // ].join(" "));
    const br = vecAdd(tl, newDimensions);
    selectionBoxSetPosition(objectMode.selectionBox, tl, br);
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
}

function mouseUp(evt) {
  const { isPressed, points, clickedPoint, clickedPointWasMoved, clickedHandle } = bezierState;
  if (selectedTool === Tools.Elipse && elipseState.isPressed) {
    selectedTool = 42;
    elipseState.isCircle = evt.shiftKey;
    if (elipseState.isCircle) {
      const r = computeDistance(evt, elipseState.center);
      elipseState.rx = r;
      elipseState.ry = r;
    } else {
      const d = vecDiff(evt, elipseState.center);
      elipseState.rx = abs(d.x);
      elipseState.ry = abs(d.y);
    }
    elipseState.$element.setAttribute("rx", elipseState.rx);
    elipseState.$element.setAttribute("ry", elipseState.ry);

    elipseState.isPressed = false;
    objects.push(elipseState);
    elipseState = emptyElipseState();
  } else if (isPressed) {
    const current = points[points.length - 1];
    bezierState.isPressed = false;
  } else if (objectMode.mouseDownState) {
    if (objectMode.mouseDownState.sbh !== null) { // RESIZE
      const delta = vecDiff(evt, objectMode.mouseDownState);
      if (activeObject.points_) {
        // apply the transformation
        activeObject.points_.forEach((p, i) => {
          const o = bezierState.points[i];
          Object.assign(o, p); // assign new coords while maintaining the references to SVG nodes
        });
        bezierState.points.forEach(onHandleChange);
        activeObject.points_ = null;
      } else {
        // ellipse
        console.log("ELLIPSE!!!!");
        const hs = horizontalSignum(objectMode.mouseDownState.sbh);
        const vs = verticalSignum(objectMode.mouseDownState.sbh);
        activeObject.center = {
          x: activeObject.center.x + abs(hs) * delta.x / 2,
          y: activeObject.center.y + abs(vs) * delta.y / 2
        };
        activeObject.rx = activeObject.rx + hs * delta.x / 2; 
        activeObject.ry = activeObject.ry + vs * delta.y / 2; 

        objectMode.initialState.x = activeObject.center.x - activeObject.rx;
        objectMode.initialState.y = activeObject.center.y - activeObject.ry;
        objectMode.initialState.width = 2 * activeObject.rx;
        objectMode.initialState.height = 2 * activeObject.ry;
      }
    } else { // MOVE
      const delta = vecDiff(evt, objectMode.mouseDownState);

      // 1. apply transformation to object
      activeObject.center = vecAdd(activeObject.center, delta);
      activeObject.$element.setAttribute("cx", activeObject.center.x);
      activeObject.$element.setAttribute("cy", activeObject.center.y);
      // 2. reset g transformation
      objectMode.$g.removeAttribute("transform");
      // 3. update transformation accumulator
      objectMode.initialState.x += delta.x;
      objectMode.initialState.y += delta.y;
    }
    objectMode.mouseDownState = null;
  } else if (clickedObject) {
    activeObject = clickedObject;
    clickedObject = null;
    if (mode === MODE.Objekt) {
      switchToObjektMode();
    } else {
      showAllHandles(bezierState);
    }
  } else if (clickedHandle) {
    bezierState.clickedHandle = null;
  } else if (clickedPoint && clickedPointWasMoved) {
    bezierState.clickedPoint = null;
  } else if (clickedPoint && clickedPoint === points[0]) {
    closeCurve();
  } else {
    // TODO highlight handles ?
  }
}

function switchToObjektMode() {

  //cleanup
  //{ TODO
  //  hideAllHandles(bezierState);
  //}

  mode = MODE.Objekt;

  objectMode.selectionBox = newSelectionBox();
  const bbox = objectBoundingBox(activeObject);
  selectionBoxSetPosition(objectMode.selectionBox, { x: bbox.x.min, y: bbox.y.min }, { x: bbox.x.max, y: bbox.y.max });
  objectMode.initialState = {
    x: bbox.x.min,
    y: bbox.y.min,
    width: bbox.x.max - bbox.x.min,
    height: bbox.y.max - bbox.y.min
  };

  objectMode.$g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  objectMode.$g.setAttribute("class", "transform-wrapper");
  zIndexHandleLines.insertAdjacentElement('afterend', objectMode.$g);
  objectMode.$g.appendChild(objectSVGElement(activeObject));
}

function switchToEditMode() {
  mode = MODE.Edit;

  destroySelectionBox(objectMode.selectionBox);
  objectMode.selectionBox = null;

  showAllHandles(bezierState);
}

function emptyElipseState() {
  return {
    type: ObjectType.Ellipse,
    isPressed: false,
    center: null,
    isCircle: false,
    rx: 0,
    ry: 0,
    $element: null

    //clickedPoint: null,
    //clickedPointStartingCoords: null,
    //clickedPointWasMoved: false,
    //clickedHandle: null,
  }
}

function emptyBezierState() {
  return {
    type: ObjectType.Bezier,
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
    $newPoint: null,
    // cached values during transformations
    points_: null
  }
}

function unselectBezier() {
  hideAllHandles(bezierState);
  bezierState = emptyBezierState();
  if (objectMode.selectionBox) {
    destroySelectionBox(objectMode.selectionBox);
    objectMode.selectionBox = null;
  }
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

function objectSVGElement(object) {
  if (object.type === ObjectType.Bezier) {
    return object.$path;
  } else if (object.type === ObjectType.Ellipse) {
    return object.$element;
  } else {
    throw Error("Unexpected ObjectType");
  }
}

function objectBoundingBox(object) {
  if (object.type === ObjectType.Bezier) {
    return bezierBoundingBox(object.points);
  } else if (object.type === ObjectType.Ellipse) {
    return ellipseBoundingBox(object);
  } else {
    throw Error("Unexpected ObjectType");
  }
}

function ellipseBoundingBox({ center, rx, ry }) {
  return {
    x: {
      min: center.x - rx,
      max: center.x + rx
    },
    y: {
      min: center.y - ry,
      max: center.y + ry
    }
  };
}

function bezierBoundingBox(points) {
  const ps = points.map(p => {
    const n = p.next;
    const ph = handlePoints(p);
    const nh = handlePoints(n);
    const curve = new Bezier(p, ph.right, nh.left, n);
    return curve.bbox();
  });
  return ps.reduce((a, b) => {
    return {
      x: {
        min: Math.min(a.x.min, b.x.min),
        max: Math.max(a.x.max, b.x.max),
      },
      y: {
        min: Math.min(a.y.min, b.y.min),
        max: Math.max(a.y.max, b.y.max),
      }
    }
  })
}

function parametricEllipse(object, t) {
  return { x: object.rx * cos(t), y: object.ry * sin(t) }
}

// This does not return the actual euclidian distance of the point from the ellipse.
// Instead it returns how many pixels bigger the ellipse would have to be in order
// for the point to be a part of it.
// (number of pixels on the x axis as we actually compute the scaling factor and apply it to rx)
function distanceFromEllipse(object, point) {
  const { x, y } = vecDiff(point, object.center);
  const d2 =  ((x * x) / (object.rx * object.rx)) + ((y * y) / (object.ry * object.ry));
  return sqrt(object.rx * object.rx * d2) - object.rx;
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

function transformBezierPoints(points, origin, scale, move) {
  const mat = composeMatrices([
    translateMat(-origin.x, -origin.y),
    scaleMat(scale.x, scale.y),
    translateMat(origin.x, origin.y),
    translateMat(move.x, move.y)
  ]);
  return points.map(p => {
    const { x, y } = transform(p, mat);
    const hx = p.hx * scale.x;
    const hy = p.hy * scale.y;
    const h2x = p.h2x === null ? null : p.h2x * scale.x; // TODO third case
    const h2y = p.h2y === null ? null : p.h2y * scale.y;
    return { x, y, hx, hy, h2x, h2y };
  });
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

function selectionBoxSetPosition(rect, tl, br) {
  rect.$main.setAttribute("x", tl.x);
  rect.$main.setAttribute("y", tl.y);
  rect.$main.setAttribute("width", br.x - tl.x);
  rect.$main.setAttribute("height", br.y - tl.y);

  selectionBoxPointSetPosition(rect.$tl, tl);
  selectionBoxPointSetPosition(rect.$tr, { x: br.x, y: tl.y });
  selectionBoxPointSetPosition(rect.$bl, { x: tl.x, y: br.y });
  selectionBoxPointSetPosition(rect.$br, br);
  selectionBoxPointSetPosition(rect.$t, { x: (tl.x + br.x) / 2, y: tl.y });
  selectionBoxPointSetPosition(rect.$b, { x: (tl.x + br.x) / 2, y: br.y });
  selectionBoxPointSetPosition(rect.$l, { x: tl.x, y: (tl.y + br.y) / 2 });
  selectionBoxPointSetPosition(rect.$r, { x: br.x, y: (tl.y + br.y) / 2 });
}

function destroySelectionBox(box) {
  box.$main.remove();
  box.$tl.remove();
  box.$tr.remove();
  box.$bl.remove();
  box.$br.remove();
  box.$t.remove();
  box.$b.remove();
  box.$l.remove();
  box.$r.remove();
}

function newSelectionBox() {
  const $main = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  $main.setAttribute("stroke", "blue");
  $main.setAttribute("fill", "none");
  zIndexHandleLines.insertAdjacentElement('afterend', $main);
  $main._Z_selectionBoxFrame = {};

  const $tl = newSelectionBoxPoint(SBH.TL);
  const $tr = newSelectionBoxPoint(SBH.TR);
  const $bl = newSelectionBoxPoint(SBH.BL);
  const $br = newSelectionBoxPoint(SBH.BR);
  const $t = newSelectionBoxPoint(SBH.T);
  const $b = newSelectionBoxPoint(SBH.B);
  const $l = newSelectionBoxPoint(SBH.L);
  const $r = newSelectionBoxPoint(SBH.R);


  return { $main, $tl, $tr, $bl, $br, $t, $b, $l, $r };
}

function selectionBoxPointSetPosition(point, pos) {
  point.setAttribute("x", pos.x - SQ_HDL_HW);
  point.setAttribute("y", pos.y - SQ_HDL_HW);
}

function coordsToTopLeft(sbh, point, { width, height }) {
  return {
    x: (sbh === SBH.TL || sbh === SBH.BL) ? point.x : point.x - width,
    y: (sbh === SBH.TL || sbh === SBH.TR) ? point.y : point.y - height
  };
}

function isLeftEdge(sbh) {
  return (
       sbh === SBH.TL
    || sbh === SBH.L
    || sbh === SBH.BL);
}

function isRightEdge(sbh) {
  return (
       sbh === SBH.TR
    || sbh === SBH.R
    || sbh === SBH.BR);
}

function isTopEdge(sbh) {
  return (
       sbh === SBH.TL
    || sbh === SBH.T
    || sbh === SBH.TR);
}

function isBottomEdge(sbh) {
  return (
       sbh === SBH.BL
    || sbh === SBH.B
    || sbh === SBH.BR);
}

function verticalSignum(sbh) {
  return isTopEdge(sbh) ? -1 : isBottomEdge(sbh) ? 1 : 0;
}

function horizontalSignum(sbh) {
  return isLeftEdge(sbh) ? -1 : isRightEdge(sbh) ? 1 : 0;
}

function newSelectionBoxPoint(sbh) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", SQ_HDL_HW * 2);
  rect.setAttribute("height", SQ_HDL_HW * 2);
  rect.setAttribute("stroke", "none");
  rect.setAttribute("fill", "blue");
  zIndexHandleLines.insertAdjacentElement('afterend', rect);
  rect._Z_selectionBoxHandle = {
    sbh
  };
  return rect;
}

function newInfoBox() {
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  zIndexHandleLines.insertAdjacentElement('afterend', text);
  return text;
}

function newEllipse() {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  el.setAttribute("stroke", "black");
  el.setAttribute("fill", "none");
  zIndexHandleLines.insertAdjacentElement('afterend', el);
  el._Z_ellipse = {};
  return el;
}


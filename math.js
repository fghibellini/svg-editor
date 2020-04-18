
function minimum(xs) {
  return xs.reduce((a, b) => Math.min(a, b));
}

function vecDiff(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function vecAdd(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function translateMat(x, y) {
  return [
    1, 0, x,
    0, 1, y,
    0, 0, 1
  ];
}

function scaleMat(ax, ay) {
  return [
    ax, 0, 0,
    0, ay, 0,
    0, 0, 1
  ];
}

function transform(p, mat) {
  return {
    x: p.x * mat[0] + p.y * mat[1] + mat[2],
    y: p.x * mat[3] + p.y * mat[4] + mat[5]
  };
}

//function applyOnlyScaling(p, mat) {
//  return {
//    x: p.x * mat[0] + p.y * mat[1],
//    y: p.x * mat[3] + p.y * mat[4]
//  };
//}

function composeMatrices(ms) {
  return ms.reduce(multiplyMatrices);
}

function multiplyMatrices(ae, be) {
  var a11 = ae[ 0 ], a12 = ae[ 3 ], a13 = ae[ 6 ];
  var a21 = ae[ 1 ], a22 = ae[ 4 ], a23 = ae[ 7 ];
  var a31 = ae[ 2 ], a32 = ae[ 5 ], a33 = ae[ 8 ];

  var b11 = be[ 0 ], b12 = be[ 3 ], b13 = be[ 6 ];
  var b21 = be[ 1 ], b22 = be[ 4 ], b23 = be[ 7 ];
  var b31 = be[ 2 ], b32 = be[ 5 ], b33 = be[ 8 ];

  return [
    a11 * b11 + a12 * b21 + a13 * b31,
    a21 * b11 + a22 * b21 + a23 * b31,
    a31 * b11 + a32 * b21 + a33 * b31,
    a11 * b12 + a12 * b22 + a13 * b32,
    a21 * b12 + a22 * b22 + a23 * b32,
    a31 * b12 + a32 * b22 + a33 * b32,
    a11 * b13 + a12 * b23 + a13 * b33,
    a21 * b13 + a22 * b23 + a23 * b33,
    a31 * b13 + a32 * b23 + a33 * b33
  ];
}

function computeDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}


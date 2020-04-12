
function minimum(xs) {
  return xs.reduce((a, b) => Math.min(a, b));
}

function vecDiff(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}


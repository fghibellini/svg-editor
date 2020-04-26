
let assert = chai.assert;

describe("blabla", () => {

  beforeEach(() => { resetAllState(); })
  //after(() => { resetAllState(); })

  it("initial state", () => {
    assert.lengthOf(objects, 0);
  })

  it("should draw ellipse", () => {
    mouseDown({ target: {}, x: 100, y: 100 });
    mouseMove({ target: {}, x: 200, y: 150 });
    mouseUp({ target: {}, x: 200, y: 150 });
    assert.lengthOf(objects, 1);
    assert.equal(objects[0].rx, 100);
    assert.equal(objects[0].ry, 50);
  })

  it("should draw a circle", () => {
    mouseDown({ target: {}, x: 100, y: 100 });
    mouseMove({ target: {}, x: 200, y: 100 });
    mouseUp({ target: {}, x: 200, y: 100, shiftKey: true });
    assert.lengthOf(objects, 1);
    assert.isTrue(objects[0].isCircle);
    assert.equal(objects[0].rx, 100);
    assert.equal(objects[0].ry, 100);
  })

  it("should move an ellipse", () => {
    // create ellipse
    // center: [300, 200]
    // top-left corner: [250, 180]
    mouseDown({ target: {}, x: 300, y: 200 });
    mouseMove({ target: {}, x: 350, y: 220 });
    mouseUp({ target: {}, x: 350, y: 220 });
    // simulate click on object
    activeObject = objects[0];
    switchToObjektMode();
    const svgEllipse = activeObject.$element;
    const svgG = objectMode.$g;
    // drag box by frame 50 to right
    const frameSVGElement = objectMode.selectionBox.$main;
    mouseDown({ target: frameSVGElement, x: 250, y: 190 });
    // mouse move
    mouseMove({ target: {}, x: 300, y: 190 });
    assert.equal(svgEllipse.getAttribute("cx"), 300);
    assert.equal(svgG.getAttribute("transform"), `translate(50, 0)`);
    // mouse up
    mouseUp({ target: {}, x: 300, y: 190 });
    assert.equal(svgEllipse.getAttribute("cx"), 350);
    assert.equal(svgG.getAttribute("transform"), `translate(0, 0)`);
    //assert.equal(objectMode.initialState.x, 350); // the top-left corner of the bounding box has moved to [300, 180]
    //assert.equal(objectMode.initialState.y, 180); // the top-left corner of the bounding box has moved to [300, 180]
    //// second drag 50 to right
    //mouseDown({ target: frameSVGElement, x: 300, y: 190 });
    //mouseMove({ target: {}, x: 350, y: 190 });
    //mouseUp({ target: {}, x: 350, y: 190 });
    // asserts
  })

})

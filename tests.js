
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

  it("basic object mode", () => {
    // create ellipse
    mouseDown({ target: {}, x: 100, y: 100 });
    mouseMove({ target: {}, x: 200, y: 150 });
    mouseUp({ target: {}, x: 200, y: 150 });
    // simulate click on object
    activeObject = objects[0];
    switchToObjektMode();
    // drag box
    const frameSVGElement = objectMode.selectionBox.$main;
    mouseDown({ target: frameSVGElement, x: 100, y: 120 });
    mouseMove({ target: {}, x: 230, y: 120 });
    mouseUp({ target: {}, x: 230, y: 120 });
    // second drag
    mouseDown({ target: frameSVGElement, x: 230, y: 120 });
    mouseMove({ target: {}, x: 300, y: 120 });
    mouseUp({ target: {}, x: 300, y: 120 });
  })

})

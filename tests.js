
let assert = chai.assert;

describe("basic tests", () => {

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
    assert.equal(frameSVGElement.getAttribute("x"), 300);
    assert.equal(svgEllipse.getAttribute("cx"), 300);
    assert.equal(svgG.getAttribute("transform"), `translate(50, 0)`);
    // mouse up
    mouseUp({ target: {}, x: 300, y: 190 });
    assert.equal(frameSVGElement.getAttribute("x"), 300);
    assert.equal(svgEllipse.getAttribute("cx"), 350);
    assert.equal(svgG.getAttribute("transform"), null);
    //assert.equal(objectMode.initialState.x, 350); // the top-left corner of the bounding box has moved to [300, 180]
    //assert.equal(objectMode.initialState.y, 180); // the top-left corner of the bounding box has moved to [300, 180]
    //// second drag 50 to right
    //mouseDown({ target: frameSVGElement, x: 300, y: 190 });
    //mouseMove({ target: {}, x: 350, y: 190 });
    //mouseUp({ target: {}, x: 350, y: 190 });
    // asserts
  })

  it("ellipse movements withing a single object mode should compose", () => {
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
    mouseMove({ target: {}, x: 300, y: 190 });
    mouseUp({ target: {}, x: 300, y: 190 });
    //// second drag 50 to right
    mouseDown({ target: frameSVGElement, x: 300, y: 190 });
    mouseMove({ target: {}, x: 350, y: 190 });
    mouseUp({ target: {}, x: 350, y: 190 });
    // asserts
    assert.equal(frameSVGElement.getAttribute("x"), 350);
    assert.equal(svgEllipse.getAttribute("cx"), 400);
    assert.equal(svgG.getAttribute("transform"), null);
  })

  it("should resize an ellipse (bottom-right handle, increase)", () => {
    // create ellipse
    // center: [300, 200]
    // top-left corner: [250, 180]
    // bottom-right corner: [350, 220]
    mouseDown({ target: {}, x: 300, y: 200 });
    mouseMove({ target: {}, x: 350, y: 220 });
    mouseUp({ target: {}, x: 350, y: 220 });
    // simulate click on object
    activeObject = objects[0];
    switchToObjektMode();
    const svgEllipse = activeObject.$element;
    const svgG = objectMode.$g;
    // drag box by bottom-right handle (50,50)
    const brHandleSvg = objectMode.selectionBox.$br;
    mouseDown({ target: brHandleSvg, x: 250, y: 190 });
    // mouse move
    mouseMove({ target: {}, x: 300, y: 240 });
    assert.equal(brHandleSvg.getAttribute("x"), 400 - SQ_HDL_HW);
    assert.equal(brHandleSvg.getAttribute("y"), 270 - SQ_HDL_HW);
    assert.equal(svgG.getAttribute("transform"), null);
    assert.equal(svgEllipse.getAttribute("cx"), 325);
    // mouse up
    mouseUp({ target: {}, x: 300, y: 240 });
    assert.equal(brHandleSvg.getAttribute("x"), 400 - SQ_HDL_HW);
    assert.equal(brHandleSvg.getAttribute("y"), 270 - SQ_HDL_HW);
    assert.equal(svgG.getAttribute("transform"), null);
    assert.equal(svgEllipse.getAttribute("cx"), 325);
    assert.equal(svgEllipse.getAttribute("cy"), 225);
    assert.equal(svgEllipse.getAttribute("rx"), 75);
    assert.equal(svgEllipse.getAttribute("ry"), 45);
    //assert.equal(frameSVGElement.getAttribute("x"), 300);
    //assert.equal(svgEllipse.getAttribute("cx"), 350);
    //assert.equal(svgG.getAttribute("transform"), `translate(0, 0)`);
    //assert.equal(objectMode.initialState.x, 350); // the top-left corner of the bounding box has moved to [300, 180]
    //assert.equal(objectMode.initialState.y, 180); // the top-left corner of the bounding box has moved to [300, 180]
    //// second drag 50 to right
    //mouseDown({ target: frameSVGElement, x: 300, y: 190 });
    //mouseMove({ target: {}, x: 350, y: 190 });
    //mouseUp({ target: {}, x: 350, y: 190 });
    // asserts
  })

  it("should resize an ellipse (top-right handle, increase)", () => {
    // create ellipse
    // center: [300, 200]
    // top-left corner: [250, 180]
    // bottom-right corner: [350, 220]
    mouseDown({ target: {}, x: 300, y: 200 });
    mouseMove({ target: {}, x: 350, y: 220 });
    mouseUp({ target: {}, x: 350, y: 220 });
    // simulate click on object
    activeObject = objects[0];
    switchToObjektMode();
    const svgEllipse = activeObject.$element;
    const svgG = objectMode.$g;
    // drag box by top-right handle (50,-50)
    const trHandleSvg = objectMode.selectionBox.$tr;
    mouseDown({ target: trHandleSvg, x: 250, y: 190 });
    // mouse move
    mouseMove({ target: {}, x: 300, y: 140 });
    assert.equal(trHandleSvg.getAttribute("x"), 400 - SQ_HDL_HW);
    assert.equal(trHandleSvg.getAttribute("y"), 130 - SQ_HDL_HW);
    assert.equal(svgG.getAttribute("transform"), null);
    assert.equal(svgEllipse.getAttribute("cy"), 175);
    // mouse up
    mouseUp({ target: {}, x: 300, y: 140 });
    assert.equal(trHandleSvg.getAttribute("x"), 400 - SQ_HDL_HW);
    assert.equal(trHandleSvg.getAttribute("y"), 130 - SQ_HDL_HW);
    assert.equal(svgG.getAttribute("transform"), null);
    assert.equal(svgEllipse.getAttribute("cx"), 325);
    assert.equal(svgEllipse.getAttribute("cy"), 175);
    assert.equal(svgEllipse.getAttribute("rx"), 75);
    assert.equal(svgEllipse.getAttribute("ry"), 45);

    //assert.equal(frameSVGElement.getAttribute("x"), 300);
    //assert.equal(svgEllipse.getAttribute("cx"), 350);
    //assert.equal(svgG.getAttribute("transform"), `translate(0, 0)`);
    //assert.equal(objectMode.initialState.x, 350); // the top-left corner of the bounding box has moved to [300, 180]
    //assert.equal(objectMode.initialState.y, 180); // the top-left corner of the bounding box has moved to [300, 180]
    //// second drag 50 to right
    //mouseDown({ target: frameSVGElement, x: 300, y: 190 });
    //mouseMove({ target: {}, x: 350, y: 190 });
    //mouseUp({ target: {}, x: 350, y: 190 });
    // asserts
  })

  it("should resize an ellipse (top-left handle, increase)", () => {
    // create ellipse
    // center: [300, 200]
    // top-left corner: [250, 180]
    // bottom-right corner: [350, 220]
    mouseDown({ target: {}, x: 300, y: 200 });
    mouseMove({ target: {}, x: 350, y: 220 });
    mouseUp({ target: {}, x: 350, y: 220 });
    // simulate click on object
    activeObject = objects[0];
    switchToObjektMode();
    const svgEllipse = activeObject.$element;
    const svgG = objectMode.$g;
    // drag box by top-right handle (-50,-50)
    const tlHandleSvg = objectMode.selectionBox.$tl;
    mouseDown({ target: tlHandleSvg, x: 250, y: 190 });
    // mouse move
    mouseMove({ target: {}, x: 200, y: 140 });
    assert.equal(tlHandleSvg.getAttribute("x"), 200 - SQ_HDL_HW);
    assert.equal(tlHandleSvg.getAttribute("y"), 130 - SQ_HDL_HW);
    assert.equal(svgG.getAttribute("transform"), null);
    assert.equal(svgEllipse.getAttribute("cy"), 175);
    // mouse up
    mouseUp({ target: {}, x: 200, y: 140 });
    assert.equal(tlHandleSvg.getAttribute("x"), 200 - SQ_HDL_HW);
    assert.equal(tlHandleSvg.getAttribute("y"), 130 - SQ_HDL_HW);
    assert.equal(svgG.getAttribute("transform"), null);
    assert.equal(svgEllipse.getAttribute("cx"), 275);
    assert.equal(svgEllipse.getAttribute("cy"), 175);
    assert.equal(svgEllipse.getAttribute("rx"), 75);
    assert.equal(svgEllipse.getAttribute("ry"), 45);

    //assert.equal(frameSVGElement.getAttribute("x"), 300);
    //assert.equal(svgEllipse.getAttribute("cx"), 350);
    //assert.equal(svgG.getAttribute("transform"), `translate(0, 0)`);
    //assert.equal(objectMode.initialState.x, 350); // the top-left corner of the bounding box has moved to [300, 180]
    //assert.equal(objectMode.initialState.y, 180); // the top-left corner of the bounding box has moved to [300, 180]
    //// second drag 50 to right
    //mouseDown({ target: frameSVGElement, x: 300, y: 190 });
    //mouseMove({ target: {}, x: 350, y: 190 });
    //mouseUp({ target: {}, x: 350, y: 190 });
    // asserts
  })

  it("should resize an ellipse (left handle, increase)", () => {
    // create ellipse
    // center: [300, 200]
    // top-left corner: [250, 180]
    // bottom-right corner: [350, 220]
    mouseDown({ target: {}, x: 300, y: 200 });
    mouseMove({ target: {}, x: 350, y: 220 });
    mouseUp({ target: {}, x: 350, y: 220 });
    // simulate click on object
    activeObject = objects[0];
    switchToObjektMode();
    const svgEllipse = activeObject.$element;
    const svgG = objectMode.$g;
    // drag box by left handle (-50,-50)
    const lHandleSvg = objectMode.selectionBox.$l;
    mouseDown({ target: lHandleSvg, x: 250, y: 190 });
    // mouse move
    mouseMove({ target: {}, x: 200, y: 140 });
    assert.equal(lHandleSvg.getAttribute("x"), 200 - SQ_HDL_HW);
    assert.equal(lHandleSvg.getAttribute("y"), 200 - SQ_HDL_HW);
    assert.equal(svgG.getAttribute("transform"), null);
    assert.equal(svgEllipse.getAttribute("cx"), 275);
    assert.equal(svgEllipse.getAttribute("cy"), 200);
    assert.equal(svgEllipse.getAttribute("rx"), 75);
    assert.equal(svgEllipse.getAttribute("ry"), 20);
    // mouse up
    mouseUp({ target: {}, x: 200, y: 140 });
    assert.equal(lHandleSvg.getAttribute("x"), 200 - SQ_HDL_HW);
    assert.equal(lHandleSvg.getAttribute("y"), 200 - SQ_HDL_HW);
    assert.equal(svgG.getAttribute("transform"), null);
    assert.equal(svgEllipse.getAttribute("cx"), 275);
    assert.equal(svgEllipse.getAttribute("cy"), 200);
    assert.equal(svgEllipse.getAttribute("rx"), 75);
    assert.equal(svgEllipse.getAttribute("ry"), 20);

    //assert.equal(frameSVGElement.getAttribute("x"), 300);
    //assert.equal(svgEllipse.getAttribute("cx"), 350);
    //assert.equal(svgG.getAttribute("transform"), `translate(0, 0)`);
    //assert.equal(objectMode.initialState.x, 350); // the top-left corner of the bounding box has moved to [300, 180]
    //assert.equal(objectMode.initialState.y, 180); // the top-left corner of the bounding box has moved to [300, 180]
    //// second drag 50 to right
    //mouseDown({ target: frameSVGElement, x: 300, y: 190 });
    //mouseMove({ target: {}, x: 350, y: 190 });
    //mouseUp({ target: {}, x: 350, y: 190 });
    // asserts
  })

  it("consecutive resizes should compose", () => {
    // create ellipse
    // center: [300, 200]
    // top-left corner: [250, 180]
    // bottom-right corner: [350, 220]
    mouseDown({ target: {}, x: 300, y: 200 });
    mouseMove({ target: {}, x: 350, y: 220 });
    mouseUp({ target: {}, x: 350, y: 220 });
    // simulate click on object
    activeObject = objects[0];
    switchToObjektMode();
    const svgEllipse = activeObject.$element;
    const svgG = objectMode.$g;

    const lHandleSvg = objectMode.selectionBox.$l;

    // drag box by left handle (-50,-50)
    mouseDown({ target: lHandleSvg, x: 250, y: 190 });
    // mouse move
    mouseMove({ target: {}, x: 200, y: 140 });
    // mouse up
    mouseUp({ target: {}, x: 200, y: 140 });

    // drag box by left handle (-50,-50)
    mouseDown({ target: lHandleSvg, x: 200, y: 140 });
    // mouse move
    mouseMove({ target: {}, x: 150, y: 90 });
    // mouse up
    mouseUp({ target: {}, x: 150, y: 90 });

    assert.equal(lHandleSvg.getAttribute("x"), 150 - SQ_HDL_HW);
    assert.equal(lHandleSvg.getAttribute("y"), 200 - SQ_HDL_HW);
    assert.equal(svgG.getAttribute("transform"), null);
    assert.equal(svgEllipse.getAttribute("cx"), 250);
    assert.equal(svgEllipse.getAttribute("cy"), 200);
    assert.equal(svgEllipse.getAttribute("rx"), 100);
    assert.equal(svgEllipse.getAttribute("ry"), 20);

    //assert.equal(frameSVGElement.getAttribute("x"), 300);
    //assert.equal(svgEllipse.getAttribute("cx"), 350);
    //assert.equal(svgG.getAttribute("transform"), `translate(0, 0)`);
    //assert.equal(objectMode.initialState.x, 350); // the top-left corner of the bounding box has moved to [300, 180]
    //assert.equal(objectMode.initialState.y, 180); // the top-left corner of the bounding box has moved to [300, 180]
    //// second drag 50 to right
    //mouseDown({ target: frameSVGElement, x: 300, y: 190 });
    //mouseMove({ target: {}, x: 350, y: 190 });
    //mouseUp({ target: {}, x: 350, y: 190 });
    // asserts
  })

})

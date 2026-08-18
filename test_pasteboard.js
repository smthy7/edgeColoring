const { FarbschnittMath } = require('./src/FarbschnittCore.js');
const assert = require('assert');

console.log("=== Testing Farbschnitt v2.6 bounds and paperThickness ===");

var pageWidth = 400;
var pageHeight = 600;
var bleed = 8.5;
var stripDepth = 8.5;
var paperThickness = 0.28;

var slice0 = FarbschnittMath.calculateSlice({
    pageIndex: 0,
    pageCount: 100,
    paperThickness: paperThickness,
    stripDepth: stripDepth,
    bleed: bleed,
    pageWidth: pageWidth,
    pageHeight: pageHeight,
    isVerso: false,
    edge: 'foreEdge'
});

assert(slice0.frameBounds !== undefined, "Frame bounds must be defined");
assert(Math.abs(slice0.totalBookThickness - 28) < 0.001, "Total book thickness must be calculated using paperThickness");

console.log("All Bounds and PaperThickness Tests Passed Successfully!");

const { FarbschnittMath } = require('./src/FarbschnittCore.js');
const assert = require('assert');

console.log("=== Testing Farbschnitt v3.0 bounds ===");

var pageWidth = 400;
var pageHeight = 600;
var bleed = 8.5;
var stripDepth = 8.5;

var slice0 = FarbschnittMath.calculateSlice({
    stripDepth: stripDepth,
    bleed: bleed,
    pageWidth: pageWidth,
    pageHeight: pageHeight,
    isVerso: false,
    edge: 'foreEdge'
});

assert(slice0.frameBounds !== undefined, "Frame bounds must be defined");
assert.strictEqual(slice0.rotation, 0, "Fore edge rotation is 0");

var sliceTop = FarbschnittMath.calculateSlice({
    stripDepth: stripDepth,
    bleed: bleed,
    pageWidth: pageWidth,
    pageHeight: pageHeight,
    isVerso: false,
    edge: 'topEdge'
});

assert.strictEqual(sliceTop.rotation, 90, "Top edge rotation is 90");

var sliceBottom = FarbschnittMath.calculateSlice({
    stripDepth: stripDepth,
    bleed: bleed,
    pageWidth: pageWidth,
    pageHeight: pageHeight,
    isVerso: false,
    edge: 'bottomEdge'
});

assert.strictEqual(sliceBottom.rotation, 270, "Bottom edge rotation is 270");

console.log("All Bounds and Rotation Tests Passed Successfully!");

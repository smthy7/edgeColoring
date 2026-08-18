const { FarbschnittMath } = require('./src/FarbschnittCore.js');
const assert = require('assert');

console.log("=== Testing Core Math & Spine Clamping Logic ===");

var pageWidth = 400;
var pageHeight = 600;
var bleed = 8.5; // ~3mm
var stripDepth = 8.5;

// Test 1: Top Edge on Verso (Left page). Spine is at X = pageWidth (400).
var topVerso = FarbschnittMath.calculateSlice({
    pageIndex: 1,
    pageCount: 100,
    paperThickness: 0.28,
    stripDepth: stripDepth,
    bleed: bleed,
    pageWidth: pageWidth,
    pageHeight: pageHeight,
    isVerso: true,
    edge: 'topEdge'
});

assert.strictEqual(topVerso.frameBounds[1], -bleed, "Verso top edge left should extend into left bleed");
assert.strictEqual(topVerso.frameBounds[3], pageWidth, "Verso top edge right MUST NOT cross spine (pageWidth)");
assert.strictEqual(topVerso.rotation, 90, "Top edge image rotation should be 90 degrees");

// Test 2: Top Edge on Recto (Right page). Spine is at X = 0.
var topRecto = FarbschnittMath.calculateSlice({
    pageIndex: 2,
    pageCount: 100,
    paperThickness: 0.28,
    stripDepth: stripDepth,
    bleed: bleed,
    pageWidth: pageWidth,
    pageHeight: pageHeight,
    isVerso: false,
    edge: 'topEdge'
});

assert.strictEqual(topRecto.frameBounds[1], 0, "Recto top edge left MUST NOT cross spine (X = 0)");
assert.strictEqual(topRecto.frameBounds[3], pageWidth + bleed, "Recto top edge right should extend into right bleed");

// Test 3: Test strip reference mode
var testStripVerso = FarbschnittMath.calculateSlice({
    pageIndex: 5,
    pageCount: 100,
    paperThickness: 0.28,
    stripDepth: stripDepth,
    bleed: bleed,
    pageWidth: pageWidth,
    pageHeight: pageHeight,
    isVerso: true,
    edge: 'foreEdge',
    generateTestStrip: true
});

assert(testStripVerso.testFrameBounds !== null, "Test strip bounds should be generated when requested");
assert(testStripVerso.testFrameBounds[3] < -bleed, "Test strip for Verso should be placed to the left of the page bleed");

console.log("All Core & Spine Clamping Math Tests Passed Successfully!");

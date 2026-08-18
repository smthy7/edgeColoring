const { FarbschnittMath } = require('./src/FarbschnittCore.js');
const assert = require('assert');

console.log("Running Core Math Tests...");

// Test 1: Fore-edge on Right page (Recto)
const rectoResult = FarbschnittMath.calculateSlice({
    pageIndex: 0,
    pageCount: 100,
    paperThickness: 0.1,
    stripDepth: 3,
    bleed: 3,
    pageWidth: 140,
    pageHeight: 200,
    isVerso: false,
    edge: 'foreEdge'
});

assert.deepStrictEqual(rectoResult.frameBounds, [-3, 137, 203, 143], "Recto frame bounds incorrect");
assert.deepStrictEqual(rectoResult.graphicBounds, [-3, 137, 203, 737], "Recto graphic bounds incorrect");

// Test 2: Fore-edge on Left page (Verso)
const versoResult = FarbschnittMath.calculateSlice({
    pageIndex: 0,
    pageCount: 100,
    paperThickness: 0.1,
    stripDepth: 3,
    bleed: 3,
    pageWidth: 140,
    pageHeight: 200,
    isVerso: true,
    edge: 'foreEdge'
});

assert.deepStrictEqual(versoResult.frameBounds, [-3, -3, 203, 3], "Verso frame bounds incorrect");
assert.deepStrictEqual(versoResult.graphicBounds, [-3, -3, 203, 597], "Verso graphic bounds incorrect");

// Test 3: Top-edge
const topResult = FarbschnittMath.calculateSlice({
    pageIndex: 10,
    pageCount: 100,
    paperThickness: 0.1,
    stripDepth: 3,
    bleed: 3,
    pageWidth: 140,
    pageHeight: 200,
    isVerso: false,
    edge: 'topEdge'
});

assert.deepStrictEqual(topResult.frameBounds, [-3, -3, 3, 143], "Top edge frame bounds incorrect");

console.log("All Core Math Tests Passed Successfully!");

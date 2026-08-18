const { FarbschnittMath } = require('./src/FarbschnittCore.js');
const assert = require('assert');

console.log("=== Comprehensive Automated Test Suite for Farbschnitt.jsx (v2.0) ===");

function createMockDoc(pageCount, pageWidthPt, pageHeightPt) {
    var pages = [];
    for (var i = 0; i < pageCount; i++) {
        var isVerso = (i % 2 === 1); // 0 = Recto (right), 1 = Verso (left)
        pages.push({
            index: i,
            isVerso: isVerso,
            bounds: [0, 0, pageHeightPt, pageWidthPt]
        });
    }
    return {
        pages: pages,
        width: pageWidthPt,
        height: pageHeightPt
    };
}

var doc = createMockDoc(100, 400, 600);
var paperThicknessPt = FarbschnittMath.mmToPt(0.1);
var stripDepthPt = FarbschnittMath.mmToPt(3.0);
var bleedPt = FarbschnittMath.mmToPt(3.0);

// Test 1: Fore-edge
console.log("\n[Test 1] Testing Fore-edge Slice Calculations...");
var p0Slice = FarbschnittMath.calculateSlice({
    pageIndex: 0,
    pageCount: doc.pages.length,
    paperThickness: paperThicknessPt,
    stripDepth: stripDepthPt,
    bleed: bleedPt,
    pageWidth: doc.width,
    pageHeight: doc.height,
    isVerso: doc.pages[0].isVerso,
    edge: 'foreEdge'
});

assert.strictEqual(p0Slice.rotation, 0, "Fore-edge rotation must be 0 degrees");
assert.strictEqual(p0Slice.frameBounds[1], doc.width - stripDepthPt, "Recto Fore-edge left frame bound check");
assert.strictEqual(p0Slice.frameBounds[3], doc.width + bleedPt, "Recto Fore-edge right frame bound check");

// Test 2: Top Edge (Spine Protection)
console.log("\n[Test 2] Testing Top Edge Spine Protection & 90° Rotation...");
var p1TopSlice = FarbschnittMath.calculateSlice({
    pageIndex: 1,
    pageCount: doc.pages.length,
    paperThickness: paperThicknessPt,
    stripDepth: stripDepthPt,
    bleed: bleedPt,
    pageWidth: doc.width,
    pageHeight: doc.height,
    isVerso: doc.pages[1].isVerso,
    edge: 'topEdge'
});

assert.strictEqual(p1TopSlice.rotation, 90, "Top edge rotation must be 90 degrees");
assert.strictEqual(p1TopSlice.frameBounds[3], doc.width, "Verso top edge must not cross spine (X = doc.width)");

// Test 3: Bottom Edge (Spine Protection)
console.log("\n[Test 3] Testing Bottom Edge Spine Protection & 270° Rotation...");
var p0BottomSlice = FarbschnittMath.calculateSlice({
    pageIndex: 0,
    pageCount: doc.pages.length,
    paperThickness: paperThicknessPt,
    stripDepth: stripDepthPt,
    bleed: bleedPt,
    pageWidth: doc.width,
    pageHeight: doc.height,
    isVerso: doc.pages[0].isVerso,
    edge: 'bottomEdge'
});

assert.strictEqual(p0BottomSlice.rotation, 270, "Bottom edge rotation must be 270 degrees");
assert.strictEqual(p0BottomSlice.frameBounds[1], 0, "Recto bottom edge left frame must start at spine (X = 0)");

// Test 4: Verification Test Mode
console.log("\n[Test 4] Testing Test Verification Reference Strip Mode...");
var p0TestSlice = FarbschnittMath.calculateSlice({
    pageIndex: 0,
    pageCount: doc.pages.length,
    paperThickness: paperThicknessPt,
    stripDepth: stripDepthPt,
    bleed: bleedPt,
    pageWidth: doc.width,
    pageHeight: doc.height,
    isVerso: doc.pages[0].isVerso,
    edge: 'foreEdge',
    generateTestStrip: true
});

assert(p0TestSlice.testFrameBounds !== null, "Test strip frame bounds must be present when generateTestStrip is true");
assert(p0TestSlice.testFrameBounds[1] > doc.width + bleedPt, "Test strip for Recto must be placed outside right page bleed");

console.log("\nALL AUTOMATED TESTS PASSED SUCCESSFULLY!");

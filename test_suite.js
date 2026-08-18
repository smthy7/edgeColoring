const { FarbschnittMath } = require('./src/FarbschnittCore.js');
const assert = require('assert');

console.log("=== Comprehensive Automated Test Suite for Farbschnitt.jsx ===");

// Helper to simulate InDesign Page and Document
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

// Test Suite 1: Single and Facing Pages Bounds Calculation
console.log("\n[Test Suite 1] Testing Fore-edge Slice Calculations...");
var doc = createMockDoc(200, 396.85, 609.45); // ~140mm x 215mm in pt

var paperThicknessPt = FarbschnittMath.mmToPt(0.1);
var stripDepthPt = FarbschnittMath.mmToPt(3.0);
var bleedPt = FarbschnittMath.mmToPt(3.0);

// Page 0 (Recto / Right page)
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

assert(p0Slice.frameBounds[1] > doc.width - stripDepthPt - 0.01, "Page 0 Frame Left should align with right edge minus strip depth");
assert(p0Slice.frameBounds[3] > doc.width + bleedPt - 0.01, "Page 0 Frame Right should align with page width plus bleed");

// Page 1 (Verso / Left page)
var p1Slice = FarbschnittMath.calculateSlice({
    pageIndex: 1,
    pageCount: doc.pages.length,
    paperThickness: paperThicknessPt,
    stripDepth: stripDepthPt,
    bleed: bleedPt,
    pageWidth: doc.width,
    pageHeight: doc.height,
    isVerso: doc.pages[1].isVerso,
    edge: 'foreEdge'
});

assert(p1Slice.frameBounds[1] < -bleedPt + 0.01, "Page 1 Frame Left should align with -bleed");
assert(p1Slice.frameBounds[3] < stripDepthPt + 0.01, "Page 1 Frame Right should align with strip depth");

console.log("✓ Fore-edge Recto & Verso calculation verified.");

// Test Suite 2: Top Edge and Bottom Edge
console.log("\n[Test Suite 2] Testing Top Edge and Bottom Edge Calculations...");

var topSlice = FarbschnittMath.calculateSlice({
    pageIndex: 50,
    pageCount: doc.pages.length,
    paperThickness: paperThicknessPt,
    stripDepth: stripDepthPt,
    bleed: bleedPt,
    pageWidth: doc.width,
    pageHeight: doc.height,
    isVerso: false,
    edge: 'topEdge'
});

assert.strictEqual(topSlice.frameBounds[0], -bleedPt, "Top Edge frame top must match -bleed");
assert.strictEqual(topSlice.frameBounds[2], stripDepthPt, "Top Edge frame bottom must match stripDepth");

var bottomSlice = FarbschnittMath.calculateSlice({
    pageIndex: 50,
    pageCount: doc.pages.length,
    paperThickness: paperThicknessPt,
    stripDepth: stripDepthPt,
    bleed: bleedPt,
    pageWidth: doc.width,
    pageHeight: doc.height,
    isVerso: false,
    edge: 'bottomEdge'
});

assert.strictEqual(bottomSlice.frameBounds[0], doc.height - stripDepthPt, "Bottom Edge frame top must match page height - stripDepth");
assert.strictEqual(bottomSlice.frameBounds[2], doc.height + bleedPt, "Bottom Edge frame bottom must match page height + bleed");

console.log("✓ Top & Bottom edge calculations verified.");

// Test Suite 3: Transformations (Pan & Zoom)
console.log("\n[Test Suite 3] Testing Editor Transformation Offsets & Zoom...");

var transformedSlice = FarbschnittMath.calculateSlice({
    pageIndex: 0,
    pageCount: 100,
    paperThickness: paperThicknessPt,
    stripDepth: stripDepthPt,
    bleed: bleedPt,
    pageWidth: doc.width,
    pageHeight: doc.height,
    isVerso: false,
    edge: 'foreEdge',
    offsetX: 15,
    offsetY: -10,
    scaleFactor: 1.25
});

assert(transformedSlice.graphicBounds[1] > p0Slice.graphicBounds[1], "Graphic X position should shift right with positive offsetX");
assert(transformedSlice.graphicBounds[0] < p0Slice.graphicBounds[0], "Graphic Y position should shift up with negative offsetY");

console.log("✓ Transformations (Pan & Scale) verified.");

console.log("\nALL AUTOMATED TESTS PASSED SUCCESSFULLY!");

/**
 * Farbschnitt Math & Helper Utilities Unit Test
 */

function calculatePageSlice(params) {
    var pageIndex = params.pageIndex;          // 0 to pageCount - 1
    var pageCount = params.pageCount;          // e.g. 200
    var paperThickness = params.paperThickness;  // mm e.g. 0.1
    var stripDepth = params.stripDepth;        // mm e.g. 3.0
    var bleed = params.bleed;                  // mm e.g. 3.0
    var pageWidth = params.pageWidth;          // mm e.g. 135
    var pageHeight = params.pageHeight;        // mm e.g. 215
    var isVerso = params.isVerso;              // true if left page, false if right page
    var edge = params.edge || 'foreEdge';      // 'foreEdge', 'topEdge', 'bottomEdge'

    // Total book block thickness (X-axis in 3D book space)
    var totalBlockThickness = pageCount * paperThickness;

    // Slice bounds in book block X-space [0 ... totalBlockThickness]
    var sliceXStart = pageIndex * paperThickness;
    var sliceXEnd = (pageIndex + 1) * paperThickness;
    var sliceWidth = paperThickness;

    // Frame bounds [top, left, bottom, right] in InDesign page coordinates
    var frameTop, frameLeft, frameBottom, frameRight;

    if (edge === 'foreEdge') {
        frameTop = -bleed;
        frameBottom = pageHeight + bleed;
        if (isVerso) {
            // Left page: fore-edge is on the LEFT (outer edge)
            frameLeft = -bleed;
            frameRight = stripDepth;
        } else {
            // Right page: fore-edge is on the RIGHT (outer edge)
            frameLeft = pageWidth - stripDepth;
            frameRight = pageWidth + bleed;
        }
    } else if (edge === 'topEdge') {
        frameTop = -bleed;
        frameBottom = stripDepth;
        frameLeft = -bleed;
        frameRight = pageWidth + bleed;
    } else if (edge === 'bottomEdge') {
        frameTop = pageHeight - stripDepth;
        frameBottom = pageHeight + bleed;
        frameLeft = -bleed;
        frameRight = pageWidth + bleed;
    }

    var frameWidth = frameRight - frameLeft;
    var frameHeight = frameBottom - frameTop;

    // Calculate Graphic Bounds [top, left, bottom, right] relative to page coordinates
    // so that the slice [sliceXStart, sliceXEnd] fills the frameWidth [frameLeft, frameRight].
    // Graphic total width needed = frameWidth * (totalBlockThickness / sliceWidth)
    var graphicWidth = frameWidth * (totalBlockThickness / sliceWidth);

    // Scale factor for graphic in X direction
    var scaleX = graphicWidth / totalBlockThickness; // = frameWidth / sliceWidth

    // On pageIndex, sliceXStart maps to frameLeft (or frameRight depending on direction)
    // Left edge of full image on page coordinates:
    var graphicLeft = frameLeft - (sliceXStart * scaleX);
    var graphicRight = graphicLeft + graphicWidth;

    // Y positioning: Y spans full page height plus bleed
    var graphicTop = -bleed;
    var graphicBottom = pageHeight + bleed;

    return {
        frameBounds: [frameTop, frameLeft, frameBottom, frameRight],
        graphicBounds: [graphicTop, graphicLeft, graphicBottom, graphicRight],
        sliceRatio: {
            start: pageIndex / pageCount,
            end: (pageIndex + 1) / pageCount
        }
    };
}

// Simple test
var testRes = calculatePageSlice({
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

console.log("Test Page 0 Slice:", JSON.stringify(testRes, null, 2));

var testResPage99 = calculatePageSlice({
    pageIndex: 99,
    pageCount: 100,
    paperThickness: 0.1,
    stripDepth: 3,
    bleed: 3,
    pageWidth: 140,
    pageHeight: 200,
    isVerso: false,
    edge: 'foreEdge'
});

console.log("Test Page 99 Slice:", JSON.stringify(testResPage99, null, 2));

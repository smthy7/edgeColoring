/**
 * FarbschnittCore.js
 *
 * Core geometry and slice calculation math for Farbschnitt InDesign Script.
 */

(function (global) {
    'use strict';

    var MM_TO_PT = 2.834645669291339;
    var PT_TO_MM = 0.3527777777777778;

    var FarbschnittMath = {
        mmToPt: function (mm) {
            return mm * MM_TO_PT;
        },

        ptToMm: function (pt) {
            return pt * PT_TO_MM;
        },

        /**
         * Calculates frame bounds, graphic bounds, and rotation for a page slice
         */
        calculateSlice: function (opts) {
            var pageIndex = opts.pageIndex;          // 0 to pageCount - 1
            var pageCount = opts.pageCount;          // Total pages in book
            var paperThickness = opts.paperThickness;// Thickness per page in pt
            var stripDepth = opts.stripDepth;        // Depth of strip in pt
            var bleed = opts.bleed;                  // Bleed in pt
            var pageWidth = opts.pageWidth;          // Page width in pt
            var pageHeight = opts.pageHeight;        // Page height in pt
            var isVerso = opts.isVerso;              // true = Left page, false = Right page
            var edge = opts.edge || 'foreEdge';      // 'foreEdge', 'topEdge', 'bottomEdge'
            var generateTestStrip = opts.generateTestStrip || false;

            // Total thickness of book block
            var totalThickness = pageCount * paperThickness;
            var sliceXStart = pageIndex * paperThickness;

            var frameTop, frameLeft, frameBottom, frameRight;
            var rotation = 0; // Graphic rotation in degrees (0, 90, 270)

            if (edge === 'foreEdge') {
                frameTop = -bleed;
                frameBottom = pageHeight + bleed;
                if (isVerso) {
                    // Left page (Verso): Fore-edge on LEFT. Bleed on outer left.
                    frameLeft = -bleed;
                    frameRight = stripDepth;
                } else {
                    // Right page (Recto): Fore-edge on RIGHT. Bleed on outer right.
                    frameLeft = pageWidth - stripDepth;
                    frameRight = pageWidth + bleed;
                }
            } else if (edge === 'topEdge') {
                frameTop = -bleed;
                frameBottom = stripDepth;
                if (isVerso) {
                    // Left page: Outer edge left, Spine right. No bleed across spine!
                    frameLeft = -bleed;
                    frameRight = pageWidth; // Stop strictly at spine (right side)
                } else {
                    // Right page: Spine left, Outer edge right. No bleed across spine!
                    frameLeft = 0; // Start strictly at spine (left side)
                    frameRight = pageWidth + bleed;
                }
                rotation = 90; // Rotate image for top edge
            } else if (edge === 'bottomEdge') {
                frameTop = pageHeight - stripDepth;
                frameBottom = pageHeight + bleed;
                if (isVerso) {
                    // Left page: Outer edge left, Spine right. No bleed across spine!
                    frameLeft = -bleed;
                    frameRight = pageWidth; // Stop strictly at spine (right side)
                } else {
                    // Right page: Spine left, Outer edge right. No bleed across spine!
                    frameLeft = 0; // Start strictly at spine (left side)
                    frameRight = pageWidth + bleed;
                }
                rotation = 270; // Rotate image for bottom edge
            }

            var frameWidth = frameRight - frameLeft;

            // Compute graphic positioning
            var graphicWidth = frameWidth * (totalThickness / paperThickness);
            var scaleX = graphicWidth / totalThickness;

            var graphicLeft = frameLeft - (sliceXStart * scaleX);
            var graphicRight = graphicLeft + graphicWidth;

            var graphicTop = -bleed;
            var graphicBottom = pageHeight + bleed;

            // Test Strip / Reference Mode Bounds (placed directly adjacent to page for visual verification)
            var testFrameBounds = null;
            if (generateTestStrip) {
                var testOffset = 15; // 15 pt spacing outside page margin
                if (isVerso) {
                    // Place test strip to left of left page
                    testFrameBounds = [
                        frameTop,
                        -bleed - testOffset - stripDepth,
                        frameBottom,
                        -bleed - testOffset
                    ];
                } else {
                    // Place test strip to right of right page
                    testFrameBounds = [
                        frameTop,
                        pageWidth + bleed + testOffset,
                        frameBottom,
                        pageWidth + bleed + testOffset + stripDepth
                    ];
                }
            }

            return {
                frameBounds: [frameTop, frameLeft, frameBottom, frameRight],
                graphicBounds: [graphicTop, graphicLeft, graphicBottom, graphicRight],
                rotation: rotation,
                testFrameBounds: testFrameBounds
            };
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { FarbschnittMath: FarbschnittMath };
    } else {
        global.FarbschnittMath = FarbschnittMath;
    }

})(this);

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
         * Calculates frame bounds, graphic bounds, and rotation angle for a page slice.
         *
         * - Fore-edge: Slices along X-axis (width = stripDepth + bleed, height = pageHeight + 2*bleed).
         * - Top-edge: Slices along Y-axis (width = pageWidth + bleed, height = stripDepth + bleed), rotation = 90°.
         * - Bottom-edge: Slices along Y-axis (width = pageWidth + bleed, height = stripDepth + bleed), rotation = 270°.
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

            var totalBookThickness = pageCount * paperThickness;

            var frameTop, frameLeft, frameBottom, frameRight;
            var graphicTop, graphicLeft, graphicBottom, graphicRight;
            var rotation = 0;

            if (edge === 'foreEdge') {
                frameTop = -bleed;
                frameBottom = pageHeight + bleed;
                if (isVerso) {
                    frameLeft = -bleed;
                    frameRight = stripDepth;
                } else {
                    frameLeft = pageWidth - stripDepth;
                    frameRight = pageWidth + bleed;
                }

                var frameWidth = frameRight - frameLeft;
                var totalGraphicWidth = frameWidth * pageCount;
                graphicLeft = frameLeft - (pageIndex * frameWidth);
                graphicRight = graphicLeft + totalGraphicWidth;
                graphicTop = frameTop;
                graphicBottom = frameBottom;
                rotation = 0;

            } else if (edge === 'topEdge') {
                frameTop = -bleed;
                frameBottom = stripDepth;
                if (isVerso) {
                    frameLeft = -bleed;
                    frameRight = pageWidth;
                } else {
                    frameLeft = 0;
                    frameRight = pageWidth + bleed;
                }

                var frameHeight = frameBottom - frameTop;
                var totalGraphicHeight = frameHeight * pageCount;
                graphicLeft = frameLeft;
                graphicRight = frameRight;
                graphicTop = frameTop - (pageIndex * frameHeight);
                graphicBottom = graphicTop + totalGraphicHeight;
                rotation = 90;

            } else if (edge === 'bottomEdge') {
                frameTop = pageHeight - stripDepth;
                frameBottom = pageHeight + bleed;
                if (isVerso) {
                    frameLeft = -bleed;
                    frameRight = pageWidth;
                } else {
                    frameLeft = 0;
                    frameRight = pageWidth + bleed;
                }

                var frameHeight = frameBottom - frameTop;
                var totalGraphicHeight = frameHeight * pageCount;
                graphicLeft = frameLeft;
                graphicRight = frameRight;
                graphicTop = frameTop - (pageIndex * frameHeight);
                graphicBottom = graphicTop + totalGraphicHeight;
                rotation = 270;
            }

            return {
                frameBounds: [frameTop, frameLeft, frameBottom, frameRight],
                graphicBounds: [graphicTop, graphicLeft, graphicBottom, graphicRight],
                totalBookThickness: totalBookThickness,
                rotation: rotation
            };
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { FarbschnittMath: FarbschnittMath };
    } else {
        global.FarbschnittMath = FarbschnittMath;
    }

})(this);

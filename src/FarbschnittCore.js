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
         * Calculates frame bounds and rotation angle for a page slice.
         */
        calculateSlice: function (opts) {
            var stripDepth = opts.stripDepth;        // Depth in pt/doc units
            var bleed = opts.bleed;                  // Bleed in pt/doc units
            var pageWidth = opts.pageWidth;          // Page width in pt/doc units
            var pageHeight = opts.pageHeight;        // Page height in pt/doc units
            var isVerso = opts.isVerso;              // true = Left page, false = Right page
            var edge = opts.edge || 'foreEdge';      // 'foreEdge', 'topEdge', 'bottomEdge'

            var frameTop, frameLeft, frameBottom, frameRight;
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
                rotation = 270;
            }

            return {
                frameBounds: [frameTop, frameLeft, frameBottom, frameRight],
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

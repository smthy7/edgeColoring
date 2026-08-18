/**
 * Farbschnitt.jsx - Adobe InDesign Script
 *
 * Erstellt einen präzisen digitalen Farbschnitt auf Buchseiten für InDesign.
 * Unterstützt ScriptUI mit Live-Vorschau/Editor, Mehrfach-Kanten (Vorderschnitt, Kopfschnitt, Fußschnitt),
 * variablen Anschnitt (Bleed), Deckkraft und doppelseitigen Buchsatz.
 *
 * @author Agency Quality Software Engineering
 * @version 1.0.0
 */

// #target indesign

(function (global) {
    'use strict';

    // ==========================================
    // CONFIGURATION & CONSTANTS
    // ==========================================
    var LAYER_NAME = "Farbschnitt";
    var SCRIPT_NAME = "Farbschnitt Generator";

    // Unit conversion constants (InDesign internal points vs mm)
    var MM_TO_PT = 2.834645669291339;
    var PT_TO_MM = 0.3527777777777778;

    // ==========================================
    // MATHEMATICAL & GEOMETRIC CORE
    // ==========================================
    var FarbschnittMath = {
        /**
         * Converts mm to points
         */
        mmToPt: function (mm) {
            return mm * MM_TO_PT;
        },

        /**
         * Converts points to mm
         */
        ptToMm: function (pt) {
            return pt * PT_TO_MM;
        },

        /**
         * Calculates frame and graphic bounds for a specific page slice
         *
         * @param {Object} opts
         * @returns {Object} { frameBounds: [top, left, bottom, right], graphicBounds: [top, left, bottom, right] }
         */
        calculateSlice: function (opts) {
            var pageIndex = opts.pageIndex;          // 0 to totalPages - 1
            var pageCount = opts.pageCount;          // Total pages in book
            var paperThickness = opts.paperThickness;// Thickness per page in mm/pt
            var stripDepth = opts.stripDepth;        // Depth of strip into page
            var bleed = opts.bleed;                  // Bleed/crop margin
            var pageWidth = opts.pageWidth;          // Page width
            var pageHeight = opts.pageHeight;        // Page height
            var isVerso = opts.isVerso;              // true = Left page, false = Right page
            var edge = opts.edge || 'foreEdge';      // 'foreEdge', 'topEdge', 'bottomEdge'

            // User image positioning offsets / scaling from editor UI
            var offsetX = opts.offsetX || 0;
            var offsetY = opts.offsetY || 0;
            var scaleFactor = opts.scaleFactor || 1.0;

            // Book block total thickness along X-axis
            var totalThickness = pageCount * paperThickness;
            var sliceXStart = pageIndex * paperThickness;

            // Frame bounds [top, left, bottom, right]
            var frameTop, frameLeft, frameBottom, frameRight;

            if (edge === 'foreEdge') {
                frameTop = -bleed;
                frameBottom = pageHeight + bleed;
                if (isVerso) {
                    // Left page (Verso): outer edge is on the LEFT
                    frameLeft = -bleed;
                    frameRight = stripDepth;
                } else {
                    // Right page (Recto): outer edge is on the RIGHT
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

            // Scale for slice mapping across book block
            var graphicWidth = frameWidth * (totalThickness / paperThickness) * scaleFactor;
            var scaleX = graphicWidth / totalThickness;

            var graphicLeft = frameLeft - (sliceXStart * scaleX) + offsetX;
            var graphicRight = graphicLeft + graphicWidth;

            var graphicTop = -bleed + offsetY;
            var graphicBottom = (pageHeight + bleed) * scaleFactor + offsetY;

            return {
                frameBounds: [frameTop, frameLeft, frameBottom, frameRight],
                graphicBounds: [graphicTop, graphicLeft, graphicBottom, graphicRight]
            };
        }
    };

    // Export module for testing / execution
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            FarbschnittMath: FarbschnittMath
        };
    } else {
        global.FarbschnittMath = FarbschnittMath;
    }

})(this);

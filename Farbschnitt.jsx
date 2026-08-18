/**
 * Farbschnitt.jsx - Agency Quality Adobe InDesign Script
 *
 * Erstellt einen digitalen Farbschnitt auf Buchseiten in Adobe InDesign.
 * Features:
 * - ScriptUI Dialog mit interaktivem Editor / Canvas-Vorschau
 * - Positionierung (Pan X/Y, Zoom/Skalierung, Einpassen)
 * - Mehrfach-Auswahl der Kanten: Vorderschnitt (Fore-edge), Kopfschnitt (Top), Fußschnitt (Bottom)
 * - Einstellbarer Anschnitt (Bleed), Schnitttiefe (Strip Depth), Seitendicke und Deckkraft (Opacity)
 * - Automatische Erkennung von Doppelseiten (Verso / Recto)
 * - Automatisches Ebenen-Management ("Farbschnitt"-Ebene)
 * - Rückgängig machen als eine einzige Aktion (UndoModes.ENTIRE_SCRIPT)
 *
 * @author Agency Quality Software Engineering
 * @version 1.0.0
 */

#target indesign
#targetengine "FarbschnittEngine"

(function (global) {
    'use strict';

    // ==========================================
    // CONFIGURATION & CONSTANTS
    // ==========================================
    var LAYER_NAME = "Farbschnitt";
    var SCRIPT_NAME = "Digitaler Farbschnitt Generator";
    var MM_TO_PT = 2.834645669291339;
    var PT_TO_MM = 0.3527777777777778;

    // ==========================================
    // MATHEMATICAL & GEOMETRIC CORE
    // ==========================================
    var FarbschnittMath = {
        mmToPt: function (mm) {
            return mm * MM_TO_PT;
        },

        ptToMm: function (pt) {
            return pt * PT_TO_MM;
        },

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

            var offsetX = opts.offsetX || 0;
            var offsetY = opts.offsetY || 0;
            var scaleFactor = opts.scaleFactor || 1.0;

            // Total thickness of book block
            var totalThickness = pageCount * paperThickness;
            var sliceXStart = pageIndex * paperThickness;

            // Frame bounds [top, left, bottom, right] in page coordinates
            var frameTop, frameLeft, frameBottom, frameRight;

            if (edge === 'foreEdge') {
                frameTop = -bleed;
                frameBottom = pageHeight + bleed;
                if (isVerso) {
                    // Left page (Verso): Fore-edge is on LEFT
                    frameLeft = -bleed;
                    frameRight = stripDepth;
                } else {
                    // Right page (Recto): Fore-edge is on RIGHT
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

            // Compute graphic positioning
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

    // Export math if in node environment
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { FarbschnittMath: FarbschnittMath };
    }

    // Stop execution if not running in InDesign application
    if (typeof app === 'undefined' || !app.documents) {
        return;
    }

    // ==========================================
    // MAIN SCRIPT EXECUTION
    // ==========================================
    function main() {
        if (app.documents.length === 0) {
            alert("Bitte öffnen Sie zuerst ein InDesign-Dokument.", SCRIPT_NAME);
            return;
        }

        var doc = app.activeDocument;
        var totalPages = doc.pages.length;

        if (totalPages === 0) {
            alert("Das Dokument enthält keine Seiten.", SCRIPT_NAME);
            return;
        }

        // Store original ruler preferences to restore later
        var origHUnits = doc.viewPreferences.horizontalMeasurementUnits;
        var origVUnits = doc.viewPreferences.verticalMeasurementUnits;
        var origOrigin = doc.viewPreferences.rulerOrigin;

        // Temporarily force Points for exact mathematical calculations
        doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.POINTS;
        doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.POINTS;
        doc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;

        try {
            // Gather document default dimensions in mm
            var page1 = doc.pages[0];
            var bounds = page1.bounds; // [top, left, bottom, right] in points
            var docPageWidthPt = bounds[3] - bounds[1];
            var docPageHeightPt = bounds[2] - bounds[0];

            var docPageWidthMm = FarbschnittMath.ptToMm(docPageWidthPt);
            var docPageHeightMm = FarbschnittMath.ptToMm(docPageHeightPt);

            // Standard default parameters
            var defaultPaperThickness = 0.1; // 0.1 mm per page
            var defaultStripDepth = 3.0;     // 3 mm into page
            var defaultBleed = 3.0;          // 3 mm bleed
            var defaultOpacity = 100;        // 100% opacity

            // Build ScriptUI Window
            var win = new Window("dialog", SCRIPT_NAME + " - Professional Studio");
            win.orientation = "column";
            win.alignChildren = ["fill", "top"];
            win.spacing = 10;
            win.margins = 16;

            // Header Panel
            var pnlHeader = win.add("panel", undefined, "Dokument-Informationen");
            pnlHeader.orientation = "row";
            pnlHeader.alignChildren = ["left", "center"];
            pnlHeader.add("statictext", undefined, "Seitenanzahl: " + totalPages + "  |  Format: " + docPageWidthMm.toFixed(1) + " x " + docPageHeightMm.toFixed(1) + " mm");

            // Main Layout: Left Controls, Right Preview Editor
            var mainGroup = win.add("group");
            mainGroup.orientation = "row";
            mainGroup.alignChildren = ["left", "fill"];
            mainGroup.spacing = 15;

            // Left Controls Panel
            var leftCol = mainGroup.add("group");
            leftCol.orientation = "column";
            leftCol.alignChildren = ["fill", "top"];
            leftCol.spacing = 10;
            leftCol.preferredSize.width = 300;

            // 1. File Selection
            var pnlFile = leftCol.add("panel", undefined, "1. Quellbild für Farbschnitt");
            pnlFile.orientation = "column";
            pnlFile.alignChildren = ["fill", "top"];
            pnlFile.spacing = 6;

            var btnFile = pnlFile.add("button", undefined, "Bild auswählen...");
            var txtFile = pnlFile.add("statictext", undefined, "Keine Datei ausgewählt", { truncate: "middle" });
            txtFile.preferredSize.width = 280;

            var selectedFile = null;
            btnFile.onClick = function () {
                var f = File.openDialog("Quellbild für den Farbschnitt auswählen", "Bilder:*.jpg;*.jpeg;*.png;*.tif;*.tiff;*.psd;*.pdf;*.ai");
                if (f) {
                    selectedFile = f;
                    txtFile.text = f.displayName;
                    updatePreviewCanvas();
                }
            };

            // 2. Book Block & Paper Settings
            var pnlSpecs = leftCol.add("panel", undefined, "2. Buchblock & Farbschnitt-Spezifikation");
            pnlSpecs.orientation = "column";
            pnlSpecs.alignChildren = ["fill", "top"];
            pnlSpecs.spacing = 8;

            // Paper thickness
            var grpThickness = pnlSpecs.add("group");
            grpThickness.add("statictext", undefined, "Papierstärke (mm/Seite):");
            var inpThickness = grpThickness.add("edittext", undefined, defaultPaperThickness.toString());
            inpThickness.preferredSize.width = 60;

            // Calculated Book Thickness
            var txtTotalThickness = pnlSpecs.add("statictext", undefined, "Berechnete Buchdicke: " + (totalPages * defaultPaperThickness).toFixed(2) + " mm");

            inpThickness.onChanging = function () {
                var val = parseFloat(inpThickness.text) || 0;
                txtTotalThickness.text = "Berechnete Buchdicke: " + (totalPages * val).toFixed(2) + " mm";
                updatePreviewCanvas();
            };

            // Strip depth
            var grpStrip = pnlSpecs.add("group");
            grpStrip.add("statictext", undefined, "Farbschnitt-Tiefe (mm):");
            var inpStripDepth = grpStrip.add("edittext", undefined, defaultStripDepth.toString());
            inpStripDepth.preferredSize.width = 60;

            // Bleed (Beschnittzugabe)
            var grpBleed = pnlSpecs.add("group");
            grpBleed.add("statictext", undefined, "Beschnittzugabe Bleed (mm):");
            var inpBleed = grpBleed.add("edittext", undefined, defaultBleed.toString());
            inpBleed.preferredSize.width = 60;

            // Opacity / Deckkraft
            var grpOpacity = pnlSpecs.add("group");
            grpOpacity.orientation = "column";
            grpOpacity.alignChildren = ["left", "top"];
            var lblOpacity = grpOpacity.add("statictext", undefined, "Deckkraft: " + defaultOpacity + "%");
            var sldOpacity = grpOpacity.add("slider", undefined, defaultOpacity, 0, 100);
            sldOpacity.preferredSize.width = 260;
            sldOpacity.onChanging = function () {
                lblOpacity.text = "Deckkraft: " + Math.round(sldOpacity.value) + "%";
            };

            // 3. Edge Selection (Kanten-Auswahl)
            var pnlEdges = leftCol.add("panel", undefined, "3. Schnittkanten-Auswahl");
            pnlEdges.orientation = "column";
            pnlEdges.alignChildren = ["left", "top"];
            pnlEdges.spacing = 4;

            var chkForeEdge = pnlEdges.add("checkbox", undefined, "Vorderschnitt (Fore-Edge)");
            chkForeEdge.value = true;
            var chkTopEdge = pnlEdges.add("checkbox", undefined, "Kopfschnitt (Top)");
            chkTopEdge.value = false;
            var chkBottomEdge = pnlEdges.add("checkbox", undefined, "Fußschnitt (Bottom)");
            chkBottomEdge.value = false;

            // Right Column - Interactive Preview Editor
            var rightCol = mainGroup.add("group");
            rightCol.orientation = "column";
            rightCol.alignChildren = ["fill", "top"];
            rightCol.spacing = 10;

            var pnlPreview = rightCol.add("panel", undefined, "4. Farbschnitt Live-Editor & Positionierung");
            pnlPreview.orientation = "column";
            pnlPreview.alignChildren = ["center", "top"];

            // ScriptUI Canvas Area (group control with preferredSize)
            var canvasSize = [360, 260];
            var canvas = pnlPreview.add("group");
            canvas.preferredSize = canvasSize;

            // Transformation State
            var transformState = {
                offsetX: 0,
                offsetY: 0,
                scale: 1.0
            };

            // Controls below Editor
            var grpTransforms = pnlPreview.add("group");
            grpTransforms.orientation = "row";
            grpTransforms.spacing = 10;

            var btnPanLeft = grpTransforms.add("button", undefined, "◄");
            btnPanLeft.preferredSize.width = 30;
            var btnPanRight = grpTransforms.add("button", undefined, "►");
            btnPanRight.preferredSize.width = 30;
            var btnPanUp = grpTransforms.add("button", undefined, "▲");
            btnPanUp.preferredSize.width = 30;
            var btnPanDown = grpTransforms.add("button", undefined, "▼");
            btnPanDown.preferredSize.width = 30;

            var btnZoomIn = grpTransforms.add("button", undefined, "Zoom +");
            var btnZoomOut = grpTransforms.add("button", undefined, "Zoom -");
            var btnReset = grpTransforms.add("button", undefined, "Einpassen");

            btnPanLeft.onClick = function () { transformState.offsetX -= 10; updatePreviewCanvas(); };
            btnPanRight.onClick = function () { transformState.offsetX += 10; updatePreviewCanvas(); };
            btnPanUp.onClick = function () { transformState.offsetY -= 10; updatePreviewCanvas(); };
            btnPanDown.onClick = function () { transformState.offsetY += 10; updatePreviewCanvas(); };

            btnZoomIn.onClick = function () { transformState.scale *= 1.1; updatePreviewCanvas(); };
            btnZoomOut.onClick = function () { transformState.scale /= 1.1; updatePreviewCanvas(); };
            btnReset.onClick = function () { transformState.offsetX = 0; transformState.offsetY = 0; transformState.scale = 1.0; updatePreviewCanvas(); };

            // Custom Canvas Draw Method
            canvas.onDraw = function () {
                var g = canvas.graphics;
                if (!g) return;

                // Background
                g.rectPath(0, 0, canvasSize[0], canvasSize[1]);
                g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [0.18, 0.18, 0.18, 1]));

                // Draw simulated book block rectangle
                var margin = 20;
                var boxW = canvasSize[0] - (margin * 2);
                var boxH = canvasSize[1] - (margin * 2);
                var boxX = margin;
                var boxY = margin;

                // Book block border
                g.rectPath(boxX, boxY, boxW, boxH);
                g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [0.95, 0.95, 0.95, 1]));
                g.strokePath(g.newPen(g.PenType.SOLID_COLOR, [0.4, 0.4, 0.4, 1], 2));

                // Simulated image overlay if file selected
                if (selectedFile) {
                    var imgW = boxW * transformState.scale;
                    var imgH = boxH * transformState.scale;
                    var imgX = boxX + transformState.offsetX;
                    var imgY = boxY + transformState.offsetY;

                    g.rectPath(imgX, imgY, imgW, imgH);
                    g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [0.2, 0.6, 0.9, 0.4]));
                    g.strokePath(g.newPen(g.PenType.SOLID_COLOR, [0.1, 0.4, 0.8, 1], 1));
                }

                // Draw page slice lines to visualize book block pages
                var paperThick = parseFloat(inpThickness.text) || 0.1;
                var numLines = Math.min(totalPages, 40); // draw up to 40 lines
                var lineSpacing = boxW / numLines;

                for (var i = 0; i <= numLines; i++) {
                    var lx = boxX + (i * lineSpacing);
                    g.newPath();
                    g.moveTo(lx, boxY);
                    g.lineTo(lx, boxY + boxH);
                    g.strokePath(g.newPen(g.PenType.SOLID_COLOR, [0.7, 0.7, 0.7, 0.5], 1));
                }

                // Title inside canvas
                g.drawString(selectedFile ? "Vorschau: " + selectedFile.displayName : "Bitte wählen Sie links ein Quellbild aus.", g.newPen(g.PenType.SOLID_COLOR, [0.3, 0.3, 0.3, 1]), boxX + 10, boxY + 15);
            };

            function updatePreviewCanvas() {
                if (canvas.onDraw) {
                    canvas.onDraw();
                }
                if (win && win.layout) {
                    win.layout.invalidate();
                }
            }

            // Action Buttons
            var grpButtons = win.add("group");
            grpButtons.orientation = "row";
            grpButtons.alignment = ["right", "bottom"];
            grpButtons.spacing = 10;

            var btnCancel = grpButtons.add("button", undefined, "Abbrechen", { name: "cancel" });
            var btnOK = grpButtons.add("button", undefined, "Farbschnitt generieren", { name: "ok" });

            btnOK.onClick = function () {
                if (!selectedFile) {
                    alert("Bitte wählen Sie zuerst eine Bilddatei für den Farbschnitt aus.", SCRIPT_NAME);
                    return;
                }
                if (!chkForeEdge.value && !chkTopEdge.value && !chkBottomEdge.value) {
                    alert("Bitte wählen Sie mindestens eine Schnittkante (z.B. Vorderschnitt).", SCRIPT_NAME);
                    return;
                }

                win.close(1);
            };

            if (win.show() !== 1) {
                return; // User canceled
            }

            // Parse finalized input values
            var paperThicknessMm = parseFloat(inpThickness.text) || defaultPaperThickness;
            var stripDepthMm = parseFloat(inpStripDepth.text) || defaultStripDepth;
            var bleedMm = parseFloat(inpBleed.text) || defaultBleed;
            var opacityVal = sldOpacity.value;

            var activeEdges = [];
            if (chkForeEdge.value) activeEdges.push('foreEdge');
            if (chkTopEdge.value) activeEdges.push('topEdge');
            if (chkBottomEdge.value) activeEdges.push('bottomEdge');

            // Execute slice placement in a single undo transaction
            app.doScript(function () {
                executeFarbschnitt({
                    doc: doc,
                    imageFile: selectedFile,
                    paperThickness: FarbschnittMath.mmToPt(paperThicknessMm),
                    stripDepth: FarbschnittMath.mmToPt(stripDepthMm),
                    bleed: FarbschnittMath.mmToPt(bleedMm),
                    opacity: opacityVal,
                    edges: activeEdges,
                    transformState: transformState
                });
            }, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Farbschnitt Generieren");

            alert("Farbschnitt wurde erfolgreich auf " + totalPages + " Seiten angewendet!", SCRIPT_NAME);
        } finally {
            // Restore original ruler preferences
            doc.viewPreferences.horizontalMeasurementUnits = origHUnits;
            doc.viewPreferences.verticalMeasurementUnits = origVUnits;
            doc.viewPreferences.rulerOrigin = origOrigin;
        }
    }

    // ==========================================
    // INDESIGN PLACEMENT & LAYER ENGINE
    // ==========================================
    function executeFarbschnitt(params) {
        var doc = params.doc;
        var imageFile = params.imageFile;
        var paperThicknessPt = params.paperThickness;
        var stripDepthPt = params.stripDepth;
        var bleedPt = params.bleed;
        var opacityVal = params.opacity;
        var edges = params.edges;
        var transformState = params.transformState;

        // 1. Manage Farbschnitt Layer
        var targetLayer = doc.layers.itemByName(LAYER_NAME);
        if (targetLayer.isValid) {
            // Clear existing elements on layer for clean re-run
            targetLayer.pageItems.everyItem().remove();
        } else {
            targetLayer = doc.layers.add({ name: LAYER_NAME });
        }
        targetLayer.move(LocationOptions.AT_BEGINNING); // Bring layer to top

        // Get None swatch safely regardless of language (English "None", German "Ohne", etc.)
        var noneSwatch = doc.swatches.item(0);

        var totalPages = doc.pages.length;

        // Iterate through each page
        for (var i = 0; i < totalPages; i++) {
            var page = doc.pages[i];

            // Check if Verso (left) or Recto (right)
            var isVerso = (page.side === PageSideOptions.LEFT_HAND);
            if (page.side === PageSideOptions.SINGLE_SIDED) {
                isVerso = (i % 2 === 1); // fallback for single-sided
            }

            var pBounds = page.bounds; // [top, left, bottom, right] in points
            var pWidth = pBounds[3] - pBounds[1];
            var pHeight = pBounds[2] - pBounds[0];

            for (var e = 0; e < edges.length; e++) {
                var edge = edges[e];

                var sliceRes = FarbschnittMath.calculateSlice({
                    pageIndex: i,
                    pageCount: totalPages,
                    paperThickness: paperThicknessPt,
                    stripDepth: stripDepthPt,
                    bleed: bleedPt,
                    pageWidth: pWidth,
                    pageHeight: pHeight,
                    isVerso: isVerso,
                    edge: edge,
                    offsetX: transformState.offsetX,
                    offsetY: transformState.offsetY,
                    scaleFactor: transformState.scale
                });

                // Create rectangle frame on page
                var rect = page.rectangles.add(targetLayer, {
                    strokeWeight: 0,
                    strokeColor: noneSwatch,
                    fillColor: noneSwatch
                });

                // Set Frame Geometric Bounds [top, left, bottom, right]
                rect.geometricBounds = sliceRes.frameBounds;

                // Place image file
                rect.place(imageFile);

                // Fit and transform placed graphic inside frame
                if (rect.graphics.length > 0) {
                    var graphic = rect.graphics[0];
                    graphic.geometricBounds = sliceRes.graphicBounds;
                }

                // Apply Opacity
                if (opacityVal < 100) {
                    rect.transparencySettings.blendingSettings.opacity = opacityVal;
                }
            }
        }
    }

    // Run script
    main();

})(this);

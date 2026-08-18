/**
 * Farbschnitt.jsx - Professional Adobe InDesign Script
 *
 * Modern, clean ExtendScript for automated digital edge printing on book pages.
 *
 * Features:
 * - Clean modern ScriptUI layout
 * - Independent image selection per edge (Vorderschnitt, Kopfschnitt, Fußschnitt)
 * - Automatic image rotation for top (90°) and bottom (270°) edges
 * - Spine / Gutter protection (top/bottom edges do not cross page center spine)
 * - Optional Test Verification Mode (places a reference test strip adjacent to pages)
 * - Managed "Farbschnitt" layer & single-step UNDO
 *
 * @author Agency Quality Software Engineering
 * @version 2.0.0
 */

#target indesign
#targetengine "FarbschnittEngine"

(function (global) {
    'use strict';

    // ==========================================
    // CONFIGURATION & CONSTANTS
    // ==========================================
    var LAYER_NAME = "Farbschnitt";
    var TEST_LAYER_NAME = "Farbschnitt_Test_Verification";
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

            // Default parameters
            var defaultPaperThickness = 0.1; // 0.1 mm per page
            var defaultStripDepth = 3.0;     // 3 mm into page
            var defaultBleed = 3.0;          // 3 mm bleed
            var defaultOpacity = 100;        // 100% opacity

            // Selected images per edge
            var imageFiles = {
                foreEdge: null,
                topEdge: null,
                bottomEdge: null
            };

            // Build ScriptUI Window (Clean Claymorphic Style)
            var win = new Window("dialog", SCRIPT_NAME + " - Pro Studio");
            win.orientation = "column";
            win.alignChildren = ["fill", "top"];
            win.spacing = 12;
            win.margins = 18;

            // Header Panel
            var pnlHeader = win.add("panel", undefined, "Dokument-Ubersicht");
            pnlHeader.orientation = "row";
            pnlHeader.alignChildren = ["left", "center"];
            pnlHeader.add("statictext", undefined, "Seiten: " + totalPages + "  |  Format: " + docPageWidthMm.toFixed(1) + " x " + docPageHeightMm.toFixed(1) + " mm");

            // Section 1: Book Specs & Paper Geometry
            var pnlSpecs = win.add("panel", undefined, "1. Buchblock-Geometrie & Parameter");
            pnlSpecs.orientation = "column";
            pnlSpecs.alignChildren = ["fill", "top"];
            pnlSpecs.spacing = 8;

            var grpRow1 = pnlSpecs.add("group");
            grpRow1.orientation = "row";
            grpRow1.spacing = 15;

            grpRow1.add("statictext", undefined, "Papierstarke (mm/Seite):");
            var inpThickness = grpRow1.add("edittext", undefined, defaultPaperThickness.toString());
            inpThickness.preferredSize.width = 50;

            grpRow1.add("statictext", undefined, "Tiefe (mm):");
            var inpStripDepth = grpRow1.add("edittext", undefined, defaultStripDepth.toString());
            inpStripDepth.preferredSize.width = 50;

            grpRow1.add("statictext", undefined, "Bleed (mm):");
            var inpBleed = grpRow1.add("edittext", undefined, defaultBleed.toString());
            inpBleed.preferredSize.width = 50;

            var txtTotalThickness = pnlSpecs.add("statictext", undefined, "Berechnete Buchdicke: " + (totalPages * defaultPaperThickness).toFixed(2) + " mm");

            inpThickness.onChanging = function () {
                var val = parseFloat(inpThickness.text) || 0;
                txtTotalThickness.text = "Berechnete Buchdicke: " + (totalPages * val).toFixed(2) + " mm";
            };

            // Opacity slider
            var grpOpacity = pnlSpecs.add("group");
            grpOpacity.orientation = "row";
            grpOpacity.spacing = 10;
            var lblOpacity = grpOpacity.add("statictext", undefined, "Deckkraft: " + defaultOpacity + "%");
            lblOpacity.preferredSize.width = 110;
            var sldOpacity = grpOpacity.add("slider", undefined, defaultOpacity, 0, 100);
            sldOpacity.preferredSize.width = 240;
            sldOpacity.onChanging = function () {
                lblOpacity.text = "Deckkraft: " + Math.round(sldOpacity.value) + "%";
            };

            // Section 2: Schnittkanten & Bildauswahl
            var pnlEdges = win.add("panel", undefined, "2. Schnittkanten & Bildeinbindung");
            pnlEdges.orientation = "column";
            pnlEdges.alignChildren = ["fill", "top"];
            pnlEdges.spacing = 10;

            // Fore-edge row
            var grpFore = pnlEdges.add("group");
            grpFore.orientation = "row";
            grpFore.spacing = 10;
            var chkFore = grpFore.add("checkbox", undefined, "Vorderschnitt");
            chkFore.value = true;
            chkFore.preferredSize.width = 120;
            var btnFore = grpFore.add("button", undefined, "Bild wahlen...");
            var txtFore = grpFore.add("statictext", undefined, "Keine Datei", { truncate: "middle" });
            txtFore.preferredSize.width = 200;

            btnFore.onClick = function () {
                var f = File.openDialog("Quellbild fur Vorderschnitt", "Bilder:*.jpg;*.jpeg;*.png;*.tif;*.tiff;*.psd;*.pdf;*.ai");
                if (f) {
                    imageFiles.foreEdge = f;
                    txtFore.text = f.displayName;
                }
            };

            // Top edge row
            var grpTop = pnlEdges.add("group");
            grpTop.orientation = "row";
            grpTop.spacing = 10;
            var chkTop = grpTop.add("checkbox", undefined, "Kopfschnitt (Oben)");
            chkTop.value = false;
            chkTop.preferredSize.width = 120;
            var btnTop = grpTop.add("button", undefined, "Bild wahlen...");
            var txtTop = grpTop.add("statictext", undefined, "Keine Datei", { truncate: "middle" });
            txtTop.preferredSize.width = 200;

            btnTop.onClick = function () {
                var f = File.openDialog("Quellbild fur Kopfschnitt", "Bilder:*.jpg;*.jpeg;*.png;*.tif;*.tiff;*.psd;*.pdf;*.ai");
                if (f) {
                    imageFiles.topEdge = f;
                    txtTop.text = f.displayName;
                }
            };

            // Bottom edge row
            var grpBottom = pnlEdges.add("group");
            grpBottom.orientation = "row";
            grpBottom.spacing = 10;
            var chkBottom = grpBottom.add("checkbox", undefined, "Fußschnitt (Unten)");
            chkBottom.value = false;
            chkBottom.preferredSize.width = 120;
            var btnBottom = grpBottom.add("button", undefined, "Bild wahlen...");
            var txtBottom = grpBottom.add("statictext", undefined, "Keine Datei", { truncate: "middle" });
            txtBottom.preferredSize.width = 200;

            btnBottom.onClick = function () {
                var f = File.openDialog("Quellbild fur Fußschnitt", "Bilder:*.jpg;*.jpeg;*.png;*.tif;*.tiff;*.psd;*.pdf;*.ai");
                if (f) {
                    imageFiles.bottomEdge = f;
                    txtBottom.text = f.displayName;
                }
            };

            // Section 3: Test Checkbox & Verification Mode
            var pnlTest = win.add("panel", undefined, "3. Genauigkeits-Prufung & Referenz-Test");
            pnlTest.orientation = "column";
            pnlTest.alignChildren = ["left", "top"];
            var chkTestMode = pnlTest.add("checkbox", undefined, "Test-Referenzstreifen neben jeder Seite anlegen");
            chkTestMode.value = false;

            // Action Buttons
            var grpButtons = win.add("group");
            grpButtons.orientation = "row";
            grpButtons.alignment = ["right", "bottom"];
            grpButtons.spacing = 10;

            var btnCancel = grpButtons.add("button", undefined, "Abbrechen", { name: "cancel" });
            var btnOK = grpButtons.add("button", undefined, "Farbschnitt generieren", { name: "ok" });

            btnOK.onClick = function () {
                var selectedCount = 0;
                if (chkFore.value) {
                    selectedCount++;
                    if (!imageFiles.foreEdge) {
                        alert("Bitte wahlen Sie ein Bild fur den Vorderschnitt aus.", SCRIPT_NAME);
                        return;
                    }
                }
                if (chkTop.value) {
                    selectedCount++;
                    if (!imageFiles.topEdge) {
                        alert("Bitte wahlen Sie ein Bild fur den Kopfschnitt aus.", SCRIPT_NAME);
                        return;
                    }
                }
                if (chkBottom.value) {
                    selectedCount++;
                    if (!imageFiles.bottomEdge) {
                        alert("Bitte wahlen Sie ein Bild fur den Fußschnitt aus.", SCRIPT_NAME);
                        return;
                    }
                }

                if (selectedCount === 0) {
                    alert("Bitte wahlen Sie mindestens eine Schnittkante (z.B. Vorderschnitt) aus.", SCRIPT_NAME);
                    return;
                }

                win.close(1);
            };

            if (win.show() !== 1) {
                return; // User canceled
            }

            // Parse input values
            var paperThicknessMm = parseFloat(inpThickness.text) || defaultPaperThickness;
            var stripDepthMm = parseFloat(inpStripDepth.text) || defaultStripDepth;
            var bleedMm = parseFloat(inpBleed.text) || defaultBleed;
            var opacityVal = sldOpacity.value;
            var generateTestStrip = chkTestMode.value;

            var activeEdgeConfigs = [];
            if (chkFore.value && imageFiles.foreEdge) {
                activeEdgeConfigs.push({ edge: 'foreEdge', file: imageFiles.foreEdge });
            }
            if (chkTop.value && imageFiles.topEdge) {
                activeEdgeConfigs.push({ edge: 'topEdge', file: imageFiles.topEdge });
            }
            if (chkBottom.value && imageFiles.bottomEdge) {
                activeEdgeConfigs.push({ edge: 'bottomEdge', file: imageFiles.bottomEdge });
            }

            // Execute slice placement in a single undo transaction
            app.doScript(function () {
                executeFarbschnitt({
                    doc: doc,
                    paperThickness: FarbschnittMath.mmToPt(paperThicknessMm),
                    stripDepth: FarbschnittMath.mmToPt(stripDepthMm),
                    bleed: FarbschnittMath.mmToPt(bleedMm),
                    opacity: opacityVal,
                    edgeConfigs: activeEdgeConfigs,
                    generateTestStrip: generateTestStrip
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
        var paperThicknessPt = params.paperThickness;
        var stripDepthPt = params.stripDepth;
        var bleedPt = params.bleed;
        var opacityVal = params.opacity;
        var edgeConfigs = params.edgeConfigs;
        var generateTestStrip = params.generateTestStrip;

        // 1. Manage Farbschnitt Layer
        var targetLayer = doc.layers.itemByName(LAYER_NAME);
        if (targetLayer.isValid) {
            targetLayer.pageItems.everyItem().remove();
        } else {
            targetLayer = doc.layers.add({ name: LAYER_NAME });
        }
        targetLayer.move(LocationOptions.AT_BEGINNING);

        // 2. Manage Test Verification Layer
        var testLayer = doc.layers.itemByName(TEST_LAYER_NAME);
        if (testLayer.isValid) {
            testLayer.pageItems.everyItem().remove();
        }
        if (generateTestStrip) {
            if (!testLayer.isValid) {
                testLayer = doc.layers.add({ name: TEST_LAYER_NAME });
            }
            testLayer.move(LocationOptions.AT_BEGINNING);
        }

        // Get None swatch safely regardless of language
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

            for (var c = 0; c < edgeConfigs.length; c++) {
                var config = edgeConfigs[c];
                var edge = config.edge;
                var imageFile = config.file;

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
                    generateTestStrip: generateTestStrip
                });

                // Create main slice frame
                var rect = page.rectangles.add(targetLayer, {
                    strokeWeight: 0,
                    strokeColor: noneSwatch,
                    fillColor: noneSwatch
                });

                rect.geometricBounds = sliceRes.frameBounds;
                rect.place(imageFile);

                if (rect.graphics.length > 0) {
                    var graphic = rect.graphics[0];
                    graphic.geometricBounds = sliceRes.graphicBounds;
                    if (sliceRes.rotation !== 0) {
                        graphic.rotationAngle = sliceRes.rotation;
                    }
                }

                if (opacityVal < 100) {
                    rect.transparencySettings.blendingSettings.opacity = opacityVal;
                }

                // Place reference test strip if enabled
                if (generateTestStrip && sliceRes.testFrameBounds) {
                    var testRect = page.rectangles.add(testLayer, {
                        strokeWeight: 0.5,
                        strokeColor: doc.swatches.itemByName("Black") || noneSwatch,
                        fillColor: noneSwatch
                    });

                    testRect.geometricBounds = sliceRes.testFrameBounds;
                    testRect.place(imageFile);

                    if (testRect.graphics.length > 0) {
                        var testGraphic = testRect.graphics[0];
                        testGraphic.geometricBounds = sliceRes.graphicBounds;
                        if (sliceRes.rotation !== 0) {
                            testGraphic.rotationAngle = sliceRes.rotation;
                        }
                    }
                }
            }
        }
    }

    // Run script
    main();

})(this);

/**
 * Farbschnitt.jsx - Professional Adobe InDesign Script
 *
 * Modern, clean ExtendScript for automated digital edge printing on book pages.
 *
 * Features:
 * - Clean modern ScriptUI layout
 * - Independent image selection per edge (Vorderschnitt, Kopfschnitt, Fußschnitt)
 * - Matrix-based rotation for top (90°) and bottom (270°) edges
 * - Spine / Gutter protection (top/bottom edges do not cross page center spine)
 * - "FS_TEST" Verification Layer: Places single reference image per spread
 * - Dynamic pasteboard margin expansion preventing Error 54 pasteboard displacement
 * - Managed "Farbschnitt" layer & single-step UNDO
 *
 * @author Agency Quality Software Engineering
 * @version 2.7.0
 */

#target indesign
#targetengine "FarbschnittEngine"

(function (global) {
    'use strict';

    // ==========================================
    // CONFIGURATION & CONSTANTS
    // ==========================================
    var LAYER_NAME = "Farbschnitt";
    var FS_TEST_LAYER_NAME = "FS_TEST";
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
            var pageIndex = opts.pageIndex;
            var pageCount = opts.pageCount;
            var paperThickness = opts.paperThickness;
            var stripDepth = opts.stripDepth;
            var bleed = opts.bleed;
            var pageWidth = opts.pageWidth;
            var pageHeight = opts.pageHeight;
            var isVerso = opts.isVerso;
            var edge = opts.edge || 'foreEdge';

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
    }

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

        // Store original preferences to safely restore in finally block
        var origHUnits = doc.viewPreferences.horizontalMeasurementUnits;
        var origVUnits = doc.viewPreferences.verticalMeasurementUnits;
        var origOrigin = doc.viewPreferences.rulerOrigin;
        var origPasteboardMargins = doc.pasteboardPreferences.pasteboardMargins;

        // Force Points for exact calculation
        doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.POINTS;
        doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.POINTS;
        doc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;

        try {
            var page1 = doc.pages[0];
            var bounds = page1.bounds; // [top, left, bottom, right] in pt
            var docPageWidthPt = bounds[3] - bounds[1];
            var docPageHeightPt = bounds[2] - bounds[0];

            var docPageWidthMm = FarbschnittMath.ptToMm(docPageWidthPt);
            var docPageHeightMm = FarbschnittMath.ptToMm(docPageHeightPt);

            var defaultPaperThickness = 0.1;
            var defaultStripDepth = 3.0;
            var defaultBleed = 3.0;
            var defaultOpacity = 100;

            var imageFiles = {
                foreEdge: null,
                topEdge: null,
                bottomEdge: null
            };

            var win = new Window("dialog", SCRIPT_NAME + " - Pro Studio");
            win.orientation = "column";
            win.alignChildren = ["fill", "top"];
            win.spacing = 12;
            win.margins = 18;

            var pnlHeader = win.add("panel", undefined, "Dokument-Übersicht");
            pnlHeader.orientation = "row";
            pnlHeader.alignChildren = ["left", "center"];
            pnlHeader.add("statictext", undefined, "Seiten: " + totalPages + "  |  Format: " + docPageWidthMm.toFixed(1) + " x " + docPageHeightMm.toFixed(1) + " mm");

            var pnlSpecs = win.add("panel", undefined, "1. Buchblock-Geometrie & Parameter");
            pnlSpecs.orientation = "column";
            pnlSpecs.alignChildren = ["fill", "top"];
            pnlSpecs.spacing = 8;

            var grpRow1 = pnlSpecs.add("group");
            grpRow1.orientation = "row";
            grpRow1.spacing = 15;

            grpRow1.add("statictext", undefined, "Papierstärke (mm/Seite):");
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

            var pnlEdges = win.add("panel", undefined, "2. Schnittkanten & Bildeinbindung");
            pnlEdges.orientation = "column";
            pnlEdges.alignChildren = ["fill", "top"];
            pnlEdges.spacing = 10;

            var grpFore = pnlEdges.add("group");
            grpFore.orientation = "row";
            grpFore.spacing = 10;
            var chkFore = grpFore.add("checkbox", undefined, "Vorderschnitt");
            chkFore.value = true;
            chkFore.preferredSize.width = 120;
            var btnFore = grpFore.add("button", undefined, "Bild wählen...");
            var txtFore = grpFore.add("statictext", undefined, "Keine Datei", { truncate: "middle" });
            txtFore.preferredSize.width = 200;

            btnFore.onClick = function () {
                var f = File.openDialog("Quellbild für Vorderschnitt", "Bilder:*.jpg;*.jpeg;*.png;*.tif;*.tiff;*.psd;*.pdf;*.ai");
                if (f) {
                    imageFiles.foreEdge = f;
                    txtFore.text = f.displayName;
                }
            };

            var grpTop = pnlEdges.add("group");
            grpTop.orientation = "row";
            grpTop.spacing = 10;
            var chkTop = grpTop.add("checkbox", undefined, "Kopfschnitt (Oben)");
            chkTop.value = false;
            chkTop.preferredSize.width = 120;
            var btnTop = grpTop.add("button", undefined, "Bild wählen...");
            var txtTop = grpTop.add("statictext", undefined, "Keine Datei", { truncate: "middle" });
            txtTop.preferredSize.width = 200;

            btnTop.onClick = function () {
                var f = File.openDialog("Quellbild für Kopfschnitt", "Bilder:*.jpg;*.jpeg;*.png;*.tif;*.tiff;*.psd;*.pdf;*.ai");
                if (f) {
                    imageFiles.topEdge = f;
                    txtTop.text = f.displayName;
                }
            };

            var grpBottom = pnlEdges.add("group");
            grpBottom.orientation = "row";
            grpBottom.spacing = 10;
            var chkBottom = grpBottom.add("checkbox", undefined, "Fußschnitt (Unten)");
            chkBottom.value = false;
            chkBottom.preferredSize.width = 120;
            var btnBottom = grpBottom.add("button", undefined, "Bild wählen...");
            var txtBottom = grpBottom.add("statictext", undefined, "Keine Datei", { truncate: "middle" });
            txtBottom.preferredSize.width = 200;

            btnBottom.onClick = function () {
                var f = File.openDialog("Quellbild für Fußschnitt", "Bilder:*.jpg;*.jpeg;*.png;*.tif;*.tiff;*.psd;*.pdf;*.ai");
                if (f) {
                    imageFiles.bottomEdge = f;
                    txtBottom.text = f.displayName;
                }
            };

            var pnlTest = win.add("panel", undefined, "3. Genauigkeits-Prüfung");
            pnlTest.orientation = "column";
            pnlTest.alignChildren = ["left", "top"];
            var chkTestMode = pnlTest.add("checkbox", undefined, "Originalbild als 'FS_TEST' Ebene neben den Seiten anlegen");
            chkTestMode.value = false;

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
                        alert("Bitte wählen Sie ein Bild für den Vorderschnitt aus.", SCRIPT_NAME);
                        return;
                    }
                }
                if (chkTop.value) {
                    selectedCount++;
                    if (!imageFiles.topEdge) {
                        alert("Bitte wählen Sie ein Bild für den Kopfschnitt aus.", SCRIPT_NAME);
                        return;
                    }
                }
                if (chkBottom.value) {
                    selectedCount++;
                    if (!imageFiles.bottomEdge) {
                        alert("Bitte wählen Sie ein Bild für den Fußschnitt aus.", SCRIPT_NAME);
                        return;
                    }
                }

                if (selectedCount === 0) {
                    alert("Bitte wählen Sie mindestens eine Schnittkante aus.", SCRIPT_NAME);
                    return;
                }

                win.close(1);
            };

            if (win.show() !== 1) {
                return;
            }

            var paperThicknessMm = parseFloat(inpThickness.text) || defaultPaperThickness;
            var stripDepthMm = parseFloat(inpStripDepth.text) || defaultStripDepth;
            var bleedMm = parseFloat(inpBleed.text) || defaultBleed;
            var opacityVal = sldOpacity.value;
            var generateFsTestLayer = chkTestMode.value;

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

            // Expand pasteboard margins dynamically so graphic bounds never exceed pasteboard
            var maxRequiredMarginPt = (totalPages * FarbschnittMath.mmToPt(stripDepthMm + bleedMm)) + 500;
            try {
                doc.pasteboardPreferences.pasteboardMargins = [maxRequiredMarginPt, maxRequiredMarginPt];
            } catch (pErr) {
                // Ignore if document locks pasteboard margins
            }

            app.doScript(function () {
                executeFarbschnitt({
                    doc: doc,
                    paperThickness: FarbschnittMath.mmToPt(paperThicknessMm),
                    stripDepth: FarbschnittMath.mmToPt(stripDepthMm),
                    bleed: FarbschnittMath.mmToPt(bleedMm),
                    opacity: opacityVal,
                    edgeConfigs: activeEdgeConfigs,
                    generateFsTestLayer: generateFsTestLayer
                });
            }, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Farbschnitt Generieren");

            alert("Farbschnitt wurde erfolgreich auf " + totalPages + " Seiten angewendet!", SCRIPT_NAME);

        } finally {
            try {
                doc.pasteboardPreferences.pasteboardMargins = origPasteboardMargins;
            } catch (e1) {}
            try {
                doc.viewPreferences.horizontalMeasurementUnits = origHUnits;
                doc.viewPreferences.verticalMeasurementUnits = origVUnits;
                doc.viewPreferences.rulerOrigin = origOrigin;
            } catch (e2) {}
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
        var generateFsTestLayer = params.generateFsTestLayer;

        var targetLayer = doc.layers.itemByName(LAYER_NAME);
        if (targetLayer.isValid) {
            targetLayer.pageItems.everyItem().remove();
        } else {
            targetLayer = doc.layers.add({ name: LAYER_NAME });
        }
        targetLayer.move(LocationOptions.AT_BEGINNING);

        var testLayer = doc.layers.itemByName(FS_TEST_LAYER_NAME);
        if (testLayer.isValid) {
            testLayer.pageItems.everyItem().remove();
        }
        if (generateFsTestLayer) {
            if (!testLayer.isValid) {
                testLayer = doc.layers.add({ name: FS_TEST_LAYER_NAME });
            }
            testLayer.move(LocationOptions.AT_BEGINNING);
        }

        var noneSwatch = doc.swatches.item(0);
        var totalPages = doc.pages.length;

        var primaryTestFile = edgeConfigs.length > 0 ? edgeConfigs[0].file : null;

        // Iterate through each page
        for (var i = 0; i < totalPages; i++) {
            var page = doc.pages[i];

            var isVerso = (page.side === PageSideOptions.LEFT_HAND);
            if (page.side === PageSideOptions.SINGLE_SIDED) {
                isVerso = (i % 2 === 1);
            }

            var pBounds = page.bounds; // [top, left, bottom, right]
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
                    edge: edge
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

                    // Assign graphic bounds first
                    graphic.geometricBounds = sliceRes.graphicBounds;

                    // Rotate using transformation matrix centered on image
                    if (sliceRes.rotation !== 0) {
                        try {
                            var xform = app.transformationMatrices.add({ counterclockwiseRotationAngle: sliceRes.rotation });
                            graphic.transform(CoordinateSpaces.PARENTSPACE, AnchorPoint.CENTER_ANCHOR, xform);
                        } catch (rErr) {
                            graphic.rotationAngle = sliceRes.rotation;
                        }
                    }
                }

                if (opacityVal < 100) {
                    rect.transparencySettings.blendingSettings.opacity = opacityVal;
                }
            }

            // Place single original reference image on "FS_TEST" layer once per page
            if (generateFsTestLayer && primaryTestFile) {
                var testOffset = 20;
                var testWidth = 150;
                var testFrameBounds;

                if (isVerso) {
                    testFrameBounds = [
                        -bleedPt,
                        -bleedPt - testOffset - testWidth,
                        pHeight + bleedPt,
                        -bleedPt - testOffset
                    ];
                } else {
                    testFrameBounds = [
                        -bleedPt,
                        pWidth + bleedPt + testOffset,
                        pHeight + bleedPt,
                        pWidth + bleedPt + testOffset + testWidth
                    ];
                }

                var testRect = page.rectangles.add(testLayer, {
                    strokeWeight: 0.5,
                    strokeColor: doc.swatches.itemByName("Black") || noneSwatch,
                    fillColor: noneSwatch
                });

                testRect.geometricBounds = testFrameBounds;
                testRect.place(primaryTestFile);

                if (testRect.graphics.length > 0) {
                    testRect.graphics[0].fit(FitOptions.PROPORTIONALLY);
                }
            }
        }
    }

    // Run script
    main();

})(this);

/**
 * Farbschnitt.jsx - Professional Adobe InDesign Script
 *
 * Digital book edge printing (Farbschnitt) ExtendScript.
 * Supports Fore-edge (Vorderschnitt / long side), Top-edge (Kopfschnitt), and Bottom-edge (Fußschnitt).
 *
 * - Locks ruler origin to PAGE_ORIGIN and measurement units to MILLIMETERS during execution.
 * - Fore-edge: Stretches image horizontally across page count N.
 * - Top-edge & Bottom-edge: Stretches image vertically across page count N.
 * - Spine protection: Top and bottom edges stay within page width boundaries (no overlap across spine).
 * - Safe pasteboard expansion preventing Error 54.
 *
 * @author Agency Quality Software Engineering
 * @version 9.0.0
 */

#target indesign
#targetengine "FarbschnittEngine"

(function (global) {
    'use strict';

    var LAYER_NAME = "Farbschnitt";
    var SCRIPT_NAME = "Digitaler Farbschnitt Generator";

    if (typeof app === 'undefined' || !app.documents) {
        return;
    }

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

        // Temporarily set millimeter units for UI representation
        var origHUnitsUI = doc.viewPreferences.horizontalMeasurementUnits;
        var origVUnitsUI = doc.viewPreferences.verticalMeasurementUnits;
        doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
        doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.MILLIMETERS;

        var page1 = doc.pages[0];
        var bounds = page1.bounds; // [top, left, bottom, right] in mm
        var docPageWidthMm = bounds[3] - bounds[1];
        var docPageHeightMm = bounds[2] - bounds[0];

        // Restore UI units
        doc.viewPreferences.horizontalMeasurementUnits = origHUnitsUI;
        doc.viewPreferences.verticalMeasurementUnits = origVUnitsUI;

        var defaultPaperThickness = 0.1;
        var defaultStripDepth = 3.0;
        var defaultBleed = 3.0;
        var defaultOpacity = 100;

        var imageFiles = {
            foreEdge: null,
            topEdge: null,
            bottomEdge: null
        };

        // ScriptUI Dialog Setup
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
        var chkFore = grpFore.add("checkbox", undefined, "Vorderschnitt (Lange Seite)");
        chkFore.value = true;
        chkFore.preferredSize.width = 170;
        var btnFore = grpFore.add("button", undefined, "Bild wählen...");
        var txtFore = grpFore.add("statictext", undefined, "Keine Datei", { truncate: "middle" });
        txtFore.preferredSize.width = 160;

        btnFore.onClick = function () {
            var f = File.openDialog("Quellbild für Vorderschnitt");
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
        chkTop.preferredSize.width = 170;
        var btnTop = grpTop.add("button", undefined, "Bild wählen...");
        var txtTop = grpTop.add("statictext", undefined, "Keine Datei", { truncate: "middle" });
        txtTop.preferredSize.width = 160;

        btnTop.onClick = function () {
            var f = File.openDialog("Quellbild für Kopfschnitt");
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
        chkBottom.preferredSize.width = 170;
        var btnBottom = grpBottom.add("button", undefined, "Bild wählen...");
        var txtBottom = grpBottom.add("statictext", undefined, "Keine Datei", { truncate: "middle" });
        txtBottom.preferredSize.width = 160;

        btnBottom.onClick = function () {
            var f = File.openDialog("Quellbild für Fußschnitt");
            if (f) {
                imageFiles.bottomEdge = f;
                txtBottom.text = f.displayName;
            }
        };

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

        // Save original document preferences
        var origRuler = doc.viewPreferences.rulerOrigin;
        var origHUnits = doc.viewPreferences.horizontalMeasurementUnits;
        var origVUnits = doc.viewPreferences.verticalMeasurementUnits;
        var origPasteboardMargins = doc.pasteboardPreferences.pasteboardMargins;

        var requiredMarginMm = Math.max(5000, (totalPages * (stripDepthMm + bleedMm)) + 1000);

        try {
            // Lock units to Millimeters and PAGE_ORIGIN
            doc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;
            doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
            doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.MILLIMETERS;

            try {
                doc.pasteboardPreferences.pasteboardMargins = [requiredMarginMm + "mm", requiredMarginMm + "mm"];
            } catch (pErr) {
                // Ignore if pasteboard locked
            }

            app.doScript(function () {
                executeFarbschnitt({
                    doc: doc,
                    stripDepth: stripDepthMm,
                    bleed: bleedMm,
                    opacity: opacityVal,
                    edgeConfigs: activeEdgeConfigs
                });
            }, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Farbschnitt Generieren");

            alert("Farbschnitt wurde erfolgreich auf " + totalPages + " Seiten angewendet!", SCRIPT_NAME);

        } catch (err) {
            alert("Fehler bei der Ausführung: " + err.message, SCRIPT_NAME);
        } finally {
            // Cleanly restore all document preferences
            try {
                doc.viewPreferences.rulerOrigin = origRuler;
                doc.viewPreferences.horizontalMeasurementUnits = origHUnits;
                doc.viewPreferences.verticalMeasurementUnits = origVUnits;
                doc.pasteboardPreferences.pasteboardMargins = origPasteboardMargins;
            } catch (restoreErr) {}
        }
    }

    // ==========================================
    // INDESIGN PLACEMENT & LAYER ENGINE
    // ==========================================
    function executeFarbschnitt(params) {
        var doc = params.doc;
        var stripDepth = params.stripDepth; // in mm
        var bleed = params.bleed;           // in mm
        var opacityVal = params.opacity;
        var edgeConfigs = params.edgeConfigs;

        var targetLayer = doc.layers.itemByName(LAYER_NAME);
        if (targetLayer.isValid) {
            targetLayer.pageItems.everyItem().remove();
        } else {
            targetLayer = doc.layers.add({ name: LAYER_NAME });
        }
        targetLayer.move(LocationOptions.AT_BEGINNING);

        var noneSwatch = doc.swatches.item(0);
        var totalPages = doc.pages.length;

        for (var i = 0; i < totalPages; i++) {
            var page = doc.pages[i];

            var isVerso = (page.side === PageSideOptions.LEFT_HAND);
            if (page.side === PageSideOptions.SINGLE_SIDED) {
                isVerso = (i % 2 === 1);
            }

            var bounds = page.bounds; // [top, left, bottom, right] in mm (PAGE_ORIGIN: top=0, left=0)
            var pHeight = bounds[2] - bounds[0];
            var pWidth = bounds[3] - bounds[1];

            for (var c = 0; c < edgeConfigs.length; c++) {
                var config = edgeConfigs[c];
                var edge = config.edge;
                var imageFile = config.file;

                var fTop, fLeft, fBottom, fRight;
                var gTop, gLeft, gBottom, gRight;

                if (edge === 'foreEdge') {
                    // Long side / Vorderschnitt - horizontal stretching across X-axis
                    fTop = -bleed;
                    fBottom = pHeight + bleed;

                    if (isVerso) {
                        fLeft = -bleed;
                        fRight = stripDepth;
                    } else {
                        fLeft = pWidth - stripDepth;
                        fRight = pWidth + bleed;
                    }

                    var fWidth = fRight - fLeft;
                    var totalGWidth = fWidth * totalPages;
                    gLeft = fLeft - (i * fWidth);
                    gRight = gLeft + totalGWidth;
                    gTop = fTop;
                    gBottom = fBottom;

                } else if (edge === 'topEdge') {
                    // Top edge / Kopfschnitt - vertical stretching across Y-axis
                    fTop = -bleed;
                    fBottom = stripDepth;

                    if (isVerso) {
                        fLeft = -bleed;
                        fRight = pWidth; // Stops at spine
                    } else {
                        fLeft = 0;      // Starts at spine
                        fRight = pWidth + bleed;
                    }

                    var fHeight = fBottom - fTop;
                    var totalGHeight = fHeight * totalPages;
                    gTop = fTop - (i * fHeight);
                    gBottom = gTop + totalGHeight;
                    gLeft = fLeft;
                    gRight = fRight;

                } else if (edge === 'bottomEdge') {
                    // Bottom edge / Fußschnitt - vertical stretching across Y-axis
                    fTop = pHeight - stripDepth;
                    fBottom = pHeight + bleed;

                    if (isVerso) {
                        fLeft = -bleed;
                        fRight = pWidth; // Stops at spine
                    } else {
                        fLeft = 0;      // Starts at spine
                        fRight = pWidth + bleed;
                    }

                    var fHeight = fBottom - fTop;
                    var totalGHeight = fHeight * totalPages;
                    gTop = fTop - (i * fHeight);
                    gBottom = gTop + totalGHeight;
                    gLeft = fLeft;
                    gRight = fRight;
                }

                var rect = page.rectangles.add({
                    itemLayer: targetLayer,
                    strokeWeight: 0,
                    strokeColor: noneSwatch,
                    fillColor: noneSwatch
                });

                rect.geometricBounds = [fTop, fLeft, fBottom, fRight];
                rect.place(imageFile);

                if (rect.graphics.length > 0) {
                    var graphic = rect.graphics[0];
                    graphic.geometricBounds = [gTop, gLeft, gBottom, gRight];
                }

                if (opacityVal < 100) {
                    rect.transparencySettings.blendingSettings.opacity = opacityVal;
                }
            }
        }
    }

    main();

})(this);

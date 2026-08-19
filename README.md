# Digitaler Farbschnitt Generator für Adobe InDesign (`Farbschnitt.jsx`)

Ein professionelles Adobe InDesign Script (ExtendScript) für die automatisierte Erstellung von digitalem Farbschnitt auf Buchseiten mit moderner ScriptUI-Oberfläche.

---

## 📖 Inhaltsverzeichnis
1. [Funktionsumfang](#funktionsumfang)
2. [Installation in Adobe InDesign](#installation-in-adobe-indesign)
3. [Bedienungsanleitung & Workflow](#bedienungsanleitung--workflow)
4. [Schnittkanten & Bund-Schutz (Spine Protection)](#schnittkanten--bund-schutz-spine-protection)
5. [Mathematik & Funktionsweise](#mathematik--funktionsweise)

---

## ✨ Funktionsumfang

- **Plug-and-Play ScriptUI:** Einfache Handhabung direkt in Adobe InDesign.
- **Separate Bildauswahl pro Schnittkante:** Laden Sie für Vorderschnitt, Kopfschnitt und Fußschnitt jeweils eigene Quellbilder.
- **Präzise Geometrie-Berechnung:** Berechnet Bildausschnitte direkt über seitenbezogene Koordinaten ohne skalierungsbedingte Pasteboard-Fehler.
- **Bund-Schutz (Spine / Gutter Protection):** Bei Kopf- und Fußschnitt ragt die Farbleiste niemals über den Buchbund (Mitte bei Doppelseiten) hinaus.
- **Sichere Maßeinheiten:** Verwendet native `UnitValue`-Konvertierung unter Beibehaltung der aktiven Dokumenten-Lineale.
- **Doppelseiten-Logik (Facing Pages / Verso & Recto):** Exakte Berechnung der Außenkanten bei linken und rechten Seiten.
- **Einstellbare Parameter:**
  - Papierstärke / Seitendicke (mm/Seite)
  - Farbschnitt-Tiefe (mm)
  - Beschnittzugabe / Bleed (mm)
  - Deckkraft / Transparenz (0–100 %)
- **Ebenen-Management:** Automatische Zuordnung auf die Ebene `"Farbschnitt"`.
- **Ein-Schritt-Undo:** Die gesamte Berechnung lässt sich mit einem Klick (`Strg+Z` / `Cmd+Z`) rückgängig machen.

---

## 🚀 Installation in Adobe InDesign

1. Speichern Sie `Farbschnitt.jsx` auf Ihrem Computer.
2. Öffnen Sie Adobe InDesign.
3. Öffnen Sie das Bedienteil **Skripte**: `Fenster` ➔ `Hilfsmittel` ➔ `Skripte` (`Alt + Cmd + F11` / `Strg + Alt + F11`).
4. Machen Sie einen Rechtsklick auf den Ordner **Benutzer** und wählen Sie **Im Finder anzeigen** (macOS) bzw. **Im Explorer anzeigen** (Windows).
5. Kopieren Sie `Farbschnitt.jsx` in den Ordner `Scripts Panel`.

---

## 💻 Bedienungsanleitung & Workflow

1. Öffnen Sie Ihr Buchdokument in InDesign.
2. Doppelklicken Sie im Skripte-Bedienfeld auf `Farbschnitt.jsx`.
3. Geben Sie die Papierstärke ein (z. B. `0,1 mm`).
4. Wählen Sie die gewünschten Schnittkanten aus und laden Sie für jede ausgewählte Kante das passende Quellbild (JPG, PNG, TIFF, PSD, PDF, AI).
5. Klicken Sie auf **„Farbschnitt generieren“**.

---

## 🛡 Schnittkanten & Bund-Schutz (Spine Protection)

Bei Doppelseiten schützt das Script den Buchbund:
- **Linke Seite (Verso):** Der Farbschnitt erstreckt sich von der linken Außenkante bis zur rechten Seitenkante (Bund) und geht nicht darüber hinaus.
- **Rechte Seite (Recto):** Der Farbschnitt beginnt genau am Bund (linke Kante) und erstreckt sich bis zur rechten Außenkante inklusive Beschnittzugabe.

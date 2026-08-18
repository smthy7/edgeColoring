# Digitaler Farbschnitt Generator für Adobe InDesign (`Farbschnitt.jsx`)

Ein professionelles Adobe InDesign Script (ExtendScript) für die automatisierte Erstellung von digitalem Farbschnitt auf Buchseiten mit moderner ScriptUI-Oberfläche.

---

## 📖 Inhaltsverzeichnis
1. [Neue Features in v2.0](#neue-features-in-v20)
2. [Funktionsumfang](#funktionsumfang)
3. [Installation in Adobe InDesign](#installation-in-adobe-indesign)
4. [Bedienungsanleitung & Workflow](#bedienungsanleitung--workflow)
5. [Schnittkanten & Bund-Schutz (Spine Protection)](#schnittkanten--bund-schutz-spine-protection)
6. [Genauigkeits-Prüfung (Test-Referenz-Modus)](#genauigkeits-prüfung-test-referenz-modus)
7. [Mathematik & Funktionsweise](#mathematik--funktionsweise)

---

## 🌟 Neue Features in v2.0

- **Neues, cleanes UI-Design:** Übersichtlichere Eingabe ohne überflüssige Vorschau-Kontrollen.
- **Separate Bildauswahl pro Schnittkante:** Sie können für Vorderschnitt, Kopfschnitt und Fußschnitt jeweils eigene Quellbilder laden.
- **Automatische Bildrotation:** Kopfschnitt (90°) und Fußschnitt (270°) werden für die jeweilige Kante automatisch im richtigen Winkel gedreht.
- **Bund-Schutz (Spine / Gutter Protection):** Bei Kopf- und Fußschnitt ragt die Farbleiste niemals über den Buchbund (Mitte bei Doppelseiten) hinaus. Rechte Seiten schneiden links am Bund ab, linke Seiten rechts.
- **Test-Referenz-Modus:** Optionale Checkbox, um neben jeder Buchseite einen Test-Kontrollstreifen anzulegen, mit dem Sie die Exaktheit der Pixelberechnung überprüfen können.

---

## ✨ Funktionsumfang

- **Plug-and-Play ScriptUI:** Einfache Handhabung direkt in Adobe InDesign.
- **Mehrfach-Schnittkanten:** **Vorderschnitt (Fore-Edge)**, **Kopfschnitt (Top)** und **Fußschnitt (Bottom)** gleichzeitig wählbar.
- **Doppelseiten-Logik (Facing Pages / Verso & Recto):** Exakte Berechnung der Außenkanten bei linken und rechten Seiten.
- **Einstellbare Parameter:**
  - Papierstärke / Seitendicke (mm/Seite)
  - Farbschnitt-Tiefe (mm)
  - Beschnittzugabe / Bleed (mm)
  - Deckkraft / Transparenz (0–100 %)
- **Ebenen-Management:** Automatische Zuordnung auf die Ebene `"Farbschnitt"` (sowie `"Farbschnitt_Test_Verification"` im Testmodus).
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
5. Aktivieren Sie bei Bedarf die Checkbox **„Test-Referenzstreifen neben jeder Seite anlegen“**.
6. Klicken Sie auf **„Farbschnitt generieren“**.

---

## 🛡 Schnittkanten & Bund-Schutz (Spine Protection)

Bei Doppelseiten schützt das Script den Buchbund:
- **Linke Seite (Verso):** Der Farbschnitt erstreckt sich von der linken Außenkante bis zur rechten Seitenkante (Bund) und geht nicht darüber hinaus.
- **Rechte Seite (Recto):** Der Farbschnitt beginnt genau am Bund (linke Kante) und erstreckt sich bis zur rechten Außenkante inklusive Beschnittzugabe.

---

## 🔍 Genauigkeits-Prüfung (Test-Referenz-Modus)

Wenn Sie die Test-Checkbox aktivieren, platziert das Script auf einer eigenen Ebene (`Farbschnitt_Test_Verification`) direkt neben dem Anschnitt der Seite einen Referenzstreifen des berechneten Ausschnitts. Dadurch können Sie direkt im Dokument prüfen, ob die Pixel-Zuordnung und der Motivverlauf exakt übereinstimmen.

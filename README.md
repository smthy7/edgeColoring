# Digitaler Farbschnitt Generator für Adobe InDesign (`Farbschnitt.jsx`)

Ein professionelles Adobe InDesign Script (ExtendScript), mit dem ein digitaler Farbschnitt / Buchen-Muster automatisch auf die Seiten eines Buches aufgeteilt und präzise platziert wird.

---

## 📖 Inhaltsverzeichnis
1. [Funktionsumfang](#funktionsumfang)
2. [Installation in Adobe InDesign](#installation-in-adobe-indesign)
3. [Bedienungsanleitung & Workflow](#bedienungsanleitung--workflow)
4. [Mathematik & Funktionsweise](#mathematik--funktionsweise)
5. [Tipps & Fehlerbehebung](#tipps--fehlerbehebung)

---

## ✨ Funktionsumfang

- **Plug-and-Play ScriptUI Benutzeroberfläche:** Komfortabler Dialog direkt in InDesign.
- **Interaktiver Live-Preview Editor:** Quellbild direkt im Script-UI verschieben (Pan X/Y), zoomen (Zoom +/-) und einpassen.
- **Mehrfach-Schnittkanten:** Unterstützung für **Vorderschnitt (Fore-Edge)**, **Kopfschnitt (Top)** und **Fußschnitt (Bottom)** (auch gleichzeitig).
- **Doppelseiten-Logik (Facing Pages / Verso & Recto):** Automatische Erkennung von linken und rechten Seiten (Außenkante wird exakt berechnet).
- **Flexibel einstellbare Parameter:**
  - Papierstärke / Seitendicke (in mm/Seite)
  - Farbschnitt-Tiefe (in mm in das Dokument hinein)
  - Beschnittzugabe / Bleed (in mm)
  - Deckkraft / Transparenz (0–100 %)
- **Sauberes Ebenen-Management:** Alle Farbschnitt-Elemente werden automatisch auf einer separaten InDesign-Ebene (`"Farbschnitt"`) angelegt und können jederzeit ausblendbar oder mit einem Klick neu berechnet werden.
- **Rückgängig-Sicherheit:** Die gesamte Farbschnitt-Generierung lässt sich über eine einzige `Strg+Z` / `Cmd+Z` Aktion rückgängig machen (`UndoModes.ENTIRE_SCRIPT`).

---

## 🚀 Installation in Adobe InDesign

1. **Datei speichern:**
   Kopieren Sie die Datei `Farbschnitt.jsx` auf Ihren Computer.

2. **InDesign Script-Ordner öffnen:**
   - Öffnen Sie **Adobe InDesign**.
   - Öffnen Sie das Bedienteil **Skripte** über das Menü: `Fenster` ➔ `Hilfsmittel` ➔ `Skripte` (oder `Alt + Cmd + F11` / `Strg + Alt + F11`).
   - Erweitern Sie den Ordner **Benutzer** (User).
   - Machen Sie einen Rechtsklick auf den Ordner **Benutzer** und wählen Sie **Im Finder anzeigen** (macOS) bzw. **Im Explorer anzeigen** (Windows).

3. **Script einfügen:**
   - Kopieren Sie die Datei `Farbschnitt.jsx` in den geöffneten Ordner `Scripts Panel`.

---

## 💻 Bedienungsanleitung & Workflow

1. **Dokument vorbereiten:**
   - Öffnen Sie Ihr gewünschtes Buch-Dokument in InDesign.

2. **Script starten:**
   - Doppelklicken Sie im InDesign-Skripte-Bedienfeld auf `Farbschnitt.jsx`.

3. **Einstellungen im Dialogfenster vornehmen:**
   - **1. Quellbild auswählen:** Klicken Sie auf *„Bild auswählen...“* und wählen Sie Ihre Grafik (JPG, PNG, TIFF, PSD, PDF, AI).
   - **2. Buchblock & Papierstärke:** Geben Sie die Stärke einer einzelnen Seite in mm ein (Standard: `0,1 mm`). Das Script berechnet automatisch die Gesamtdicke des Buchblocks.
   - **3. Farbschnitt-Spezifikation:**
     - **Farbschnitt-Tiefe (mm):** Wie weit das Motiv in die Seite hineinreichen soll (Standard: `3,0 mm`).
     - **Beschnittzugabe Bleed (mm):** Überstand für den Anschnitt zur Vermeidung weißer Blitzer beim Beschneiden (Standard: `3,0 mm`).
     - **Deckkraft (%):** Deckkraft der Farbschnitt-Grafik auf der Seite.
   - **4. Schnittkanten:** Wählen Sie aus, an welchen Kanten der Farbschnitt platziert werden soll (z. B. Vorderschnitt, Kopfschnitt, Fußschnitt).
   - **5. Live-Editor / Positionierung:**
     - Nutzen Sie die Pfeiltasten `◄` `►` `▲` `▼` sowie `Zoom +` / `Zoom -` oder `Einpassen`, um das Motiv über den Buchblock auszurichten.

4. **Farbschnitt generieren:**
   - Klicken Sie auf **„Farbschnitt generieren“**. Das Script verteilt die Bildstreifen automatisch auf alle Seiten Ihres Dokuments.

---

## 🧮 Mathematik & Funktionsweise

Das Script nutzt die Geometrie des Buchblocks:
$$\text{Gesamtdicke des Buchblocks} = \text{Seitenanzahl} \times \text{Papierstärke}$$

Für jede Seite $i$ ($0$ bis $N-1$) wird der exakte vertikale Bildelement-Ausschnitt berechnet und in ein Rechteck an der entsprechenden Buchaußenkante platziert. Bei linken Seiten (Verso) liegt die Außenkante links, bei rechten Seiten (Recto) rechts.

---

## 🔧 Tipps & Fehlerbehebung

- **Erneutes Ausführen / Aktualisieren:**
  Wenn Sie den Farbschnitt ändern möchten, führen Sie das Script einfach erneut aus. Die bestehende Ebene `"Farbschnitt"` wird automatisch bereinigt und neu aufgebaut.
- **Farbschnitt ausblenden:**
  Sie können die Ebene `"Farbschnitt"` im InDesign-Ebenen-Bedienfeld jederzeit mit dem Augensymbol ausblenden oder sperren.

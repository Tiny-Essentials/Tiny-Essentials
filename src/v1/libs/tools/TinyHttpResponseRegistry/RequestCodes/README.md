# HTTP Status Codes Data (JSON)

This directory contains the JSON data file used by the application to display HTTP response status codes and error messages.

## Licensing & Compliance

The architecture of this project maintains a strict separation between the software logic (source code) and the reference data (JSON content in index.mjs) to ensure license compliance:

* **Source Code:** The application code that reads and processes this JSON is licensed under the **GNU Lesser General Public License v3.0 (LGPL v3)**.
* **Data Content:** The JSON file itself contains documentation text extracted from [MDN Web Docs](https://mozilla.org) and is licensed under the **Creative Commons Attribution-ShareAlike 2.5 Generic (CC-BY-SA-2.5)**.

### ShareAlike & LGPL Compliance

According to both the LGPL v3 and CC-BY-SA-2.5 guidelines, this implementation qualifies as **Mere Aggregation** (or a Collective Work). 
* The LGPL v3 software operates as an independent work that dynamically reads data at runtime. It does not form a derivative work of the CC-BY-SA text.
* The CC-BY-SA-2.5 *ShareAlike* clause applies **strictly and exclusively** to the JSON file and any direct modifications made to its text content. It does not extend to or affect the LGPL v3 source code.

## Attribution

Portions of the text content inside the JSON file are derived from [MDN Web Docs](https://mozilla.org) by individual mozilla.org contributors.

* **Original Source:** [MDN HTTP Response Status Codes Reference](https://mozilla.org)
* **Copyright:** © 1998-2026 by individual mozilla.org contributors.
* **Data License:** [Creative Commons Attribution-ShareAlike 2.5 Generic (CC-BY-SA-2.5)](https://creativecommons.org)

## Modifications

If you modify, translate, or expand the text contents *inside* the JSON data, you **must** release those data modifications under the same **CC-BY-SA-2.5** license and retain this attribution notice.

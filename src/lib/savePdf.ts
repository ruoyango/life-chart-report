// Client-side PDF export of the report — builds the PDF in-browser (no print
// dialog) and offers a save-location picker. Each section is captured on its own
// page; a section taller than a page is split only at sub-card boundaries so no
// card is cut in half. Heavy libs are imported lazily.

type SaveFilePicker = (opts: {
  suggestedName?: string;
  types?: { description?: string; accept: Record<string, string[]> }[];
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

// Write via the File System Access API (Chrome/Edge → a "where to save" dialog)
// when available, otherwise fall back to a normal download.
async function saveBlob(blob: Blob, filename: string) {
  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  if (typeof picker === "function") {
    try {
      const handle = await picker({
        suggestedName: filename,
        types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return; // user cancelled the dialog
      // any other failure → fall through to a normal download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function saveReportPdf(root: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const capture = (el: HTMLElement) =>
    html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      onclone: (doc: Document) => {
        // Drop anything hidden in print (the save + AI generate buttons) and the
        // calendar icon / hidden date overlay.
        doc.querySelectorAll(".print\\:hidden, [data-no-export]").forEach((n) => n.remove());
        // The title is gradient-clipped transparent text → force a solid colour.
        doc.querySelectorAll<HTMLElement>(".title").forEach((n) => {
          n.style.background = "none";
          n.style.color = "#b45309";
          n.style.webkitTextFillColor = "#b45309";
        });
        // html2canvas clips <input>/<select> text vertically — render the values
        // as plain text (no border / box) instead.
        const asText = (value: string) => {
          const div = doc.createElement("div");
          div.textContent = value;
          div.style.padding = "0.25rem 0";
          div.style.minHeight = "1.5rem";
          div.style.fontSize = "1rem";
          div.style.lineHeight = "1.5";
          div.style.fontWeight = "500";
          div.style.color = "#18181b";
          return div;
        };
        doc.querySelectorAll("input").forEach((el) => {
          const inp = el as HTMLInputElement;
          inp.replaceWith(asText(inp.value));
        });
        doc.querySelectorAll("select").forEach((el) => {
          const sel = el as HTMLSelectElement;
          sel.replaceWith(asText(sel.options[sel.selectedIndex]?.text ?? ""));
        });
      },
    });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const margin = 24;
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;
  const contentBottom = pageH - margin;
  let y = margin;
  let pageStarted = false; // is there already content on the current page?

  const newPage = () => {
    pdf.addPage();
    y = margin;
    pageStarted = false;
  };

  // Draw a vertical slice [srcY, srcY+hPx) of `canvas` onto the page at the
  // current y, scaled to the content width.
  const drawSlice = (canvas: HTMLCanvasElement, srcY: number, hPx: number, ptPerC: number) => {
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = Math.max(1, Math.round(hPx));
    const ctx = slice.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, srcY, canvas.width, hPx, 0, 0, canvas.width, hPx);
    pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", margin, y, contentW, hPx * ptPerC, undefined, "FAST");
    y += hPx * ptPerC;
    pageStarted = true;
  };

  const blockGap = 16; // spacing between consecutive blocks on a page (pt)

  // Flow a block into the running layout: it fills the remaining space, and only
  // pushes to a new page when an atomic block (sub-card or the section header)
  // would otherwise be cut across the page boundary.
  const place = async (el: HTMLElement) => {
    const canvas = await capture(el);
    if (!canvas.height || !canvas.width) return;
    const rect = el.getBoundingClientRect();
    const cPerDom = canvas.height / rect.height; // canvas px per DOM px
    const ptPerC = contentW / canvas.width; // pt per canvas px

    // No-cut zones (canvas px): atomic blocks that must not be split across pages.
    const zones = Array.from(el.querySelectorAll(".subcard, .grid > *, li")).map((c) => {
      const r = c.getBoundingClientRect();
      return { top: (r.top - rect.top) * cPerDom, bottom: (r.bottom - rect.top) * cPerDom };
    });
    if (zones.length === 0) {
      // No inner blocks → keep the whole section together (don't split it).
      zones.push({ top: 0, bottom: canvas.height });
    } else {
      // Keep the section header attached to its first block (no orphaned title).
      zones.push({ top: 0, bottom: Math.min(...zones.map((z) => z.top)) });
    }

    // Largest break ≤ limit that doesn't fall inside a zone (may be ≤ 0 → caller
    // moves the block to a fresh page).
    const safeBreak = (limit: number) => {
      let yb = limit;
      let changed = true;
      while (changed) {
        changed = false;
        for (const z of zones) {
          if (z.top < yb && yb < z.bottom) {
            yb = z.top;
            changed = true;
          }
        }
      }
      return yb;
    };

    if (pageStarted) y += blockGap;

    let srcY = 0;
    while (srcY < canvas.height) {
      const availPx = (contentBottom - y) / ptPerC;
      const remaining = canvas.height - srcY;
      let sliceH = Math.min(availPx, remaining);
      if (sliceH < remaining) {
        // More content follows → pull the break back so no block is cut.
        sliceH = safeBreak(srcY + sliceH) - srcY;
        if (sliceH <= 0) {
          if (pageStarted) {
            newPage(); // nothing fits here → try the block on a fresh page
            continue;
          }
          sliceH = Math.min(availPx, remaining); // block taller than a page → hard cut
        }
      }
      drawSlice(canvas, srcY, sliceH, ptPerC);
      srcY += sliceH;
      if (srcY < canvas.height) newPage();
    }
  };

  // Flow the header then every section continuously; breaks happen only where a
  // block would be cut.
  const header = root.querySelector("header");
  if (header) await place(header as HTMLElement);
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[id^="sec-"]'));
  for (const sec of sections) await place(sec);

  await saveBlob(pdf.output("blob"), filename);
}

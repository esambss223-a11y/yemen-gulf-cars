// Kept independent of dashboard utilities; shared by preview and printed document.
export const CONTRACT_DOCUMENT_STYLES = `
.rental-document { width:100%; margin:0; color:#182c3d; background:#fff; font-family:inherit; font-size:9pt; line-height:1.65; direction:rtl; text-align:right; }
.rental-document *, .rental-document *::before, .rental-document *::after { box-sizing:border-box; }
.rental-document h1,.rental-document h2,.rental-document h3,.rental-document p,.rental-document dl,.rental-document dd { margin:0; }
.rental-document .rd-brand { display:flex; gap:12px; align-items:center; border-bottom:2px solid #b99352; padding-bottom:10px; margin-bottom:10px; break-inside:avoid; }
.rental-document .rd-brand img { width:58px; height:64px; object-fit:contain; flex-shrink:0; }
.rental-document .rd-brand-name { flex:1; min-width:0; }
.rental-document .rd-brand-name h1 { font-size:14pt; line-height:1.5; font-weight:800; }
.rental-document .rd-brand-name p { font-size:8pt; color:#52616d; line-height:1.8; }
.rental-document .rd-reference { width:148px; padding-right:12px; border-right:1px solid #d9c59f; font-size:8pt; flex-shrink:0; overflow-wrap:anywhere; }
.rental-document .rd-reference strong { font-size:11pt; display:block; color:#182c3d; }
.rental-document .rd-title { text-align:center; background:#f1f4f6; border:1px solid #dce2e7; padding:6px 10px; border-radius:5px; font-size:11pt; margin-bottom:11px; }
.rental-document .rd-section { border:1px solid #d4dce3; border-radius:5px; margin-bottom:10px; break-inside:avoid; }
.rental-document .rd-section > h3 { padding:5px 9px; font-size:9pt; background:#f1f4f6; border-bottom:1px solid #d4dce3; }
.rental-document .rd-facts { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px 13px; padding:9px 11px; }
.rental-document .rd-facts dt { font-size:7.8pt; color:#52616d; }
.rental-document .rd-facts dd { font-size:9pt; font-weight:700; overflow-wrap:anywhere; min-width:0; }
.rental-document .rd-facts .is-wide { grid-column:span 2; }
.rental-document .rd-section table { border-collapse:collapse; width:100%; table-layout:fixed; font-size:8.5pt; }
.rental-document .rd-section th, .rental-document .rd-section td { padding:6px 9px; border-bottom:1px solid #e1e6ea; text-align:right; vertical-align:top; overflow-wrap:anywhere; }
.rental-document .rd-section thead { display:table-header-group; }
.rental-document .rd-section th { color:#52616d; font-size:7.8pt; font-weight:700; }
.rental-document .rd-section th:first-child { width:46%; }
.rental-document .rd-section th:last-child { width:22%; }
.rental-document .rd-section tr { break-inside:avoid; }
.rental-document .rd-section td:last-child, .rental-document .rd-section th:last-child { text-align:left; }
.rental-document .rd-total { font-weight:800; background:#f1f4f6; }
.rental-document .rd-deposit { padding:8px 10px; border-top:1px solid #d4dce3; display:flex; align-items:start; gap:15px; background:#faf7f0; }
.rental-document .rd-deposit > div { flex:1; }
.rental-document .rd-deposit p { font-size:7.8pt; color:#5a5143; }
.rental-document .rd-deposit > strong { white-space:nowrap; }
.rental-document .rd-terms { margin-block:10px; padding:9px 11px; border:1px solid #d4dce3; border-radius:5px; break-inside:avoid; }
.rental-document .rd-terms h3 { font-size:9pt; margin-bottom:5px; }
.rental-document .rd-terms p { font-size:8pt; line-height:1.8; margin-block:3px; }
.rental-document .rd-signatures { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:28px; padding-top:8px; margin-top:12px; border-top:1px solid #d4dce3; text-align:center; break-inside:avoid; }
.rental-document .rd-signatures p { font-size:8pt; color:#52616d; }
.rental-document .rd-signature-line { height:29px; border-bottom:1px dashed #8797a4; margin:0 14px 5px; }
.rental-document .rd-notes { padding:9px 11px; margin-bottom:10px; border:1px solid #d4dce3; border-radius:5px; }
.rental-document .rd-notes h3 { font-size:9pt; margin-bottom:4px; break-after:avoid; }
.rental-document .rd-notes p { white-space:pre-wrap; overflow-wrap:anywhere; orphans:3; widows:3; }
`;

export const CONTRACT_PRINT_STYLES = `
@page { size:A4 portrait; margin:10mm; }
html,body { margin:0; padding:0; background:#fff; color:#182c3d; }
body { width:190mm; font-family:Tahoma,Arial,sans-serif; }
* { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
${CONTRACT_DOCUMENT_STYLES}
`;

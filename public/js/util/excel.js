export function exportXlsx(rows, filename = "export.xlsx") {
  // 1. Création du workbook et de la feuille
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows); // rows = array of arrays
  XLSX.utils.book_append_sheet(wb, ws, "Données");

  // 2. Écriture du fichier en mémoire
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  // 3. Création du Blob et téléchargement
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

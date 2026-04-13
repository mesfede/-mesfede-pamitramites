
function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(name: string): string {
  if (!name) return "";
  let n = removeAccents(name.toUpperCase());
  
  const wordsToRemove = [
    "HOSPITAL", "HTAL", "HOSP", "INSTITUTO", "INST", "INSTIT", 
    "CLINICA", "CL", "CLIN", "SANATORIO", "SANAT", "CENTRO", "CTRO", "CIEN",
    "PRIVADO", "PRIV", "PR", "GENERAL", "GRAL", "ZONAL", "AGUDOS", "CRONICOS", 
    "ESPECIALIZADO", "ESPECIALIZADA", "PROF", "DR", "DRA", "SRL", "SA", "S.A.", "S.R.L.",
    "DE", "LA", "EL", "LOS", "LAS", "Y", "E", "EN", "DEL", "S.E.", "S.H."
  ];
  
  wordsToRemove.forEach(w => {
    const reg = new RegExp(`\\b${w.replace(/\./g, "\\.")}\\b`, "g");
    n = n.replace(reg, " ");
  });
  
  n = n.replace(/[.,/()#\-]/g, " ");
  n = n.replace(/\s+/g, " ").trim();
  
  return n;
}

console.log(`'Vaccarini' -> '${normalizeName('Vaccarini')}'`);
console.log(`'CL PR VACCARINI SA' -> '${normalizeName('CL PR VACCARINI SA')}'`);
console.log(`'WRNICKE, Verónica' -> '${normalizeName('WRNICKE, Verónica')}'`);
console.log(`'WERNICKE, VERONICA' -> '${normalizeName('WERNICKE, VERONICA')}'`);

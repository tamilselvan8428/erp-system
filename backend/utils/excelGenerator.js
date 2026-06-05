import XLSX from 'xlsx';

export const generateExcelReport = (sheetName, headers, rows) => {
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buf;
};

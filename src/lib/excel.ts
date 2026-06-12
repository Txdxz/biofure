import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], sheetName: string, fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function importFromExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function generateOrderImportTemplate() {
  const template = [
    {
      customerName: '客户名称',
      customerCode: '客户编码（选填）',
      date: '订单日期（YYYY-MM-DD）',
      items: JSON.stringify([{ productName: '产品名称', quantity: '数量', unitPrice: '单价' }]),
      paymentMethod: '付款方式（选填）',
      contractNo: '合同号（选填）',
      remark: '备注（选填）'
    }
  ];
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '订单导入模板');
  XLSX.writeFile(workbook, '订单导入模板.xlsx');
}
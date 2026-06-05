import PDFDocument from 'pdfkit';

export const generatePDFReport = (title, subtitle, headers, rows) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', (err) => reject(err));

      // Header Brand banner
      doc.fillColor('#153E75').fontSize(18).text('Sri Eshwar College of Engineering', { align: 'center' });
      doc.fillColor('#ECBF19').fontSize(11).text('Faculty & Student Academic Intelligence System (FSAIS)', { align: 'center' });
      doc.moveDown(0.5);
      
      // Divider line
      doc.strokeColor('#1F57A3').lineWidth(1.5).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(1);

      // Title & description
      doc.fillColor('#222222').fontSize(14).text(title, { align: 'left' });
      if (subtitle) {
        doc.fontSize(9).fillColor('#555555').text(subtitle, { align: 'left' });
      }
      doc.moveDown(1.2);

      // Table parameters
      const startX = 50;
      let startY = doc.y;
      const totalWidth = 512;
      const colWidth = Math.floor(totalWidth / headers.length);

      // Header cell backgrounds
      doc.rect(startX, startY - 4, totalWidth, 20).fill('#1F57A3');
      doc.fillColor('#FFFFFF').fontSize(9);
      
      headers.forEach((header, index) => {
        doc.text(header, startX + 5 + (index * colWidth), startY, { 
          width: colWidth - 10, 
          lineBreak: false, 
          ellipsis: true 
        });
      });
      doc.moveDown(1.3);

      // Row values
      rows.forEach((row, rowIndex) => {
        const rowY = doc.y;
        
        // Page break safety check
        if (rowY > doc.page.height - 80) {
          doc.addPage();
          startY = doc.y;
          // Re-draw headers on new page
          doc.rect(startX, startY - 4, totalWidth, 20).fill('#1F57A3');
          doc.fillColor('#FFFFFF').fontSize(9);
          headers.forEach((header, index) => {
            doc.text(header, startX + 5 + (index * colWidth), startY, { 
              width: colWidth - 10, 
              lineBreak: false 
            });
          });
          doc.moveDown(1.3);
        }

        const currentRowY = doc.y;

        // Zebra background stripes
        if (rowIndex % 2 === 1) {
          doc.rect(startX, currentRowY - 3, totalWidth, 16).fill('#F5F7FA');
        }

        doc.fillColor('#333333').fontSize(8);
        headers.forEach((_, colIndex) => {
          const val = String(row[colIndex] || '');
          doc.text(val, startX + 5 + (colIndex * colWidth), currentRowY, { 
            width: colWidth - 10, 
            lineBreak: false, 
            ellipsis: true 
          });
        });
        doc.moveDown(1);
      });

      // Page numbers & timestamp footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor('#888888').text(
          `Generated on ${new Date().toLocaleString()} | Page ${i + 1} of ${pages.count} | FSAIS Sri Eshwar`,
          50,
          doc.page.height - 35,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};

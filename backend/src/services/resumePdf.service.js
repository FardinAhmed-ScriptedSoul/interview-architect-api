const PDFDocument = require('pdfkit');

async function generateResumePdf({ resume, jobDescription, selfDescription }) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', chunk => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc.fontSize(22).font('Helvetica-Bold').text('Resume', { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('Professional Summary');
        doc.fontSize(11).font('Helvetica').text(resume || 'N/A');
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('Self Description');
        doc.fontSize(11).font('Helvetica').text(selfDescription || 'N/A');
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('Target Job Description');
        doc.fontSize(11).font('Helvetica').text(jobDescription || 'N/A');

        doc.end();
    });
}

module.exports = generateResumePdf;
const pdfParse = require('pdf-parse');

async function processPdfUpload(req, res, next) {
    try {
        // 1. Basic Multer allocation checks
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ status: "failed", message: "Please upload a valid PDF resume file." });
        }

        // 2. Validate magic bytes header structure safely
        const pdfHeader = req.file.buffer.slice(0, 5).toString();
        if (pdfHeader !== '%PDF-') {
            return res.status(400).json({ 
                status: "failed", 
                message: "Invalid file signatures. Please upload a genuine, uncorrupted PDF document." 
            });
        }

        // 3. Extract text inside the middleware layer
        let pdfData;
        try {
            // Safe fallback logic handle: Try direct call, fall back to default wrapper if required by the bundle environment
            if (typeof pdfParse === 'function') {
                pdfData = await pdfParse(req.file.buffer);
            } else if (pdfParse && typeof pdfParse.default === 'function') {
                pdfData = await pdfParse.default(req.file.buffer);
            } else {
                // Direct fallback path if commonJS bundling is isolated
                const fallbackParser = require('pdf-parse/lib/pdf-parse.js');
                pdfData = await fallbackParser(req.file.buffer);
            }
        } catch (parseError) {
            console.error("PDF extraction worker crashed:", parseError.message);
            return res.status(422).json({
                status: "failed",
                message: "Could not read the PDF structure. The document might be encrypted or corrupted."
            });
        }

        // 4. Validate extractable text length requirements
        const resumeTextContent = pdfData.text?.trim();
        if (!resumeTextContent) {
            return res.status(400).json({
                status: "failed",
                message: "No readable text could be extracted. Scanned image PDFs are not supported."
            });
        }

        // 5. Save the clean string directly onto the request object for the controller
        req.resumeTextContent = resumeTextContent;
        next();

    } catch (error) {
        next(error);
    }
}

module.exports = { processPdfUpload };
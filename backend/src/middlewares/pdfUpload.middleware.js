// middlewares/pdfUpload.middleware.js
const pdfParse = require('pdf-parse');

async function processPdfUpload(req, res, next) {
    // 🛡️ CRITICAL DYNAMIC SIGNATURE GUARD:
    // If Express runs this function with 4 arguments or if 'req' contains a standard Error instance,
    // it means a previous middleware handler (like Multer) failed.
    if (req instanceof Error || arguments.length === 4 || (!next && typeof res === 'function')) {
        const structuralError = req instanceof Error ? req : new Error("Route chain sequence failure.");
        const actualResponse = typeof res.status === 'function' ? res : arguments[2];
        
        console.error("🛡️ Caught upstream middleware error safely:", structuralError.message);
        return actualResponse.status(400).json({
            status: "failed",
            message: `File upload processing fault: ${structuralError.message}`
        });
    }

    try {
        // 1. Basic Multer buffer validation checks
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ 
                status: "failed", 
                message: "Please upload a valid PDF document file." 
            });
        }

        // 2. Validate magic bytes header structure safely
        const pdfHeader = req.file.buffer.slice(0, 5).toString();
        if (pdfHeader !== '%PDF-') {
            return res.status(400).json({ 
                status: "failed", 
                message: "Invalid file signature. Please upload a genuine, uncorrupted PDF document." 
            });
        }

        // 3. Extract text content safely from the buffered object node
        let pdfData;
        try {
            if (typeof pdfParse === 'function') {
                pdfData = await pdfParse(req.file.buffer);
            } else if (pdfParse && typeof pdfParse.default === 'function') {
                pdfData = await pdfParse.default(req.file.buffer);
            } else {
                const fallbackParser = require('pdf-parse/lib/pdf-parse.js');
                pdfData = await fallbackParser(req.file.buffer);
            }
        } catch (parseError) {
            console.error("💥 PDF extraction worker crashed:", parseError.message);
            return res.status(422).json({
                status: "failed",
                message: "Could not read the PDF structure. Document might be encrypted or corrupt."
            });
        }

        // 4. Validate extractable text content length requirements
        const resumeTextContent = pdfData.text?.trim();
        if (!resumeTextContent) {
            return res.status(400).json({
                status: "failed",
                message: "No readable text could be extracted. Scanned image PDFs are not supported."
            });
        }

        // 5. Store data context safely onto the request wrapper scope for your controller
        req.resumeTextContent = resumeTextContent;
        
        // Confirm next handler exists before invoking context callback execution path
        if (typeof next === 'function') {
            return next();
        }

    } catch (error) {
        console.error("💥 Critical uncaught execution processing anomaly:", error);
        if (typeof next === 'function') {
            return next(error);
        } else {
            return res.status(500).json({
                status: "failed",
                message: "Internal tracking server exception encountered inside parsing layer."
            });
        }
    }
}

module.exports = { processPdfUpload };
import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// api/routes/courses.ts -> api/routes -> api -> root -> courses
const COURSES_ROOT = path.join(__dirname, '../../courses');

// Helper to check if file exists
async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Get all courses
router.get('/', async (req, res) => {
  try {
    // Check if courses root exists
    if (!await fileExists(COURSES_ROOT)) {
        await fs.mkdir(COURSES_ROOT, { recursive: true });
    }

    const entries = await fs.readdir(COURSES_ROOT, { withFileTypes: true });
    const courses = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to list courses' });
  }
});

// Get units for a course
router.get('/:courseName', async (req, res) => {
  const { courseName } = req.params;
  const coursePath = path.join(COURSES_ROOT, courseName);

  try {
    if (!await fileExists(coursePath)) {
        return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const entries = await fs.readdir(coursePath, { withFileTypes: true });
    const units = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    res.json({ success: true, data: units });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to list units' });
  }
});

// Export PDF
router.get('/:courseName/export-pdf', async (req, res) => {
  const { courseName } = req.params;
  const coursePath = path.join(COURSES_ROOT, courseName);

  console.log(`Starting PDF export for course: ${courseName}`);

  try {
    if (!await fileExists(coursePath)) {
        return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Get all units
    const entries = await fs.readdir(coursePath, { withFileTypes: true });
    const units = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      // Ensure sorting matches typical file system order
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (units.length === 0) {
        return res.status(400).json({ success: false, error: 'No units found in course' });
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const mergedPdf = await PDFDocument.create();
    let hasContent = false;

    // Process units sequentially
    for (const unitName of units) {
        const unitPath = path.join(coursePath, unitName);
        const files = await fs.readdir(unitPath);
        const htmlFile = files.find(f => f.toLowerCase() === 'index.html');

        if (htmlFile) {
            console.log(`Processing unit: ${unitName}`);
            const page = await browser.newPage();
            
            // Set viewport to 16:9 aspect ratio (e.g., 1920x1080)
            await page.setViewport({ width: 1920, height: 1080 });

            // Construct URL
            const encodedCourse = encodeURIComponent(courseName);
            const encodedUnit = encodeURIComponent(unitName);
            const encodedHtml = encodeURIComponent(htmlFile);
            const url = `http://localhost:3001/courses-static/${encodedCourse}/${encodedUnit}/${encodedHtml}`;

            try {
                // Wait for network idle to ensure resources are loaded
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
                
                // Generate PDF
                const pdfBuffer = await page.pdf({
                    printBackground: true,
                    format: 'A4',
                    landscape: true,
                    margin: { top: 0, right: 0, bottom: 0, left: 0 }
                });

                // Merge into final document
                const unitPdf = await PDFDocument.load(pdfBuffer);
                const copiedPages = await mergedPdf.copyPages(unitPdf, unitPdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
                hasContent = true;

            } catch (err) {
                console.error(`Failed to process unit ${unitName}:`, err);
            } finally {
                await page.close();
            }
        }
    }

    await browser.close();

    if (!hasContent) {
        return res.status(400).json({ success: false, error: 'No HTML content found to export' });
    }

    const finalPdfBytes = await mergedPdf.save();
    
    // Send response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(courseName)}.pdf"`);
    res.setHeader('Content-Length', finalPdfBytes.length);
    res.send(Buffer.from(finalPdfBytes));

  } catch (error) {
    console.error('PDF Export Error:', error);
    // If headers already sent, we can't send JSON error, but usually we catch before streaming starts
    if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Failed to export PDF' });
    }
  }
});

// Get unit content
router.get('/:courseName/:unitName', async (req, res) => {
  const { courseName, unitName } = req.params;
  const unitPath = path.join(COURSES_ROOT, courseName, unitName);

  try {
    if (!await fileExists(unitPath)) {
        return res.status(404).json({ success: false, error: 'Unit not found' });
    }

    const readmePath = path.join(unitPath, 'Readme.md');
    const updatePath = path.join(unitPath, 'Update.md');
    
    // Find image file
    const files = await fs.readdir(unitPath);
    const imageFile = files.find(f => /\.(png|jpg|jpeg|svg|gif)$/i.test(f));
    const htmlFile = files.find(f => f.toLowerCase() === 'index.html');

    const [readme, update] = await Promise.all([
      fileExists(readmePath).then(exists => exists ? fs.readFile(readmePath, 'utf-8') : ''),
      fileExists(updatePath).then(exists => exists ? fs.readFile(updatePath, 'utf-8') : '')
    ]);

    // Note: The client should construct the full URL or we provide a relative path
    // that the client can prefix with the static file serve path.
    // We will serve courses folder at /courses-static
    
    // Encode components to handle spaces and special characters in URL
    const encodedCourseName = encodeURIComponent(courseName);
    const encodedUnitName = encodeURIComponent(unitName);
    // For static files served by express.static, we don't need to double encode if the browser handles it,
    // but here we are constructing a URL path.
    // express.static serves files directly. If we request /courses-static/A B/C.png, express looks for "A B/C.png".
    // Browser will request /courses-static/A%20B/C.png.
    // So we should return the path with encoded segments.
    
    // HOWEVER, if imageFile itself has spaces, we need to be careful.
    const encodedImageFile = imageFile ? encodeURIComponent(imageFile) : null;
    const encodedHtmlFile = htmlFile ? encodeURIComponent(htmlFile) : null;

    res.json({
      success: true,
      data: {
        readme,
        update,
        image: encodedImageFile ? `/courses-static/${encodedCourseName}/${encodedUnitName}/${encodedImageFile}` : null,
        html: encodedHtmlFile ? `/courses-static/${encodedCourseName}/${encodedUnitName}/${encodedHtmlFile}` : null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to get unit content' });
  }
});

// Update update.md
router.post('/:courseName/:unitName/update', async (req, res) => {
  const { courseName, unitName } = req.params;
  const { content } = req.body;
  const unitPath = path.join(COURSES_ROOT, courseName, unitName);
  const updatePath = path.join(unitPath, 'Update.md');

  try {
    if (!await fileExists(unitPath)) {
        return res.status(404).json({ success: false, error: 'Unit not found' });
    }
    await fs.writeFile(updatePath, content, 'utf-8');
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to save update' });
  }
});

// Get canvas data
router.get('/:courseName/:unitName/canvas', async (req, res) => {
  const { courseName, unitName } = req.params;
  const unitPath = path.join(COURSES_ROOT, courseName, unitName);
  const canvasPath = path.join(unitPath, 'canvas.json');

  try {
    if (!await fileExists(unitPath)) {
        return res.status(404).json({ success: false, error: 'Unit not found' });
    }

    let canvasData = null;
    if (await fileExists(canvasPath)) {
        const content = await fs.readFile(canvasPath, 'utf-8');
        try {
            canvasData = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse canvas.json", e);
        }
    }

    res.json({ success: true, data: canvasData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to get canvas data' });
  }
});

// Save canvas data
router.post('/:courseName/:unitName/canvas', async (req, res) => {
  const { courseName, unitName } = req.params;
  const { content } = req.body; // content should be JSON object
  const unitPath = path.join(COURSES_ROOT, courseName, unitName);
  const canvasPath = path.join(unitPath, 'canvas.json');

  try {
    if (!await fileExists(unitPath)) {
        return res.status(404).json({ success: false, error: 'Unit not found' });
    }
    
    // Ensure content is a string
    const stringContent = typeof content === 'string' ? content : JSON.stringify(content);
    
    await fs.writeFile(canvasPath, stringContent, 'utf-8');
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to save canvas data' });
  }
});

export default router;

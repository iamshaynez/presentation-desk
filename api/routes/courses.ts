import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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

export default router;

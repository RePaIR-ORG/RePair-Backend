import express from 'express';
import multer from 'multer';
import Groq from 'groq-sdk';

const router = express.Router();

// Store uploaded audio in memory (no disk I/O needed)
const upload = multer({ storage: multer.memoryStorage() });

// Lazy-init Groq client so missing key errors surface at request time
let groqClient = null;
function getGroq() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/**
 * POST /api/transcribe
 * Body: multipart/form-data  →  field "audio" (any common audio format)
 * Returns: { transcript: string }
 */
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file received.' });
    }

    const groq = getGroq();

    // Groq SDK expects a File-like object. We wrap the Buffer from multer.
    const audioFile = new File(
      [req.file.buffer],
      req.file.originalname || 'audio.webm',
      { type: req.file.mimetype || 'audio/webm' }
    );

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',   // fastest Groq Whisper model
      response_format: 'json',
      language: 'en',
    });

    return res.json({ transcript: transcription.text });
  } catch (err) {
    console.error('[Transcribe] Error:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Transcription failed. Please try again.',
    });
  }
});

export default router;

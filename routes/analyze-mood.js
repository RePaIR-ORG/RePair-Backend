import express from 'express';
import Groq from 'groq-sdk';

const router = express.Router();

let groqClient = null;
function getGroq() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/**
 * POST /api/analyze-mood
 * Body: { text: string }
 * Returns: { mood: "happy" | "sad" | "angry" | "tired" }
 */
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text provided.' });
    }

    const groq = getGroq();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that classifies a child\'s text into exactly one of these four moods: happy, sad, angry, or tired. Return ONLY the mood name in lowercase. No punctuation, no extra words. If unsure, guess the closest one.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      model: 'llama-3.1-8b-instant', // fast, lower token model
      temperature: 0,
      max_tokens: 10,
    });

    const moodResponse = completion.choices[0]?.message?.content?.trim().toLowerCase();
    
    // validate
    const validMoods = ['happy', 'sad', 'angry', 'tired'];
    // Try to find if any of the valid moods are contained in the response string just in case
    let finalMood = 'happy'; // default fallback
    for (const valid of validMoods) {
      if (moodResponse.includes(valid)) {
        finalMood = valid;
        break;
      }
    }

    return res.json({ mood: finalMood });
  } catch (err) {
    console.error('[Analyze Mood] Error:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Mood analysis failed.',
    });
  }
});

export default router;

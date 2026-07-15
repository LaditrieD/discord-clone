import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry user-agent
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not set or using placeholder. Fallback mode active.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// API Endpoint for Discord AI Bot
app.post('/api/bot', async (req, res) => {
  const { prompt, history, channelName } = req.body;

  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        reply: `Selam! Ben **GeminiAI**. Şu anda arka planda API Anahtarım henüz ayarlanmamış görünüyor, bu nedenle simüle edilmiş bir yanıt veriyorum. \n\nSunucu kanalı: **#${channelName || 'sohbet'}**\nYazdığın mesaj: "${prompt}"\n\nYazılım geliştirmede, sunucu izinlerinde veya Discord benzeri harika bento tasarımlarında yardıma ihtiyacın olursa buradayım!`
      });
    }

    // Format chat history into a clean context
    const formattedHistory = (history || []).map((h: any) => 
      `${h.sender}: ${h.content}`
    ).join('\n');

    const systemInstruction = 
      `Sen "GeminiAI" adında, Discord benzeri modern bir masaüstü uygulamasında bulunan, akıllı, yardımsever, neşeli ve hafif esprili bir yapay zeka asistanısın.
      Sohbet kanalı: #${channelName || 'genel'}.
      Grup sohbetindeki diğer üyeler: KozmikGezgin (Server Owner), Zeynep_Dev (Admin), ModeratörAhmet, Gamer35.
      Yanıtlarını Discord formatında yaz (kalın yazmak için **, listeler için -, kodlar için markdown blokları \`\`\`).
      Cevapların kısa, akıcı ve sohbet havasında olsun, bir robot gibi değil, sunucudaki cana yakın bir geliştirici arkadaş gibi yanıt ver.`;

    const fullPrompt = `Burası sunucu kanalı geçmişi:\n${formattedHistory}\n\nKullanıcının son sorusu: "${prompt}"\n\nGeminiAI olarak yanıtla:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.json({
      reply: "Ups! Kozmik bir sinyal kesintisi yaşandı. Sanırım bir fırtına var ya da API anahtarı geçersiz. Ama pes etmek yok, bana tekrar yazmayı dene! 🚀"
    });
  }
});

// Configure Vite or Static Asset serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static assets...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
};

startServer();

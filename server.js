const express = require('express');
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable not set');
}
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const app = express();
app.use(express.json());

app.post('/setscore', async (req, res) => {
  const { user_id, chat_id, inline_message_id, score } = req.body || {};
  if (!user_id || score === undefined) {
    return res.status(400).json({ error: 'user_id and score required' });
  }
  const params = {
    user_id: Number(user_id),
    score: Number(score),
    force: true,
  };
  if (chat_id) params.chat_id = Number(chat_id);
  if (inline_message_id) params.inline_message_id = inline_message_id;
  try {
    const result = await tgApi('setGameScore', params);
    res.json(result);
  } catch (e) {
    console.error('Failed setting score:', e);
    res.status(500).json({ error: 'failed' });
  }
});

function tgApi(method, params) {
  return fetch(`${API_URL}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).then((r) => r.json());
}

app.post('/webhook', async (req, res) => {
  const update = req.body;
  if (update.message && update.message.web_app_data) {
    try {
      const data = JSON.parse(update.message.web_app_data.data || '{}');
      if (data.score !== undefined) {
        const params = {
          user_id: update.message.from.id,
          score: data.score,
          force: true,
        };
        if (update.message.chat) params.chat_id = update.message.chat.id;
        if (update.message.inline_message_id)
          params.inline_message_id = update.message.inline_message_id;
        await tgApi('setGameScore', params);
      }
    } catch (e) {
      console.error('Failed handling webhook:', e);
    }
  }
  res.sendStatus(200);
});

app.get('/highscores', async (req, res) => {
  const { user_id, chat_id, inline_message_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  const params = { user_id: Number(user_id) };
  if (chat_id) params.chat_id = Number(chat_id);
  if (inline_message_id) params.inline_message_id = inline_message_id;
  try {
    const scores = await tgApi('getGameHighScores', params);
    res.json(scores);
  } catch (e) {
    console.error('Failed fetching highscores:', e);
    res.status(500).json({ error: 'failed' });
  }
});

app.use(express.static('docs'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));

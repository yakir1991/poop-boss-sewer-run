const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable not set');
  process.exit(1);
}
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;
if (!GROUP_CHAT_ID) {
  console.log('GROUP_CHAT_ID not set; skipping Telegram notifications');
}
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const app = express();
app.use(express.json());

app.post('/setscore', async (req, res) => {
  const { score, initData } = req.body || {};
  if (score === undefined || !initData) {
    return res.status(400).json({ error: 'initData and score required' });
  }
  const data = validateInitData(initData);
  if (!data || !data.user) {
    return res.status(400).json({ error: 'invalid initData' });
  }
  const params = {
    user_id: data.user.id,
    score: Number(score),
    force: true,
  };
  if (data.chat) params.chat_id = data.chat.id;
  if (data.inline_message_id) params.inline_message_id = data.inline_message_id;
  try {
    const result = await tgApi('setGameScore', params);
    if (!result.ok) throw new Error(result.description);

    if (GROUP_CHAT_ID) {
      const name = data.user.username || data.user.first_name;
      const text = `${name} scored ${score} in Poop-Boss Sewer Run!`;
      const msgRes = await tgApi('sendMessage', {
        chat_id: GROUP_CHAT_ID,
        text,
      });
      if (!msgRes.ok) throw new Error(msgRes.description);
    }

    res.json(result);
  } catch (e) {
    console.error('Failed setting score or sending message:', e);
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

function validateInitData(initData) {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  const dataCheck = [...params.entries()]
    .filter(([k]) => k !== 'hash')
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');
  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac('sha256', secret).update(dataCheck).digest('hex');
  if (hmac !== hash) return null;
  const user = params.get('user') ? JSON.parse(params.get('user')) : null;
  const chat = params.get('chat') ? JSON.parse(params.get('chat')) : null;
  const inline_message_id = params.get('inline_message_id');
  return { user, chat, inline_message_id };
}


app.get('/highscores', async (req, res) => {
  const { initData } = req.query;
  const data = validateInitData(initData);
  if (!data || !data.user) return res.status(400).json({ error: 'invalid initData' });
  const params = { user_id: data.user.id };
  if (data.chat) params.chat_id = data.chat.id;
  if (data.inline_message_id) params.inline_message_id = data.inline_message_id;
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

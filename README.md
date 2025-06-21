# Poop-Boss Sewer Run

Poop-Boss Sewer Run is a browser-based game built with the [Phaser 3](https://phaser.io/) framework. The source for the playable game lives entirely in the `docs` directory, making it easy to host on platforms such as GitHub Pages or any simple static site server.

## Dependencies

The game itself has no build step. It relies on Phaser 3 loaded via a CDN and the assets included in `docs/assets`. To play locally you only need:

- A modern web browser
- (Optional) Python 3 for running a local HTTP server

## Serving the Game Locally

Because modern browsers restrict loading modules directly from the filesystem, you should serve the `docs` directory through a local web server.

### Using Python 3

```bash
cd docs
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser to start the game.

You can use any other static HTTP server if preferred.

## Project Structure

```
/docs        # Game HTML, JS and assets
/LICENSE     # License information
/README.md   # Project documentation
/.gitignore  # Files ignored by git
```

`docs/index.html` bootstraps Phaser and loads `main.js`, which contains all game logic.


## Hosting Over HTTPS and Bot Integration

Hosting `docs/` on an HTTPS capable server is required for the Telegram WebApp platform. One simple approach is GitHub Pages:

1. Push this repository to GitHub.
2. In the repository settings enable **GitHub Pages** and select `docs/` as the source.
3. Once published the game will be available at an HTTPS URL such as `https://<user>.github.io/<repo>/`.

Register that URL with your bot using @BotFather. The game works best as a Telegram **WebApp**. A limited fallback for the legacy `sendGame` method is included, though the scoreboard is disabled in that mode.

Use an inline keyboard button to launch the WebApp. Example with **python-telegram-bot**:

```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

url = "https://<user>.github.io/<repo>/"
button = InlineKeyboardButton("Play Poop-Boss", web_app=WebAppInfo(url))
markup = InlineKeyboardMarkup.from_button(button)
bot.send_message(chat_id, "Open the game:", reply_markup=markup)
```

After receiving the score data from `main.js`, call `setGameScore` as usual to update the leaderboard.

If you also want the server to post the final score to a Telegram chat, set the
`GROUP_CHAT_ID` environment variable when running `server.js`.

## Running `server.js`

The provided `server.js` script can be used to serve `docs/` and forward scores
to Telegram. It requires **Node.js 18** or newer. Before running it install the
minimal dependencies:

```bash
npm install express node-fetch
```

Start the server with your bot token:

```bash
BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11 \
  node server.js
```

`BOT_TOKEN` is mandatory. Set `GROUP_CHAT_ID` as well if you want the server to
post scores to a specific chat:

```bash
GROUP_CHAT_ID="-1001234567890" BOT_TOKEN=<token> node server.js
```

The server listens on port `3000` by default.

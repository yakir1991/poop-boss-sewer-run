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

Register that URL with your bot using @BotFather. The game must be opened as a Telegram **WebApp**; the legacy `sendGame` flow is incompatible with the code in `docs/main.js`.

Use an inline keyboard button to launch the WebApp. Example with **python-telegram-bot**:

```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

url = "https://<user>.github.io/<repo>/"
button = InlineKeyboardButton("Play Poop-Boss", web_app=WebAppInfo(url))
markup = InlineKeyboardMarkup.from_button(button)
bot.send_message(chat_id, "Open the game:", reply_markup=markup)
```

After receiving the score data from `main.js`, call `setGameScore` as usual to update the leaderboard.

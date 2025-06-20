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
/main.py     # Sample Python script (not used by the game)
```

`docs/index.html` bootstraps Phaser and loads `main.js`, which contains all game logic.


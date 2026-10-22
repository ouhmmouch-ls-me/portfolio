# Mohamed Ouhmmouch — portfolio

A responsive, interactive portfolio based on Mohamed's CV. Built with HTML, CSS, and JavaScript; no dependency installation or build step is required.

## Features

- Interactive embedded system diagram with selectable metering, firmware, and network nodes.
- Four CV-grounded project case studies with category filters, engineering diagrams, and contribution details.
- Keyboard accessible skill tabs and a signal explorer with adjustable phase, voltage reference comparison, and pause control.
- Searchable quick navigation with `⌘K` / `Ctrl+K`, email copying, and a downloadable CV.
- Persistent light and dark themes, sticky navigation, readable mobile layouts, and reduced motion support.
- Original SVG illustrations, a social preview image, and deployment metadata based on the actual hosting URL.

## Run locally

From this directory, start a local web server:

```sh
python3 -m http.server 8000
```

Visit <http://localhost:8000>. Press `Ctrl+C` in the terminal to stop the server.

## Publish on GitHub Pages

1. Create an empty GitHub repository, for example `portfolio`. Use a public repository for GitHub Free.
2. From this directory, run the following with Git authenticated to your account. Replace `YOUR_USERNAME` with your GitHub username:

   ```sh
   git init -b main
   git add .
   git commit -m "Add interactive portfolio"
   git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
   git push -u origin main
   ```

3. In the repository, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. This workflow requires that source setting.
4. Open **Actions → Deploy portfolio to GitHub Pages**. If the first run happened before Pages was enabled, select **Run workflow** on `main`.
5. When deployment succeeds, its `github-pages` environment shows the live URL, normally `https://YOUR_USERNAME.github.io/portfolio/`.

Future pushes to `main` deploy automatically. The workflow stages only `index.html`, `styles.css`, `app.js`, `signal-lab.js`, and `assets/` in its published artifact. It inserts the public canonical URL and absolute social image URL into the staged HTML using the configured Pages address, including repository paths or a custom domain. Tests and repository documentation stay out of the website artifact. The workflow uses GitHub's provided token and needs no custom secrets. See [GitHub's workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Validate changes

Check JavaScript syntax with Node.js 22 or newer:

```sh
node --check app.js
node --check signal-lab.js
node --check tests/browser-checks.mjs
```

The dependency free browser suite connects to Chrome DevTools. Start a server in one terminal:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Start a separate Chrome instance in another terminal. This example uses macOS; use your Chrome executable path on other systems:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-first-run --no-default-browser-check \
  --remote-debugging-port=9223 --remote-debugging-address=127.0.0.1 \
  --user-data-dir=/tmp/mo-portfolio-chrome about:blank
```

Then run:

```sh
node tests/browser-checks.mjs
```

The suite checks asset delivery, project filters and dialogs, phase adjustment and waveform comparison, keyboard navigation, email copy feedback, theme persistence, sticky navigation, mobile touch targets, reduced motion, JavaScript errors, and horizontal overflow from 320px to 1440px. It saves screenshots in `.preview/` and regenerates `assets/social-card.png` from the SVG source. Optional `PORTFOLIO_URL` and `CHROME_DEBUG_URL` environment variables override the default local endpoints. Keep the DevTools port bound to the local loopback address.

On a Mac with VS Code but no standalone Node installation, replace `node` in these commands with:

```sh
ELECTRON_RUN_AS_NODE=1 "/Applications/Visual Studio Code.app/Contents/MacOS/Code"
```

## Edit the portfolio

- Update written content and links in `index.html`.
- Adjust layout, colors, and responsive styles in `styles.css`.
- Update navigation and project interactions in `app.js`, and signal simulation behaviour in `signal-lab.js`.
- Keep downloadable files and visual assets in `assets/`, using relative links so the site works under a repository path.

This source includes a CV download intended for the public portfolio. Replace that file when updating the CV.

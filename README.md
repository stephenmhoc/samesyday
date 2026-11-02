# Samesy Day

A one-page static site that tells you when your dog or cat becomes older than you, using the usual pet-to-human age curves. Everything runs in the browser.

## Development

```sh
npm install
npm run check
python3 -m http.server 4173 --directory public
```

Open `http://localhost:4173`.

`npm test` runs the calculator and story tests without starting a browser.

## Deployment

Cloudflare Pages deploys automatically from `main`.

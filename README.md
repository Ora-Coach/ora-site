# Ora public website

Static public website for Ora at `oracoach.app`.

This repository contains only the public marketing and support website used for
GitHub Pages, TestFlight, and App Store Connect support/privacy URLs. Do not add
private app source code, backend functions, backend code, credentials,
environment files, internal notes, Flutter build output, or private business
documents.

The authenticated Ora app is a separate private deployment intended for
`https://app.oracoach.app`. This public repository should only link to that app
URL; it should not contain the app source, backend code, deployment secrets, or
compiled app artifacts. See `ARCHITECTURE.md` for the split-domain architecture.

## Site shape

- `/` - Ora marketing homepage: one plain HTML page with the 3D Orbi coach
  (`assets/home/orbi3d.js`), full-page section navigation on desktop, and the
  beta waitlist (`assets/waitlist.js`). three.js and GSAP load from jsDelivr at
  pinned versions; every other asset is in `assets/home/`.
- `/privacy/` - privacy policy. `/support/` - support and FAQ. `404.html`.
  These share `assets/home/page.css`.
- `/robots.txt` and `/sitemap.xml`.

The old SEO pages, guides and sponsor page were removed on 2026-10-08.

## Build and package manager

There is no framework, package manager, install step, or build command in this
repository. The site is plain static HTML/CSS/JS and public image assets.

The beta form is static: it opens a prefilled email to
`support@oracoach.app` instead of posting to a private backend.

## GitHub Pages deployment

1. Open the repository on GitHub.
2. Go to **Settings** -> **Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Set the branch to `main` and the folder to `/ (root)`.
5. Confirm the custom domain is `oracoach.app`.
6. Keep **Enforce HTTPS** enabled after GitHub provisions the certificate.

The included `CNAME` file must contain exactly:

```text
oracoach.app
```

## Local preview

Run a static server from the repository root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## App subdomain deployment

Deploy the authenticated app from the private Ora app repo or a separate private
web app repo. Do not deploy it from `ora-site`.

For the current private Flutter web setup, the preferred app subdomain shape is
`https://app.oracoach.app/`, built with a root base href such as:

```bash
flutter build web --base-href /
```

Configure `app.oracoach.app` in the private hosting provider, add it to Firebase
Auth authorized domains if Firebase Auth is used, and add only the DNS records
shown by that provider. For Firebase Hosting, the custom-domain wizard may
require ownership TXT records and a subdomain CNAME. Use Firebase's displayed
records as the source of truth.

## Verification checklist

- `git diff --check`
- Confirm `CNAME` contains exactly `oracoach.app`.
- Confirm app-access links point to `https://app.oracoach.app`.
- Confirm `/`, `/privacy/`, `/support/`, `/robots.txt` and `/sitemap.xml`
  return HTTP 200 from a local static server.
- Confirm no private app code, backend functions, credentials, environment files,
  or backend config are present.
- Confirm `https://oracoach.app/`, `https://oracoach.app/privacy/`, and
  `https://oracoach.app/support/` load over HTTPS after deployment.

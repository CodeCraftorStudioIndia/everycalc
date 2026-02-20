# EveryCalc — World's First AI Responsive Calculator
### everycalc.site

> Generate any calculator instantly with AI. Cloudflare Pages · Firebase Auth · Groq AI.

---

## 🚀 Deploy in 5 Minutes

### 1. Install Wrangler & Login
```bash
npm install -g wrangler
wrangler login
```

### 2. Create Cloudflare Pages Project
```bash
npx wrangler pages project create everycalc
```

### 3. Set All Secrets
```bash
npx wrangler pages secret put GROQ_API_KEY              --project-name=everycalc
npx wrangler pages secret put FIREBASE_API_KEY          --project-name=everycalc
npx wrangler pages secret put FIREBASE_AUTH_DOMAIN      --project-name=everycalc
npx wrangler pages secret put FIREBASE_PROJECT_ID       --project-name=everycalc
npx wrangler pages secret put FIREBASE_STORAGE_BUCKET   --project-name=everycalc
npx wrangler pages secret put FIREBASE_MESSAGING_SENDER_ID --project-name=everycalc
npx wrangler pages secret put FIREBASE_APP_ID           --project-name=everycalc
```

### 4. Deploy
```bash
npx wrangler pages deploy . --project-name=everycalc
```

### 5. Local Dev
```bash
npx wrangler pages dev . --local
# → http://localhost:8788
```

---

## 🔑 Where to Get Each Secret

| Secret | Source |
|--------|--------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `FIREBASE_*` | Firebase Console → Project Settings → Your apps |

---

## 🔥 Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create new project → Add Web app
3. **Authentication** → Sign-in methods → Enable:
   - ✅ Email/Password
   - ✅ Google
   - ✅ GitHub *(requires GitHub OAuth app)*
4. **Authorized Domains** → Add: `everycalc.site`, `everycalc.pages.dev`
5. Copy config values to Cloudflare secrets

### GitHub OAuth App Setup
1. GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
   - Homepage URL: `https://everycalc.site`
   - Callback URL: `https://everycalc.site/__/auth/handler`
2. Copy Client ID & Secret → Firebase → GitHub provider settings

---

## 📁 File Structure

```
everycalc/
├── index.html                 # Landing page (public, SEO)
├── app.html                   # Main AI generator app
├── auth.html                  # Login / Signup / Reset
├── terms.html                 # Terms of Service
├── privacy.html               # Privacy Policy
├── _headers                   # Cloudflare security headers
├── _redirects                 # URL routing
├── robots.txt                 # SEO
├── sitemap.xml                # SEO sitemap
├── manifest.json              # PWA manifest
├── wrangler.toml              # Cloudflare config
└── functions/
    └── api/
        ├── groq.js            # Groq AI proxy (POST /api/groq)
        └── firebase-config.js # Firebase config (GET /api/firebase-config)
```

---

## ✨ Features

- **AI Calculator Generation** — Any calculator name → working calculator in <30s
- **100% Responsive** — Pixel-perfect on 320px phones to 4K monitors
- **Region Auto-detection** — Shows correct currency automatically
- **Browser Library** — All calculators saved in localStorage
- **5 Free/Day** — Rate-limited free tier, unlimited with Pro
- **Firebase Auth** — Email, Google & GitHub sign-in
- **Zero Build Step** — Pure HTML/CSS/JS, deploy as static files
- **Cloudflare Edge** — API keys secure in Cloudflare secrets, never exposed

---

## 🌐 Custom Domain

1. Cloudflare Pages → Settings → Custom Domains
2. Add `everycalc.site` and `www.everycalc.site`
3. Follow DNS setup instructions

---

© 2025 EveryCalc · everycalc.site

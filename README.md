# ⚡ Joi Tools

> Your personal app launcher & workspace OS — import GitHub repos, link deployments, and open live apps in an iframe workspace.

![Joi Tools](https://img.shields.io/badge/Joi_Tools-v1.0.0-6c63ff?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwindcss)

---

## 🚀 Features

- 🔗 **GitHub Integration** — Fetch all your repos via GitHub API
- 📥 **Manual Import** — Add any repo via Git URL
- 🚀 **Deployment Linking** — Attach Vercel, Netlify, GitHub Pages URLs
- 🧩 **App Cards** — Beautiful grid with tech stack tags, status badges, icons
- 🖥️ **Live Iframe Viewer** — Open deployed apps inside the dashboard
- 📱 **Mobile Preview Mode** — Simulate 390px iPhone viewport
- 🔍 **Search & Filter** — Filter by tech stack, deployment status
- 📌 **Pin Apps** — Drag to reorder, pin favorites
- ⌨️ **Keyboard Shortcuts** — `Cmd+K` to import, `Esc` to close, `F5` to reload
- 💾 **Offline Cache** — All data persisted to localStorage via Zustand

---

## 📁 Project Structure

```
joi-tools/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   └── github.ts          # GitHub REST API calls
│   ├── components/
│   │   ├── AppCard.tsx         # Individual app card with actions
│   │   ├── AppViewerModal.tsx  # Fullscreen iframe workspace
│   │   ├── DeployLinkDialog.tsx # Link deployment URL
│   │   ├── ImportDialog.tsx    # Import repos dialog
│   │   ├── Sidebar.tsx         # Navigation + filters
│   │   └── TokenInput.tsx      # GitHub auth screen
│   ├── pages/
│   │   └── Dashboard.tsx       # Main grid layout
│   ├── store/
│   │   └── index.ts            # Zustand global state
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── utils/
│   │   └── index.ts            # Helpers (tech detection, formatting)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vercel.json
├── netlify.toml
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- GitHub Personal Access Token

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/joi-tools.git
cd joi-tools
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` (optional — token is entered in UI):
```env
VITE_APP_NAME=Joi Tools
```

### 3. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm run preview
```

---

## 🔐 GitHub Token Setup

1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Select scopes: `repo`, `read:user`
3. Copy the token (`ghp_...`)
4. Paste into Joi Tools on the connect screen

> **Security**: Token is stored only in browser `localStorage`. Never sent to any third-party server.

---

## 🚀 Deploy to Vercel

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option B: Vercel Dashboard

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your `joi-tools` repo
4. Framework: **Vite** (auto-detected)
5. Click **Deploy**

The `vercel.json` handles SPA routing automatically.

**Live URL format**: `https://joi-tools-USERNAME.vercel.app`

---

## 🟢 Deploy to Netlify

### Option A: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist
```

### Option B: Netlify Dashboard

1. Push to GitHub
2. Go to [app.netlify.com/start](https://app.netlify.com/start)
3. Connect your repo
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click **Deploy site**

The `netlify.toml` handles SPA redirects automatically.

**Live URL format**: `https://joi-tools.netlify.app`

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open import dialog |
| `Esc` | Close viewer / dialog |
| `F5` | Reload app in viewer |

---

## 🧠 How Tech Detection Works

Joi Tools auto-detects framework from:
- GitHub `language` field
- Repo `topics` array
- Repo name and description keywords

**Supported**: React, Next.js, Vue, Svelte, TypeScript, JavaScript, HTML/CSS

**Auto-filtered out**: Rust, Python, Go, Java (non-web repos)

---

## 📦 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_APP_NAME` | No | App display name |
| `VITE_APP_VERSION` | No | Version label |

---

## 🤝 Contributing

```bash
git checkout -b feature/your-feature
npm run dev
# make changes
git commit -m "feat: your feature"
git push origin feature/your-feature
```

---

## 📄 License

MIT © Joi Tools

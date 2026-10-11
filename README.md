# Raymond Thomas - Vibe Coder & Full-Stack AI Engineer Portfolio

A completely independent, standalone, high-performance portfolio site built specifically for **Vercel** edge deployment. Showcases all projects across personal GitHub (**@thepros2014**) and digital development organization (**@RJRC-Digital-Development**).

---

## 🚀 Live Online Sites Included Directly

The portfolio prominently features and directly links your active deployed production sites:
- **`socialwtf.wtf`** (`https://socialwtf.wtf` & `https://socialwtf.vercel.app`) - Decentralized Web3 Social & Creator Storefront on Cookie Chain (SVM).
- **`Socailwft.apk-`** (`https://socailmobile.vercel.app`) - Mobile Web & Android APK deployment.
- **`cookie-chain-capp`** (`https://thepros2014.github.io/cookie-chain-capp/`) - SVM Micro-Bounties & Tipping DApp.
- **`kracken-auto-trading-bot`** (`https://rjrc-digital-development.github.io/kracken-auto-trading-bot/`) - Live Kraken Bot Telemetry Landing.

Visitors can either click **"🚀 Visit Live Site"** or click **"📱 In-Page Preview"** to test drive them in an interactive modal.

---

## 🔒 Private Project Protection (Zero Code Leaks)

For proprietary and client NDA systems (`social.wtf`, `bitcoin-casino-aop`, `ai-battle`):
- **Sanitized Execution**: The site runs real functional interfaces, state evaluators, order execution simulators, and cryptographic proof verifiers without shipping proprietary client algorithms, private keys, or raw confidential codebases.
- **Provable Authority**: Live deployed sites (`socialwtf.wtf`) prove working software without needing to open-source the private GitHub repo.
- **Gated Code Audits**: CTOs and recruiters can submit a request for temporary read-only collaborator access under NDA.

---

## ⚡ How to Deploy to Vercel (Choose Either Method)

### Method 1: Deploy with Vercel CLI (Instant in Terminal)
From PowerShell in the `portfolio-site` directory:
```powershell
cd "c:\Users\SnapCopy\OneDrive\Documents\New folder\portfolio-site"
npx.cmd vercel
```
- Select your Vercel account.
- Accept default settings (No build command needed).
- Run `npx.cmd vercel --prod` to deploy directly to production.

---

### Method 2: Deploy via GitHub (Automatic CI/CD)
1. Initialize a Git repository inside `portfolio-site`:
   ```powershell
   cd "c:\Users\SnapCopy\OneDrive\Documents\New folder\portfolio-site"
   git init
   git add .
   git commit -m "Initial commit: Raymond Thomas Vibe Coder Portfolio"
   gh repo create vibe-coder-portfolio --public --source=. --remote=origin --push
   ```
2. In your [Vercel Dashboard](https://vercel.com/new):
   - Click **"Add New... Project"**
   - Select `thepros2014/vibe-coder-portfolio`
   - Click **Deploy**

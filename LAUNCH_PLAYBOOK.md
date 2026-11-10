# 🚀 Anusandhan (अनुसंधान) — Multi-Platform Launch & Listing Playbook

**Target Product:** Anusandhan (अनुसंधान)  
**Live Production URL:** https://anusandhan.vercel.app  
**GitHub Repository:** https://github.com/soumyadeepsarkar-2004/Anusandhan (MIT License)  
**VitePress Documentation:** https://soumyadeepsarkar-2004.github.io/Anusandhan/  
**Direct App Downloads:**
- Android APK: `https://anusandhan.vercel.app/downloads/anusandhan-v1.0.apk`
- Windows Installer: `https://anusandhan.vercel.app/downloads/anusandhan-setup-1.0.0.exe`
- macOS DMG: `https://anusandhan.vercel.app/downloads/anusandhan-1.0.0-universal.dmg`

---

## 1. Product Hunt Launch Package

* **Direct Submission URL:** `https://www.producthunt.com/posts/new`
* **Scheduling Tip:** Schedule for Tuesday or Wednesday at **12:01 AM PST** for maximum daily reach.

### Metadata
* **Name of Product:** `Anusandhan`
* **Tagline (<60 chars):** `Autonomous research internships & grounded outreach engine` *(58 chars)*
* **Alternative Taglines:**
  - `Democratizing research internships with autonomous AI` *(53 chars)*
  - `Autonomous research intelligence & outreach platform` *(52 chars)*
* **Links:**
  - Primary URL: `https://anusandhan.vercel.app`
  - GitHub Repo: `https://github.com/soumyadeepsarkar-2004/Anusandhan`
* **Primary Category:** `Education`, `Artificial Intelligence`, `Developer Tools`
* **Tags / Topics:** `Artificial Intelligence`, `Open Source`, `Education`, `Productivity`, `Academic Research`, `EdTech`
* **Pricing Model:** `Free / 100% Open Source (MIT)`

### Short Description (Max 260 characters)
> An autonomous research internship intelligence engine. Discovers funded labs (IISc, IITs, MIT, CERN), evaluates candidate Research Readiness Scores (RRS), and drafts 146-word literature-grounded pitches citing 2024–2026 papers. Free & 100% open source.

### Full Product Description
```markdown
Anusandhan (अनुसंधान — Sanskrit for *systematic discovery*) is a free, open-source autonomous intelligence platform designed to level the global playing field for undergraduate and graduate researchers across Science, Technology, Humanities, Commerce, and Law.

Every year, millions of ambitious students from non-elite or regional colleges dream of working with world-class research labs. Instead, they hit two walls:
1. They don't know which labs have active research grants (DST, MeitY, CSIR, NSF, ERC).
2. They send generic spam cold emails ("Respected Sir, please give me internship") that professors instantly delete.

Anusandhan fixes this end-to-end:
⚡ 24/7 Autonomous Scraper: Polls arXiv, OpenAlex, Semantic Scholar, and top university vacancy portals every 30 minutes.
🎯 146-Word Literature-Grounded Pitches: Eliminates template spam by citing 3 distinct proof-of-work items (2024-2026 preprints + personal code replication).
📊 Interactive RRS (Research Readiness Score): 5-dimension radar diagnostic evaluating CV depth, paper familiarity, and etiquette before outreach.
🎙️ Multilingual Academic Voice Mentor: Web Audio API & Gemini Live streaming for viva and mock interview prep in English, Hindi, and regional dialects.
🌐 Universal Cross-Platform: Live PWA on Vercel, native Android APK (Capacitor 8), and desktop binaries for Windows and macOS (Electron 45).
🛡️ Ethical by Design: Mandatory human-in-the-loop review, 7-day polite pacing, DPDP Act 2023 & GDPR compliant. Zero paywalls.
```

### Maker First Comment (Sticky Post)
```markdown
Hey Product Hunt community! 👋

I'm Soumyadeep, creator of Anusandhan (अनुसंधान). 

Like many students from regional institutions, I watched brilliant peers give up on academic research simply because they lacked the institutional pedigree or insider connections to get into premier labs like IISc, TIFR, Max Planck, or MIT. 

At the same time, professors receive 50+ generic, template-cloned cold emails every single morning—and delete them in seconds. The system was failing both sides.

We built Anusandhan to solve this with engineering:
1. Instead of scraping stale job boards, our autonomous background engine continuously parses arXiv, OpenAlex, and funding grant registries every 30 minutes.
2. Instead of AI-generated fluff, our pitch engine enforces an empirical 146-word constraint that bridges the candidate's actual GitHub repositories and coursework into the professor’s latest 2024–2026 papers.
3. It is 100% free and open-source under the MIT license, backed by accessible models (Gemini 3.8 Flash, DeepSeek-R1, and local heuristics) so that financial background never gates research opportunity.

You can try the web platform immediately (no sign-up required to search): https://anusandhan.vercel.app
Or inspect our open-source codebase & benchmarks: https://github.com/soumyadeepsarkar-2004/Anusandhan

I would love to hear your feedback, feature ideas, and critiques from researchers, mentors, and developers here! 🙏
```

---

## 2. Hacker News (Show HN) Package

* **Direct Submission URL:** `https://news.ycombinator.com/submit`
* **Submission Guidelines:** HN strictly penalizes buzzwords, emojis in titles, and promotional hype. Stick to technical substance, architecture, benchmarks, and problems solved.

### Submission Title
`Show HN: Anusandhan – Open-source research internship engine with literature-grounded outreach`

### Post Body / First Comment (Markdown)
```markdown
Hi HN,

We built Anusandhan (अनुसंधान — Sanskrit for *systematic research*), an open-source autonomous intelligence platform to help undergraduate and graduate scholars match with funded research labs and draft literature-grounded cold outreach:

Live site: https://anusandhan.vercel.app  
GitHub: https://github.com/soumyadeepsarkar-2004/Anusandhan  
Documentation & Benchmarks: https://soumyadeepsarkar-2004.github.io/Anusandhan/

### The Problem
Academic cold outreach is broken on both ends:
1. Students from non-target or tier-2/3 institutions blast hundreds of generic template emails ("Respected Professor, please review my attached CV").
2. Principal Investigators (PIs) at premier labs (IISc, IITs, MIT, CERN, Max Planck) receive 40–80 emails a day, of which >95% show zero familiarity with their recent work and are immediately deleted.
3. Information about funded lab vacancies (DST, MeitY, CSIR, NSF, ERC) is scattered across unindexed department websites and preprint servers.

### How It Works & Architecture
Anusandhan is architected as a hybrid microservice system:
- **Client Tier:** React 18, TypeScript, Tailwind CSS, Vite 5, Framer Motion. Also packaged for Android via Capacitor 8 and desktop via Electron 45. Includes an IndexedDB offline outbox queue with cryptographic idempotency keys for spotty campus networks.
- **API Gateway (BFF):** Node.js 22, Express 4.21, Helmet, JWT auth with 14-day rotation, sliding-window rate limiters, and an in-memory / BullMQ async crawler scheduler running every 30 minutes.
- **AI & Literature Microservice:** Python 3.12, FastAPI, LangChain, Google Gemini 3.8 Flash, and DeepSeek-R1 for chain-of-thought gap analysis.
- **Literature Harvester:** Ingestion engine querying arXiv APIs, OpenAlex Scholarly Graph, and Semantic Scholar to extract recent publications (2024–2026), co-authorship ratios, and open research challenges.
- **146-Word Pitch Synthesis:** Enforces empirical cold-email parameters (under 150 words, exactly 3 proof-of-work citations connecting the student's code/preprints to the PI's unsolved challenge).
- **Research Readiness Score (RRS):** Generates a 5-vector radar diagnostic evaluating CV depth, paper comprehension, and etiquette before outreach is permitted.

### Ethical Safeguards & DPDP Act 2023
- Strict Human-in-the-Loop: No automated email blasting. The platform produces a grounded draft that the scholar must review and dispatch themselves.
- 7-Day Follow-Up Pacing: Automatic state tracking prevents follow-ups within 7 days, avoiding inbox harassment.
- Fully compliant with India's DPDP Act 2023 and GDPR; no student telemetry or portfolio data is monetized.

### Concurrency Benchmarking
Under our k6 benchmark tests, the hardened Node.js gateway and FastAPI microservice maintained sub-50ms p95 read latencies and sustained 1,000 concurrent users with 0.00% error rate.

The project is MIT licensed. We would love feedback from grad students, PIs, and distributed systems engineers on both the literature retrieval pipelines and the prompt constraints.
```

---

## 3. Peerlist Project Showcase

* **Direct Submission URL:** `https://peerlist.io/projects/new` (or "Add Project" in Profile)
* **Project Name:** `Anusandhan`
* **Tagline:** `Autonomous research internship intelligence & literature-grounded outreach platform`
* **Live Demo URL:** `https://anusandhan.vercel.app`
* **GitHub Repository:** `https://github.com/soumyadeepsarkar-2004/Anusandhan`
* **Category:** `Artificial Intelligence`, `Open Source`, `Developer Tools`, `EdTech`
* **Tech Stack Tags:** `React`, `TypeScript`, `Vite`, `Tailwind CSS`, `Node.js`, `Express`, `Python`, `FastAPI`, `LangChain`, `Google Gemini`, `Capacitor`, `Electron`, `SQLite`, `Docker`

### Project Description / Case Study
```markdown
### What is Anusandhan?
Anusandhan is an autonomous research matching and literature-grounded outreach engine that democratizes research opportunities for curious students across Science, Engineering, Humanities, Commerce, and Law.

### The Problem It Solves
Millions of students want research experience at premier institutions (IISc, IITs, MIT, CERN, Max Planck) but struggle with discovery and cold emailing. Professors reject 99% of emails because they are generic spam. Anusandhan transforms this by tracking live grant funding and drafting hyper-targeted 146-word pitches citing verified 2024-2026 research publications.

### Key Highlights
- 🔍 24/7 Autonomous Crawler: Syncs with arXiv, OpenAlex, and lab portals every 30 minutes.
- 🎯 146-Word Outreach Composer: Generates literature-grounded emails with verified code reproduction citations.
- 📊 Research Readiness Score (RRS): 5-dimension radar diagnostic detecting CV gaps before professors auto-reject.
- 🎙️ Multilingual Voice Mentor: Gemini Live & Web Audio API for viva and mock interview prep in English & Hindi.
- 📱 Universal Cross-Platform: Live PWA on Vercel + Android APK + Windows & macOS desktop builds.
- 🛡️ Privacy & Ethics: DPDP Act 2023 compliant, mandatory human confirmation, 7-day pacing.
```

---

## 4. Twitter / X Launch Thread

* **Target Format:** 7-tweet high-retention thread with media placeholders, code blocks, and CTA.

### Tweet 1 (The Hook)
> 99% of academic cold emails sent by students get deleted in under 3 seconds.
>
> Why? Because sending "Respected Sir, please give me internship + generic CV" is pure spam.
>
> We built Anusandhan (अनुसंधान) to fix this with autonomous AI.
>
> Free, open-source, and live today 🧵👇
> [Media: 15s UI preview GIF / video showcasing Command Palette ⌘K and Lab Discovery]

### Tweet 2 (The Real Problem)
> Professors at IISc, IITs, MIT, and Max Planck receive 50+ identical cold emails every morning.
>
> Meanwhile, ambitious scholars from regional colleges with genuine coding/research talent have zero alumni network to break through.
>
> We treated this as an Information Retrieval and Grounding problem.

### Tweet 3 (The 146-Word Engine)
> Empirical studies show that academic cold emails over 150 words have a steep drop-off in replies.
>
> Anusandhan enforces a strict 146-word constraint:
> 1. Solves the professor's specific open problem
> 2. Cites their latest 2024–2026 preprints
> 3. Links 3 verifiable student code reproductions
>
> Zero generic fluff.

### Tweet 4 (The 24/7 Harvester & RRS Studio)
> What's happening under the hood?
>
> ⚙️ Autonomous Background Crawler: Harvests arXiv, OpenAlex, and funded lab grants (DST, MeitY, CSIR, NSF, ERC) every 30m.
> 📊 RRS Diagnostic Studio: Radar analysis of your CV across 5 dimensions, identifying why a lab might reject you BEFORE you apply.

### Tweet 5 (Multilingual Voice Mentor)
> We also integrated AnusandhanAI—a real-time voice mentor powered by Web Audio API and Gemini Live streaming.
>
> Students can run mock viva and interview prep in English, Hindi, and regional dialects directly in the browser or on our Android APK.

### Tweet 6 (The Tech Stack & Concurrency)
> Built with production-grade engineering:
> ⚡ Frontend: React 18, TypeScript, Tailwind CSS, Vite 5, Framer Motion
> 🛡️ Gateway: Node.js 22, Express 4.21, Rate Limiters, JWT
> 🧠 AI Microservice: Python 3.12, FastAPI, Gemini 3.8 Flash + DeepSeek-R1
> 📦 Cross-Platform: Capacitor 8 (Android) + Electron 45 (Desktop)
> 🚀 Verified 1,000 concurrent user benchmark at <50ms p95 latency.

### Tweet 7 (100% Free & Open Source - CTA)
> Research access should NEVER depend on your university rank or wallet.
>
> Anusandhan is 100% free and MIT-licensed.
>
> 🌐 Web App: https://anusandhan.vercel.app
> 📦 GitHub: https://github.com/soumyadeepsarkar-2004/Anusandhan
> 📚 Docs: https://soumyadeepsarkar-2004.github.io/Anusandhan/
>
> If this helps you or someone you know, drop a ⭐ on GitHub and share! 🔁

---

## 5. LinkedIn Launch Post

```markdown
Academic cold outreach is fundamentally broken.

Every semester, undergraduate and graduate students across the world send tens of thousands of cold emails seeking research internships. For students studying outside premier tier-1 institutions, cold emailing is often the only route to break into world-class research labs.

Yet over 95% of these emails end up in the trash folder within three seconds.

Why? Because students resort to generic, templated flattery: "Respected Professor, I am deeply passionate about your work. Please find my CV attached." Meanwhile, lab directors and Principal Investigators (PIs) at institutions like IISc Bangalore, IIT Bombay, Max Planck, CERN, and MIT receive 40 to 60 of these every morning without any proof of domain familiarity.

To bridge this gap, we built and open-sourced **Anusandhan (अनुसंधान)** — an autonomous research intelligence and literature-grounded outreach platform.

🔗 Live Web Platform: https://anusandhan.vercel.app
📦 GitHub Repository: https://github.com/soumyadeepsarkar-2004/Anusandhan
📚 Documentation: https://soumyadeepsarkar-2004.github.io/Anusandhan/

### What makes Anusandhan fundamentally different:

1. **Active Grant & Lab Intelligence**: A 24/7 background ingestion engine that monitors arXiv, OpenAlex, Semantic Scholar, and government funding registries (DST, MeitY, CSIR, NSF, ERC) every 30 minutes to uncover funded lab openings before they appear on commercial job boards.
2. **Multi-Disciplinary Scope**: Fully calibrated across 5 academic faculties—not just Computer Science, but Arts & Humanities, Commerce & Economics, Natural Sciences, and Law.
3. **The 146-Word Outreach Standard**: Grounded in empirical outreach research, Anusandhan constrains pitch generation to 146 words, synthesizing 3 verifiable proof-of-work citations that link the student's personal GitHub code repositories and preprints directly to the professor’s latest 2024–2026 publications.
4. **Research Readiness Score (RRS) Studio**: An interactive 5-dimension radar diagnostic that identifies CV and skill gaps *before* a student submits an outreach email.
5. **Ethical & DPDP Act 2023 Compliant**: Built-in 7-day polite pacing to prevent follow-up inbox spam, mandatory human-in-the-loop review, and absolute data minimization.

Anusandhan is universal and cross-platform: available as a Web PWA, Android APK (Capacitor 8), and native Windows and macOS desktop applications (Electron 45).

Most importantly, it is **100% free and open-source (MIT License)**. Financial background should never be a gatekeeper to research curiosity.

If you are a student preparing for upcoming research fellowship cycles (DAAD, Mitacs, CERN, Bose, IISc), or a professor interested in seeing how structured outreach can filter high-signal candidates, we welcome you to explore the platform.

Contributions, issues, and stars are warmly welcome on our GitHub repository!

#OpenSource #AcademicResearch #HigherEducation #MachineLearning #EdTech #ArtificialIntelligence #STEM #ResearchInternships #Engineering
```

---

## 6. Reddit Launch Posts

### r/SideProject
* **Title:** `I built Anusandhan – a free, open-source engine to find research internships & write literature-grounded pitches without spamming professors`
* **Link:** `https://anusandhan.vercel.app`
* **Summary:** Solves academic cold email rejection by indexing funded labs (DST, MeitY, NSF, ERC) and constraining pitches to 146 words citing 2024–2026 publications.

### r/MachineLearning
* **Flair:** `[P] Project`
* **Title:** `[P] Anusandhan: Open-source literature-grounded matching engine for academic research (arXiv/OpenAlex scraper + DeepSeek/Gemini reasoning)`
* **Summary:** Rigorous technical breakdown of autonomous scholarly ingestion, triple-citation constraints, and concurrency benchmarking (1,000 users @ <50ms latency).

### r/developersIndia
* **Title:** `I built Anusandhan: A free & open-source platform to help Indian students find research internships without spamming professors`
* **Summary:** Built specifically to help tier-2/3 college students break into premier labs (IISc, IITs, Max Planck, MIT) through verifiable proof-of-work instead of pedigree.

---

## 7. Submission Checklist & Timing

| # | Platform | URL | Best Time (PST/IST) |
|---|---|---|---|
| 1 | **Product Hunt** | `https://www.producthunt.com/posts/new` | Tuesday 12:01 AM PST |
| 2 | **Hacker News** | `https://news.ycombinator.com/submit` | Mon–Wed 8:00 AM EST |
| 3 | **Peerlist** | `https://peerlist.io/projects/new` | Weekday 10:00 AM IST |
| 4 | **Twitter / X** | `https://x.com/compose/tweet` | Weekday 7:30 PM IST |
| 5 | **LinkedIn** | `https://www.linkedin.com/feed/` | Tue–Thu 10:00 AM IST |
| 6 | **Reddit** | `r/SideProject`, `r/MachineLearning`, `r/developersIndia` | Sat/Sun Morning EST |
| 7 | **Dev.to** | `https://dev.to/new` | Wednesday Morning |

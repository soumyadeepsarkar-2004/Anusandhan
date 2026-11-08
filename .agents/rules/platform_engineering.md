# Platform Engineering & UI Standards

## 1. Zero Synthetic / Demo Data Policy
- Never leave synthetic, disconnected, or hardcoded mock datasets in production UI components or API responses.
- All institutional profiles, citations, grants, and fellowship calls must either:
  1. Be ingested directly from authoritative open-access APIs (e.g., OpenAlex, ArXiv, institutional portals).
  2. Be dynamically computed from verifiable ISO date boundaries (`openDate`, `targetDeadline`) into `active`, `upcoming`, or `passed` states with direct, functioning official application URLs.
- Always implement Redis caching (sub-5ms) with automated background synchronization sweeps (e.g., 6-hour cron intervals) so no human operator is required to maintain dates.

## 2. Discrete Multi-Modal Voice & Chat Assistant Architecture
- **No Disruptive Full-Screen Overlays**: Voice or chatbot triggers must not hijack the entire viewport or present a clunky full-screen takeover.
- **Floating Bottom-Right Capsule**: Position the assistant discreetly at `bottom-20 sm:bottom-6 right-4 sm:right-6 z-40` (collapsible) and elevate to `z-50` when expanded.
- **Inline Audio & Processing Micro-Interactions**: When the user activates the microphone or triggers a query, show an inline soundwave pulse and loading indicator (`Processing...`) rather than abruptly expanding the panel.
- **Intentional Expansion**: Provide a small notification pill and a toggle arrow (`ChevronUp`) to open the expanded chatbox only when the user desires to read transcripts or switch models.
- **Free & Open-Source Model Switcher**: Support 24/7 model selection across high-speed reasoning (Gemini Flash), open-source academic intelligence (Llama 3 70B, DeepSeek R1, Mistral NeMo), and offline deterministic engines.
- **End-to-End Action Execution**: The assistant must be capable of executing internal platform commands (navigating tabs, filtering opportunities by status, auditing uploaded CVs, checking professor reply notifications) with spoken voice feedback.

## 3. Card Grid & Pricing Baseline Alignment
- In any 3-column or multi-column pricing/feature card layout:
  - Header slots MUST have identical locked heights (e.g., `h-8`).
  - Description slots MUST have identical locked heights (e.g., `h-10 line-clamp-2`).
  - Pricing rows MUST be locked to a uniform container height and baseline alignment (e.g., `h-16 flex items-baseline`).
  - Feature lists MUST specify a uniform minimum height (e.g., `min-h-[175px]`).
- Banners or badges (e.g., *"Recommended for Applicants"*) must NEVER push card contents down. Anchor them with absolute positioning (e.g., `absolute -top-3 left-1/2 -translate-x-1/2`) to preserve pixel-perfect horizontal alignment across all tiers.

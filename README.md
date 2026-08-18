# North Star Support Bot

> Customer Support Chatbot for North Star Outdoor Co. — Outdoor Apparel & Camping Gear

---

## Quick Start

```bash
npm install
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

No API keys, accounts, or external services required. Everything runs locally out of the box.

---

## Overview

A fully offline, rule-based customer support chatbot built for **North Star Outdoor Co.**, a small e-commerce business specializing in outdoor apparel and camping gear.

**Key highlights:**
- Zero external API dependencies — 100% deterministic, instant responses
- Friendly, helpful, outdoorsy tone matching the North Star brand
- Rich visual UI with order tracking stepper, product cards, and live agent simulation
- Dark & light theme support
- Handles typos and natural language variations via multi-layer NLP

---

## Core Use Cases

### 1. Order Tracking
- Ask for order number if not provided
- **Order #111**: Shipped, arriving tomorrow (with carrier & tracking info)
- **Order #222**: Processing, ships in 24 hours
- **Order #333**: Delivered (with proactive follow-up question)
- **Any other number**: Politely reports order not found

### 2. Returns & Exchanges
- **30-day return window** from delivery date
- Items must be **unused** and in brand-new condition
- **Original packaging** required
- Self-service returns portal link provided: `northstaroutdoor.com/returns`

### 3. Product Recommendations (2-Step Flow)
- **Step 1**: Asks a clarifying question about adventure type / weather conditions
- **Step 2**: Delivers tailored gear recommendations with specs, pricing, and photos

### 4. Human Handoff
- Triggered by explicit request ("talk to a live agent") or frustration detection
- Transitions to simulated **Live Agent** state with assigned specialist
- User can return to automated bot at any time via banner button or typing "menu"
- Proactive escalation offered after 2+ unrecognized inputs

### 5. Fallback Handling
- Clear "I didn't understand" response
- Lists available topics
- Offers live agent escalation

---

## Shipping Information

| Option | Delivery Time |
|--------|--------------|
| Standard Ground | 3-5 business days |
| Expedited Air | 1-2 business days |

---

## Technical Architecture

```
server/                      Backend (Express + TypeScript)
  index.ts                   REST API server (port 3001)
  config.ts                  Store policies & constants
  types.ts                   Domain interfaces
  db/
    mockData.ts              Exact mock orders, policies, product catalog
    database.ts              Data access layer
  services/
    agentService.ts          Main orchestrator (4-layer NLP pipeline)
    orderService.ts          Order tracking logic
    returnService.ts         Return policy handler
    catalogService.ts        2-step recommendation engine
    handoffService.ts        Live agent handoff & fallback
    guardrailService.ts      Prompt injection & abuse protection
    nlp/
      intentClassifier.ts    Naive Bayes + TF-IDF + regex patterns
      entityExtractor.ts     Order numbers, emails, product terms
      fuzzyMatcher.ts        Levenshtein / Jaro-Winkler typo tolerance
      semanticVectorizer.ts  TF-IDF cosine similarity engine
      synsetLemmatizer.ts    Synonym normalization
      responseMatrix.ts      Deterministic response templates
      types.ts               NLP type definitions

src/                         Frontend (React + TypeScript + Tailwind)
  App.tsx                    Root layout & state management
  components/
    Header.tsx               Brand header with theme toggle
    ChatWidget.tsx           Message stream & input
    MessageItem.tsx          Markdown renderer + rich cards + quick replies
    QuickActions.tsx         Opening 4-button capsules
    QuickReplies.tsx         Contextual suggestion chips
    BotLogo.tsx              Animated bot avatar
    cards/
      OrderCard.tsx          Order status with progress stepper
      ReturnCard.tsx         Return policy card & shipping info card
      ProductCard.tsx        Product recommendations & gear quiz
      HandoffCard.tsx        Live agent receipt & fallback help card
```

---

## Intent Recognition

The NLP pipeline handles natural language variations through 4 layers:

1. **Deterministic Patterns** — High-precision regex for exact matches (always wins when it fires)
2. **Semantic Vectorizer** — TF-IDF cosine similarity against intent centroids
3. **Naive Bayes Classifier** — Statistical classification with Laplace smoothing + post-classification validation
4. **Fuzzy Matching** — Damerau-Levenshtein + Jaro-Winkler for typo tolerance

Additional intelligence:
- **Topic-shift detection** — Recognizes when a user says something unrelated mid-flow and escapes gracefully
- **Verb vs noun disambiguation** — "I want to order pizza" (verb) vs "my order #111" (noun)
- **Disambiguation prompts** — When the classifier is unsure, asks "Did you mean X or Y?" instead of guessing
- **Bounded retries** — Never loops forever; offers escape after 3 failed attempts
- **Auto-escalation** — 3 consecutive misunderstandings auto-connects to live agent

Supports variations like:
- "Where is my order?" / "Track my package" / "Where's my order #111?"
- "What's your return policy?" / "How do I return an item?" / "30 day return rules"
- "cancle" / "warrenty" / "trak my packge" (typo handling)


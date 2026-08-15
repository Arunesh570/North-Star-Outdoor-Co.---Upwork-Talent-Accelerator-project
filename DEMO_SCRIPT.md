# 🎬 Upwork Talent Accelerator: 2–3 Minute Video Demo Script

**Project**: Customer Support Chatbot for Small E-Commerce (Outdoor Apparel & Camping Gear)  
**Brand**: North Star Outdoor Co.  
**Bot Persona**: "North Star Support Bot" — Friendly, helpful, outdoorsy, concise  
**Architecture**: 100% Deterministic Rule-Based Precision Engine (Zero-AI / Zero-Latency)  
**Target Video Duration**: 2 Minutes 30 Seconds

---

## 🕒 Timing & Scene Breakdown

```
[0:00 - 0:25] ➔ Scene 1: Project Overview & Rule-Based Philosophy
[0:25 - 0:55] ➔ Scene 2: Use Case 1 — Order Tracking (#111, #222, #333, #999)
[0:55 - 1:25] ➔ Scene 3: Use Case 2 — Returns & Exchanges (30-Day Policy & Link)
[1:25 - 1:55] ➔ Scene 4: Use Case 3 — Product Recommendations (2-Step Guided Flow)
[1:55 - 2:20] ➔ Scene 5: Use Case 4 — Human Handoff & Return to Main Menu
[2:20 - 2:40] ➔ Scene 6: Fallback Handling Scenario & Conclusion
```

---

## 🎙️ Scene-by-Scene Script & Action Walkthrough

### Scene 1: Introduction & Philosophy (0:00 – 0:25)
- **On Screen**: Application loaded at `http://localhost:5173`. Show the clean Alpine theme, brand header, and 1-click test toolbar.
- **What to Say**:
  > *"Hi everyone! In this video, I'm presenting the customer support chatbot for **North Star Outdoor Co.**, a small e-commerce business selling outdoor apparel and camping gear.*
  >
  > *Rather than using unpredictable AI generation, this chatbot is engineered as a **100% reliable, rule-based assistant**. Every fact comes strictly from a fixed, verified source of truth. As a user, it opens instantly with zero setup, zero API keys, and delivers information through clean, scannable visual cards rather than walls of text."*

---

### Scene 2: Use Case 1 — Order Tracking (0:25 – 0:55)
- **On Screen**: 
  1. Click **Order #111 (Shipped)** on the toolbar.
  2. Click **Order #222 (Processing)**.
  3. Click **Order #333 (Delivered)**.
  4. Click **Order #999 (Invalid)**.
- **What to Say**:
  > *"Let's test our first core use case: **Order Tracking**. Our mock database contains exact predefined orders:*
  >
  > *For **Order #111**, it returns **Shipped, arriving tomorrow** with a 4-stage visual timeline stepper and UPS tracking.*
  >
  > *For **Order #222**, it returns **Processing, ships in 24 hours**.*
  >
  > *For **Order #333**, it displays **Delivered**, and proactively asks our post-delivery follow-up question regarding fit and sizing.*
  >
  > *And if a customer checks an unlisted number like **#999**, the bot honestly states it's an invalid order and suggests trying valid numbers."*

---

### Scene 3: Use Case 2 — Returns & Exchanges (0:55 – 1:25)
- **On Screen**: Click **30-Day Returns & Link** on the toolbar.
- **What to Say**:
  > *"Next is **Returns & Exchanges**. When a customer inquires about returns, the bot clearly lays out our three core policy rules in a scannable 3-card grid:*
  >
  > *1. A **30-day return window** from delivery.*
  > *2. Items must be **unused**.*
  > *3. **Original packaging** and hangtags are required.*
  >
  > *It also provides a direct, clickable link to our self-service returns portal at `northstaroutdoor.com/returns`."*

---

### Scene 4: Use Case 3 — Product Recommendations (1:25 – 1:55)
- **On Screen**: 
  1. Click **Gear Finder (Clarifying Quiz)**.
  2. In the card, click **Rainy & Wet Trail Hiking**.
- **What to Say**:
  > *"For **Product Recommendations**, the bot doesn't just dump products immediately. It uses a **2-step guided interaction**.*
  >
  > *First, it asks a quick clarifying question about the customer's upcoming trip conditions. When I select **Rainy & Wet Trail Hiking**, it recommends our technical **StormShield 3L Rain Shell**, highlighting its 20,000mm waterproof rating, pit zips, price, and customer rating."*

---

### Scene 5: Use Case 4 — Human Handoff (1:55 – 2:20)
- **On Screen**: 
  1. Click **Live Agent Handoff**.
  2. Type a message like `"Can you check if you have size XL in stock?"`.
  3. Click the green **Return to Main Menu** button on the card.
- **What to Say**:
  > *"When a customer needs human assistance, the bot transitions seamlessly into a **Simulated Live Agent State** with an assigned specialist and session ID.*
  >
  > *Critically, this is **never a dead end**. The user can chat with the live specialist, or click **Return to Main Menu** at any time to instantly resume interacting with the automated bot."*

---

### Scene 6: Fallback Handling & Conclusion (2:20 – 2:40)
- **On Screen**: Click **Fallback Handling** (sends *"Tell me a joke about airplanes"*), then open the **Store Cheat Sheet (DB)** drawer.
- **What to Say**:
  > *"Finally, if a customer asks something out of scope like 'Tell me a joke about airplanes', the bot politely handles the **Fallback Scenario**—clearly stating it didn't understand and offering our 4 main topics or Live Agent escalation.*
  >
  > *Evaluators can also open the **Store Cheat Sheet** drawer to inspect all mock data and policy rules in real time. Thank you!"*

---

## 💡 Quick Checklist Before Recording:
- [x] Resolution: 1080p full screen browser
- [x] Server running on `http://localhost:5173`
- [x] All 4 core use cases demonstrated
- [x] Fallback scenario demonstrated
- [x] Return to Main Menu after Live Agent demonstrated

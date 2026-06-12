# Portfolio Case Studies — Content Base
> Outcome-first. Audience: hiring managers & recruiters at product companies.
> Каждый кейс начинается с результата, потом раскрывает историю.
> Документ — основа для наполнения сайта. Визуальные ассеты добавляются отдельно.

---

## Структура каждого кейса на сайте

```
[Hero: Title + Tagline + Outcome stat]
[Context: 2-3 предложения — что за продукт, кто пользователи]
[My Role: одна строка]
[The Problem: что было сломано или чего не хватало]
[Key Insight: почему решение именно такое]
[Solution: что спроектировал, как это работает]
[Impact: цифры + качественный результат]
[Reflection: чему научил кейс — честно, не шаблонно]
[Visuals: плейсхолдеры для скриншотов/мокапов]
```

---

---

# Case 01 — Price Exploration
**Bidding Optimization · InsurTech · B2B SaaS**

---

## Hero

**Title:** Price Exploration

**Tagline:** Turning a non-linear bidding algorithm into a self-service decision tool for insurance media buyers.

**Outcome stats (показывать крупно):**
- $8M → $30M+ monthly media investment scaled over 12 months
- 7% month-over-month growth in policy binds
- 4 phases of product evolution — from ad group level to any cohort

---

## Context

MarketingOS is a B2B SaaS platform built for top U.S. insurance carriers. It helps media buyers manage customer acquisition — bids, campaigns, channels, and budgets — at scale. The platform handles millions of dollars in weekly ad spend across dozens of channels and hundreds of segments.

Insurance customer acquisition is expensive and highly competitive. Carriers pay per lead, but the relationship between bid price and business outcome is non-linear and unpredictable — a 5% bid increase might generate 1% more leads or 10%. Nobody knows in advance.

---

## My Role

Sole product designer on a cross-functional team (PM, data scientists, engineers). Owned the feature end-to-end across all 4 phases — from initial concept to final handoff and QA.

---

## The Problem

Media buyers at insurance companies were setting bids manually, based on intuition and limited historical data. The core issue: there was no reliable way to know what price to pay for a lead in a given market segment.

This led to two failure modes:
- **Overpaying** — spending more than necessary on traffic that doesn't convert
- **Underinvesting** — leaving quality traffic on the table by bidding too low

The stakes were high. A wrong pricing decision on a major cohort could cost hundreds of thousands of dollars per month, or cause the client to miss their growth targets entirely.

---

## Key Insight

The algorithm existed. Data scientists had built a price experimentation engine that could run controlled tests on portions of traffic and measure real impact. The problem wasn't the math — it was that the output was inaccessible to the people who needed to act on it.

Media buyers aren't data scientists. They needed to understand what the system found, trust the recommendation, see the projected impact, and apply the change — without digging into SQL or asking an analyst.

**The design job was translation: from algorithm output to confident human decision.**

---

## Solution

### Phase 1 — Ad Group Price Exploration
First version: recommendations at the ad group (state) level. Users could see the system's suggested price change, the projected effect on lead volume and CPB, and apply it in one click. First time media buyers could make data-driven bid decisions instead of guessing.

### Phase 2 — Bidding Group Optimization
Problem: the same insurance product often appeared across multiple traffic sources, getting different recommendations despite identical business economics. We grouped them into Bidding Groups — representing a single product regardless of traffic source. Recommendations became more statistically significant and aligned to actual business logic.

### Phase 3 — Channel & Channel Group Optimization
Different channels (Search, Social, Affiliate, Marketplace) respond to price changes differently. Phase 3 extended the system to channel level — finding the optimal price not just for a product, but for each channel's unique characteristics. Users could now reallocate budget toward channels with room to grow and reduce spend on those that couldn't scale.

### Phase 4 — Universal Cohort Exploration
The final evolution: any cohort the platform supports. Users could run price exploration on any business segment they defined — not just the predefined structures. Price Exploration transformed from a bid optimization tool into a universal price research platform.

**UI principles across all phases:**
- Recommendation always paired with projected impact (leads, CPB delta, cost)
- Confidence indicators — surface how much data backs the recommendation
- One-click apply — no friction between insight and action
- Clear separation: what the system found vs. what the user decides

---

## Impact

- Directly supported scaling media investment from **$8M to $30M+ per month** over 12 months
- Contributed to **7% month-over-month growth** in policy binds for the flagship design partner
- Reduced time from "data available" to "decision made" from days to minutes
- Enabled clients to optimize at 4 levels of granularity instead of 1

---

## Reflection

This was the project that taught me what it means to design for high-stakes decisions under uncertainty. The algorithm could tell you what it found — but it couldn't tell the user how much to trust it. Designing that trust layer — confidence signals, impact projections, clear framing of test vs. baseline — was harder than any interaction pattern.

The other lesson: domain expertise isn't optional. I spent weeks learning insurance acquisition metrics (CPL, Win Rate, CPB, bind rates) before I could design anything useful. You can't simplify what you don't deeply understand.

---

## Visuals (плейсхолдеры)

- [ ] Phase 1 UI — Ad Group recommendation card with impact projection
- [ ] Phase 2 UI — Bidding Group view, multi-source consolidation
- [ ] Phase 3 UI — Channel comparison, outlier highlighting
- [ ] Phase 4 UI — Universal cohort selector + recommendation
- [ ] Before/after: manual bid management vs. Price Exploration workflow
- [ ] Annotation: how the recommendation card components work

---

---

# Case 02 — Design System for AI Agents
**Design Systems · AI-native Development · Figma**

---

## Hero

**Title:** Design System for AI Agents

**Tagline:** I built a design system. Then AI agents tried to implement it — and I had to rebuild it for them.

**Outcome stats:**
- Significantly reduced AI agent clarification cycles during implementation
- Improved code generation accuracy across 4 frontend engineers using agentic tools
- Created a replicable model for AI-ready design system documentation

---

## Context

Kissterra's engineering team adopted AI-agent-driven development — using Cursor and Claude Code to implement features directly from Figma designs. With 4 frontend engineers and an accelerating product roadmap, this promised a major productivity leap.

I had built the design system from scratch — migrating the team from Sketch, establishing the component library, design tokens, and visual language. It worked well for human developers. Then we tried it with AI agents.

---

## My Role

Sole product designer. Identified the problem, defined the solution, built the entire context layer — Figma annotations, component docs, and the tooling to keep them in sync.

---

## The Problem

AI coding agents are not experienced developers. An experienced developer looks at a component in a Figma file and draws on years of pattern recognition — they know implicitly when to use a Tooltip vs. a Popover, how a Table handles empty states, or what "disabled" means for an interactive element.

An AI agent doesn't have that implicit knowledge. It only knows what it can read. If the design system doesn't explain it, the agent will guess — and it will guess wrong.

The symptoms we saw:
- Wrong component choices for similar-looking UI patterns
- Missing edge cases and states in implementation
- Long clarification loops between engineers and AI (and engineers and me)
- Inconsistencies that slipped through to production

The design system was complete. It just wasn't legible to machines.

---

## Key Insight

Documentation in design systems has always been written for humans — developers who can infer, ask questions, and apply judgment. AI agents need something different: **explicit, structured, unambiguous context** available at the exact moment of implementation.

The Figma file is where agents start. The repository is where they work. The gap between these two was where quality was breaking down.

**The solution had to live in both places, always in sync.**

---

## Solution

### Context Layer in Figma
Every component in the design system got embedded documentation — short, structured annotations directly attached to the component in Figma:
- **What it is:** one-sentence definition
- **When to use:** specific conditions
- **When NOT to use:** common wrong choices and what to use instead
- **States:** complete list with behavior description
- **Edge cases:** what happens with long text, empty data, loading, errors
- **Do / Don't:** visual examples where behavior is ambiguous

The format was designed for scanning — not prose, not paragraphs. Structured enough for an agent to parse reliably.

### component-doc.md in the Repository
Each component also got a corresponding `component-doc.md` file in the codebase — the same information in Markdown, living alongside the code. Always current (synced with Figma changes), always accessible to the agent's context window during implementation.

### Supporting Tooling
Built specialized workflows (skills) to maintain the system:
- **Figma ↔ repo sync** — detect when a component changes in Figma and flag the doc for update
- **Diff detection** — surface what changed between design versions
- **Doc writing assistance** — structured prompts to generate first-draft docs for new components

### Result: a Two-Layer System
```
Figma (design source)          Repository (implementation)
├── Component visuals          ├── Component code
├── All states & variants      ├── component-doc.md
└── Embedded context docs  ←→  └── Always in sync
         ↑
   AI agent reads both
   during implementation
```

---

## Impact

- Significantly fewer clarification requests from AI agents during feature implementation
- Higher-quality first-pass code generation — correct component choices, complete state coverage
- Faster iteration cycles for frontend engineers
- Created a replicable model: any new component ships with its doc from day one

---

## Reflection

This project changed how I think about design systems entirely. A design system isn't just a library of components for developers — it's a shared language. As the consumers of that language expand to include machines, the language has to become more explicit.

The deeper insight: **documentation is design**. The time I spent writing component docs wasn't maintenance work — it was product work. The quality of those docs directly determined the quality of what got built.

I also learned something about AI agents specifically: they work best when you treat them like a very capable new team member who just joined yesterday. They need context that an experienced developer would already know. Give them that context, and the output is dramatically better.

---

## Visuals (плейсхолдеры)

- [ ] Figma screenshot: component with embedded context annotation
- [ ] Example component-doc.md (rendered Markdown)
- [ ] Before/after: agent output without docs vs. with docs
- [ ] System diagram: Figma ↔ repo sync flow
- [ ] Component library overview shot
- [ ] Token structure / design token examples

---

---

# Case 03 — AI Data Assistant
**Conversational UX · Agentic Design · AI Product**

---

## Hero

**Title:** AI Data Assistant

**Tagline:** Designing a conversational co-pilot for insurance media buyers — where the hard part isn't the chat UI, it's making AI decisions trustworthy enough to act on.

**Outcome stats:**
- Reduced time from "I need to understand my campaign performance" to actionable insight
- Defined UX patterns for trust, explainability, and human-in-the-loop approval
- Designed a roadmap from "suggest" to "execute autonomously"

---

## Context

Media buyers using MarketingOS spend significant time manually navigating dashboards and reports to answer basic questions: Which channels are underperforming? Where should I shift budget? What's driving that CPB spike?

The data exists in the platform. The problem is access — finding the right numbers requires knowing where to look, how to filter, and how to interpret what you see. For new users or complex situations, this could take hours.

The goal: let users query Beacon's data in plain English and get instant, structured, actionable answers.

---

## My Role

Sole product designer. Worked with PM and engineering to define the product vision, interaction model, and UI patterns. Responsible for the full UX — from conversation design to the path toward autonomous action.

---

## The Problem

Building a chat interface is straightforward. Building one that people trust for high-stakes business decisions is not.

The core tension: AI systems can be wrong. In a casual consumer app, a wrong answer is annoying. In a platform where a single decision can move hundreds of thousands of dollars in ad spend, a wrong answer — or a correct answer that looks untrustworthy — is a serious problem.

Key design challenges:
- **Trust:** How does the user know the AI's answer is accurate?
- **Explainability:** Why is the system recommending this specific action?
- **Appropriate confidence:** How does the UI communicate uncertainty without undermining usefulness?
- **Human-in-the-loop:** How do you design the moment between "AI suggests" and "user acts" so the user feels in control?
- **Progressive autonomy:** How does the product evolve from a read-only assistant to an agent that can execute changes — without users feeling the control slipping away?

---

## Key Insight

Most conversational UX frameworks assume the AI is answering questions. This product needed to go further — toward recommendations, and eventually toward action. That changes everything about how you design responses.

A factual answer ("Your CPB in Texas is $42") needs accuracy and source attribution. A recommendation ("I suggest increasing your bid in Texas by 8%") needs all of that plus impact projection, confidence framing, and a clear approval mechanism. An action ("I've increased your bid in Texas by 8%") needs all of that plus an undo path and an audit trail.

**The design architecture had to support all three modes — and be honest with the user about which mode they're in.**

---

## Solution

### Response Architecture
Structured the AI's responses into distinct types — each with its own visual treatment:

- **Data query response:** table or summary card + source reference + time range
- **Analysis response:** insight + supporting data + what it means for the user
- **Recommendation response:** suggested action + projected impact + confidence level + Apply / Dismiss
- **Executed action response:** confirmation + what changed + Undo option

### Trust & Explainability Patterns
- Every recommendation surfaces the data behind it — not hidden in a tooltip, visible by default
- Confidence indicators: explicit framing when data sample is small or timeframe is short
- "Why this?" — one-tap explanation of the recommendation logic in plain language
- Source transparency: which data, which time range, which metric definitions

### Human-in-the-Loop Approval Flow
Designed the critical moment between recommendation and action:
- Recommendation card shows projected before/after impact
- Single confirm action — but confirmation includes a plain-language summary of what will change
- Undo available for a defined window after execution
- Action log: every AI-executed change is timestamped and attributable

### Progressive Autonomy Roadmap
Phase 1 (shipped): Read-only assistant — query data, get analysis, receive recommendations. User executes manually.
Phase 2 (designed, not yet built): Assisted execution — user approves AI recommendations with one click. AI executes.
Phase 3 (vision): Autonomous mode — AI acts within user-defined guardrails, surfaces a digest of actions taken.

The UI was designed so that phases 2 and 3 feel like natural progressions, not jarring new features — the patterns are consistent, the user builds trust incrementally.

---

## Impact

- Reduced time-to-insight for media buyers navigating complex performance data
- Established a UX foundation for AI-assisted and eventually autonomous campaign management
- Created a pattern library for conversational AI in data-heavy B2B contexts — reusable across the platform

---

## Reflection

This was the most conceptually challenging project I've worked on. Not because of interaction complexity, but because of the fundamental question underneath all the design decisions: **how do you design for appropriate trust?**

Too much trust in AI is dangerous — users stop thinking critically and errors go unchecked. Too little trust and the product becomes useless — users ignore recommendations and do everything manually anyway. The design job was finding the calibration.

The other thing I learned: designing AI products requires you to think about failure states as carefully as success states. What does the UI show when the AI is uncertain? When it doesn't have enough data? When it made a mistake? These are design decisions, not engineering footnotes.

---

## Visuals (плейсхолдеры)

- [ ] Chat interface overview — full screen
- [ ] Recommendation card — anatomy with labels
- [ ] Approval flow — before / confirm / confirmed states
- [ ] Response type examples: data query vs. recommendation vs. action
- [ ] Uncertainty state — how low-confidence responses look
- [ ] Progressive autonomy diagram — Phase 1 → 2 → 3

---

---

# Case 04 — Cross-Campaign Management
**Workflow Design · Bulk Editing · B2B SaaS**
*Shorter case — "More Work" section*

---

## Hero

**Title:** Cross-Campaign Management

**Tagline:** When media buyers manage hundreds of campaigns simultaneously, one-by-one editing isn't a UX problem — it's a business blocker.

---

## Context & Problem

MarketingOS users manage complex campaign structures — multiple campaigns, each with ad groups, channels, and targeting segments. Making a strategic change (adjusting a bid strategy, updating targeting across channels) required editing each campaign individually. For large accounts, this was hours of repetitive work and a major source of errors.

---

## Solution

Redesigned the campaign management experience to support bulk editing across campaigns, ad groups, and channels simultaneously. Users could select any combination of entities across campaign boundaries and apply changes in a single operation.

Key design challenges:
- Representing selection state across a deeply nested hierarchy
- Showing the scope of a pending bulk action before it's applied (what exactly will change?)
- Handling mixed states — what happens when selected items have different current values?
- Confirmation patterns for irreversible bulk operations

The feature also became the infrastructure layer for subsequent platform capabilities — Channel Groups, Performance Views, and Cross-Campaign Dashboard all built on top of the same selection and editing model.

---

## Impact

- Reduced time for large-scale campaign updates from hours to minutes
- Enabled self-service for operations that previously required manual support
- Laid the technical and UX foundation for 3 subsequent major features

---

## Visuals (плейсхолдеры)

- [ ] Campaign hierarchy with cross-entity selection
- [ ] Bulk edit panel — mixed state handling
- [ ] Confirmation flow for bulk operations

---

---

# Case 05 — Channel Analysis
**Data Visualization · Recommendations · B2B SaaS**
*Shorter case — "More Work" section*

---

## Hero

**Title:** Channel Analysis & Outlier Detection

**Tagline:** Surfacing the channels that need attention — before the budget damage is done.

---

## Context & Problem

MarketingOS users run traffic across dozens of channels simultaneously. Identifying which channels are underperforming or over-indexed required manual comparison across tables of data — slow, error-prone, and easy to miss.

---

## Solution

Designed a Channel Analysis suite with two core components:

**Channel Outlier Highlighting:** An algorithmic flagging system that identifies channels deviating significantly from expected performance on key metrics (pings-to-leads ratio, CPL, accept rate, share of volume). Outliers are surfaced visually in the channel table with severity levels — users see what needs attention immediately, without scanning every row.

**Channel Groups:** Channels with similar performance characteristics can be grouped and optimized together — reducing the management surface and enabling coordinated bid changes across related traffic sources.

**Recommendations Engine:** Each channel receives a scored recommendation (increase bid, decrease bid, pause, monitor) based on 14 and 30-day performance trends across 8+ KPIs. Recommendations are explainable — users see the scoring logic, not just the output.

---

## Impact

- Reduced time to identify underperforming channels from manual scanning to instant visual detection
- Enabled budget reallocation decisions based on data rather than intuition
- Built the UX foundation for future automated bid execution

---

## Visuals (плейсхолдеры)

- [ ] Channel table with outlier highlighting (severity levels)
- [ ] Channel Groups management UI
- [ ] Recommendation card with scoring breakdown

---

---

# Metadata — для сайта

## Порядок кейсов на главной
1. Price Exploration *(бизнес-импакт + сложный домен)*
2. Design System for AI Agents *(уникальная история, AI-угол)*
3. AI Data Assistant *(AI product design)*
4. Cross-Campaign Management *(workflow + инфраструктурное мышление)*
5. Channel Analysis *(data viz + recommendations)*

## Теги для фильтрации (если нужны)
`B2B SaaS` `InsurTech` `AI Product` `Design Systems` `Data Visualization` `Workflow Design` `Conversational UX`

## Что ещё нужно для каждого кейса
- Визуальные ассеты (скриншоты, мокапы) — Anton готовит параллельно
- Финальные цифры от data analyst (частично получены, добавить в Case 01)
- Password protection или open — решить до публикации

---

*Документ — основа для Claude Code при генерации сайта. Обновлять по мере готовности визуалов и дополнительных данных.*

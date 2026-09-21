# Figma-Standard UI Rules 🎨

> **The Figma-First Frontend Architecture for Vibe Coders & AI Agents.**  
> Code in React/Tailwind that exports into Figma as 100% native, clean Auto Layout frames with zero manual cleanup.

---

## The Problem
When AI agents write frontend code, they use arbitrary CSS: `margin-bottom`, empty spacer `<div>`s, and `display: grid`. When you export that HTML to Figma via `html.to.design` or Builder.io, Figma generates un-autolayouted frames, fixed pixel boxes, and broken padding.

## The Solution
This skill forces AI agents to code strictly using **Figma's Auto Layout mental model**:
1. **Flexbox Only**: `flex-col` (Vertical) and `flex-row` (Horizontal). Zero CSS Grid.
2. **Gap & Padding Only**: Zero margins (`mb-*`, `mt-*`) and zero spacer divs.
3. **Figma Constraints**: 
   - `flex-1` / `w-full` $\rightarrow$ **Fill container**
   - `w-fit` $\rightarrow$ **Hug contents**
   - Explicit `w-11 h-11` $\rightarrow$ **Fixed**
4. **Column-Based Tables**: Tables structured as Column vertical stacks so dragging column widths in Figma stretches all cells instantly.
5. **Clean Export Guarantee**: No pseudo-elements (`::before`/`::after`) or `ml-auto` hacks.

---

## How to Install on Your Home PC 🏠

### 1. Install Globally (For All Agents & Workspaces)
```bash
npx skills add FahiUX/figma_rules -g
```

If you want to auto-confirm without prompts and install to all agents:
```bash
npx skills add FahiUX/figma_rules -g --all
```

---

### 2. Install to Current Project Only
If you only want it inside a specific project folder:
```bash
npx skills add FahiUX/figma_rules
```

---

### 3. Updating When You Push New Rules
Whenever we update or add new rules to your GitHub repo, you can update it at home with:
```bash
npx skills update figma-standard-ui -g
```

---

## Alternative: Manual Git Clone
Clone directly into your global agent skills folder:
```bash
git clone https://github.com/FahiUX/figma_rules.git ~/.agents/skills/figma-standard-ui
```

---

## How to Use in Any Project

1. **Via Skill**: Ask your agent:
   > *"Build this dashboard using figma standard"*
2. **Via Repository Rule**: Copy `AGENTS.md` into the root of any web project so your agent automatically applies these rules on every prompt.


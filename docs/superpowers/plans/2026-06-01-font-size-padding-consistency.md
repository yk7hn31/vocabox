# Font Size & Padding Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise and normalize UI element font sizes app-wide (+1–2 px per tier), standardize similar card/button paddings, without touching `<input>` or `<textarea>` font sizes.

**Architecture:** All CSS lives in `app/globals.css`. Practice components use inline styles; those are patched in three TSX files. Mobile override attribute-selectors in globals.css reference old inline-style values and must be updated to match new values.

**Tech Stack:** Next.js 14 App Router, CSS (no Tailwind), React inline styles, Framer Motion

---

## Font-size Bump Rules

These rules govern every change in Tasks 1–4. Memorize them:

| Old size | Element role | New size |
|----------|-------------|---------|
| 10px | badges, pills, tiny labels | 11px |
| 11px | tab labels, small labels, minor text | 12px |
| 12px | secondary UI labels, small action buttons | 13px |
| 13px | compact buttons, nav secondary text, step text | 14px |
| 15px | primary action buttons | 16px |

**Never change:** `<input>`, `<textarea>`, `<select>` font sizes, or any property that reads `var(--form-control-font-size)`. Also skip: heading display sizes (26px+, h1/h2/h3 headings), hero description (17px), `.auth-tabs button` (14px — already fine), `.auth-primary` (uses form-control var).

---

## File Map

- **Modify:** `app/globals.css` (Tasks 1 + 2 + 5)
- **Modify:** `components/practice/QuizScreen.tsx` (Task 3)
- **Modify:** `components/practice/UploadScreen.tsx` (Task 4)
- **Modify:** `components/practice/ResultScreen.tsx` (Task 4)

---

## Task 1: globals.css — UI Font Sizes (Badges, Pills, Tabs, Dashboard)

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Raise badge and pill sizes (10px → 11px)**

  Find and change:

  ```css
  /* OLD */
  .practice-badge {
    font-size: 10px;
  }

  .status-pill {
    font-size: 10px;
  }

  .trend-card > div:first-child span {
    font-size: 10px;
  }

  .trend-bars small {
    font-size: 10px;
  }

  .assignment-fields label > span,
  .assignment-due-form label > span {
    font-size: 10px;
  }
  ```

  Change each `10px` above to `11px`. Also change:
  ```css
  /* In .tutor-tabs b and .tutee-tabs b */
  font-size: 10px; → font-size: 11px;
  ```

- [ ] **Step 2: Raise small label/tab text (11px → 12px)**

  Find and change every occurrence listed below. Each is a standalone property inside the named selector — change `font-size: 11px` to `font-size: 12px`:

  - `.tutor-header nav { font-size: 12px; }` — was 12px, leave it
  - `.tutee-header nav { font-size: 12px; }` — was 12px, leave it
  - `.tutor-account-name { font-size: 12px; }` → `13px`
  - `.tutor-tabs button { font-size: 11px; }` → `13px` (tab labels get extra bump for readability)
  - `.tutee-tabs button { font-size: 11px; }` → `13px`
  - `.queue-column button small` / `.queue-column button p { font-size: 11px; }` → `12px`
  - `.coach-panel p, .coach-panel label { font-size: 11px; }` → `12px`
  - `.weak-words span { font-size: 11px; }` → `12px`
  - `.queue-column h2 b { font-size: 11px; }` → `12px`
  - `.share-link { font-size: 11px; }` → `12px`
  - `.assignment-library-title span { font-size: 11px; }` → `12px`
  - `.assignment-library button small { font-size: 11px; }` → `12px`
  - `.assignment-library button > span { font-size: 11px; }` → `12px`
  - `.assigned-group-heading p { font-size: 11px; }` → `12px`
  - `.assigned-group-meta > span { font-size: 11px; }` → `12px`
  - `.assigned-word-row span { font-size: 11px; }` → `12px`
  - `.session-preview span { font-size: 11px; }` → `12px`
  - `.attempt-history p { font-size: 11px; }` → `12px`
  - `.csv-upload-target small { font-size: 11px; }` → `12px`
  - `.auth-kicker { font-size: 11px; }` → `12px`
  - `.auth-progress { font-size: 11px; }` → `12px`
  - `.preview-word em { font-size: 11px; }` → `12px`
  - `.preview-meta b { font-size: 11px; }` → `12px`
  - `.detail-metrics span { font-size: 11px; }` → `12px`

- [ ] **Step 3: Raise secondary UI text (12px → 13px)**

  - `.auth-form label { font-size: 12px; }` → `13px`
  - `.auth-error { font-size: 12px; }` → `13px`
  - `.auth-success p { font-size: 13px; }` — already 13px, bump to `14px`
  - `.auth-role-switch { font-size: 13px; }` → `14px`
  - `.auth-text-action { font-size: 13px; }` → `14px`
  - `.identity-chip { font-size: 13px; }` → `14px`
  - `.detail-heading p { font-size: 12px; }` → `13px`
  - `.dashboard-notice { font-size: 12px; }` → `13px`
  - `.empty-list-copy { font-size: 12px; }` → `13px`
  - `.queue-column h2 { font-size: 13px; }` → `14px`
  - `.queue-column button > strong { font-size: 13px; }` → `14px`
  - `.trend-card strong { font-size: 13px; }` → `14px`
  - `.coach-panel button, .new-assignment { font-size: 12px; }` → `13px`
  - `.assigned-sheet-header > p:last-child { font-size: 12px; }` → `13px`
  - `.assigned-group-heading h3 { font-size: 13px; }` → `14px`
  - `.assigned-word-row strong { font-size: 12px; }` → `13px`
  - `.assignment-record-header span { font-size: 12px; }` → `13px`
  - `.assignment-record { font-size: 11px; }` → `12px`
  - `.tutee-secondary-action { font-size: 12px; }` → `13px`
  - `.read-only-note { font-size: 12px; }` → `13px`
  - `.attempt-history details { font-size: 12px; }` → `13px`
  - `.practice-save-message { font-size: 12px; }` → `13px`
  - `.preview-meta { font-size: 12px; }` → `13px`
  - `.preview-top { font-size: 12px; }` → `13px`
  - `.preview-word small { font-size: 12px; }` → `13px`
  - `.preview-result { font-size: 12px; }` → `13px`
  - `.mini-list > div { font-size: 12px; }` → `13px`
  - `.eyebrow { font-size: 12px; }` → `13px`
  - `.step > span { font-size: 12px; }` → `13px`
  - `.step h3 { font-size: 16px; }` — leave
  - `.step p { font-size: 13px; }` → `14px`
  - `.format-label, .format-card pre, .format-hint { font-size: 13px; }` → `14px`
  - `.hero-tags { font-size: 13px; }` → `14px`
  - `.site-footer { font-size: 13px; }` → `14px`
  - `.practice-back { font-size: 13px; }` → `14px`
  - `.student-account-actions button, .assignment-record .record-actions button { font-size: 11px; }` → `12px`

- [ ] **Step 4: Raise compact buttons and section-label text**

  - `.primary-action { font-size: 15px; }` → `16px`
  - `.primary-action--compact { font-size: 13px; }` → `14px`
  - `.tutee-start-action { font-size: 13px; }` → `14px`
  - `.assignment-form-title { font-size: 13px !important; }` → `14px !important`
  - `.manage-card h2, .assignment-records h3 { font-size: 15px; }` → `16px`
  - `.assignment-record-header strong { font-size: 14px; }` → `15px`
  - `.csv-upload-target span { font-size: 13px; }` → `14px`
  - `.assignment-library-title h2 { font-size: 16px; }` → `17px`
  - `.assignment-library button strong { font-size: 13px; }` → `14px`
  - `.preview-options span { font-size: 13px; }` → `14px`

- [ ] **Step 5: Commit**

  ```bash
  git add app/globals.css
  git commit -m "style: raise UI element font sizes by 1–2px for readability"
  ```

---

## Task 2: globals.css — Padding Consistency

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Standardize dashboard card paddings**

  Align similar-role cards to consistent padding values:

  ```css
  /* OLD → NEW */

  .queue-column {
    padding: 15px 12px; /* → 16px 14px */
  }

  .tutee-focus,
  .assignment-library {
    /* tutee-focus: 19px 16px → 20px 16px */
    /* assignment-library: 18px 15px → 18px 16px */
  }

  .coach-panel {
    padding: 14px 13px; /* → 16px 14px */
  }
  ```

  Exact changes:
  - `.queue-column { padding: 15px 12px; }` → `padding: 16px 14px;`
  - `.tutee-focus, .assignment-library { /* inner */ padding: 19px 16px; }` → `padding: 20px 16px;`
  - `.assignment-library { padding: 18px 15px; }` → `padding: 18px 16px;`
  - `.coach-panel { padding: 14px 13px; }` → `padding: 16px 14px;`

- [ ] **Step 2: Standardize primary action button padding**

  ```css
  /* OLD */
  .primary-action {
    padding: 13px;
  }
  .primary-action--compact {
    padding: 10px 17px;
  }

  /* NEW */
  .primary-action {
    padding: 14px;
  }
  .primary-action--compact {
    padding: 10px 18px;
  }
  ```

- [ ] **Step 3: Standardize auth card button heights**

  `.auth-primary` height is `53px`. `.auth-tabs button` height is `43px`. Both are fine and consistent. No change needed.

  Check `.manage-card button { padding: 9px 12px; }` — these sit beside form inputs. Bump to `padding: 10px 14px;` for better proportion.

- [ ] **Step 4: Commit**

  ```bash
  git add app/globals.css
  git commit -m "style: standardize card padding and button padding for consistency"
  ```

---

## Task 3: QuizScreen.tsx — Inline Style Font Sizes

**Files:**
- Modify: `components/practice/QuizScreen.tsx`

**Rule:** Do NOT touch the `#typed-answer` input element's inline styles.

- [ ] **Step 1: Bump lives counter, progress label, streak badge**

  Current (lines ~88–111):
  ```tsx
  // lives counter
  fontSize: 13,
  // progress label
  fontSize: 12,
  // streak badge
  fontSize: 12,
  ```

  Change to:
  ```tsx
  // lives counter
  fontSize: 14,
  // progress label
  fontSize: 13,
  // streak badge
  fontSize: 13,
  ```

- [ ] **Step 2: Bump hint text and feedback secondary text**

  Current (lines ~135, 258, 278–285):
  ```tsx
  // hint inside word card ("뜻이 N개")
  fontSize: 11,

  // MCQ feedback secondary ("정답: ...")
  fontSize: 12,

  // Type feedback header ("셀프체크 - 채점 없음")
  fontSize: 12,
  // Type feedback meaning
  fontSize: 12,
  // Type feedback user answer
  fontSize: 11,
  ```

  Change to:
  ```tsx
  // hint
  fontSize: 12,

  // MCQ feedback secondary
  fontSize: 13,

  // Type feedback header
  fontSize: 13,
  // Type feedback meaning
  fontSize: 13,
  // Type feedback user answer
  fontSize: 12,
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add components/practice/QuizScreen.tsx
  git commit -m "style: bump quiz screen UI font sizes for consistency"
  ```

---

## Task 4: UploadScreen.tsx and ResultScreen.tsx — Inline Style Font Sizes

**Files:**
- Modify: `components/practice/UploadScreen.tsx`
- Modify: `components/practice/ResultScreen.tsx`

### UploadScreen.tsx

- [ ] **Step 1: Bump subtitle, drop zone text, mode info, and sample button text**

  Current inline font sizes in `UploadScreen.tsx`:
  ```tsx
  // Subtitle ("CSV 단어장을 올리거나...")
  fontSize: 13 → 14

  // Drop zone text (loaded state and default)
  fontSize: 13 → 14

  // Drop zone error
  fontSize: 12 → 13

  // Format hint inner p
  fontSize: 11 → 12

  // Sample button (it IS a button, not an input)
  fontSize: 13 → 14

  // Mode info title ("퀴즈 방식 안내")
  fontSize: 12 → 13

  // Mode info body
  fontSize: 11 → 12
  ```

  Do NOT change: `<input ref={ref} type="file" ...>` — it's hidden but still an input.

### ResultScreen.tsx

- [ ] **Step 2: Bump result message, summary line, section labels, wrong/history item details**

  Current inline font sizes in `ResultScreen.tsx`:
  ```tsx
  // Result message (e.g. "훌륭해요!")
  fontSize: 15 → 16

  // MCQ summary line ("객관식 X/Y 정답")
  fontSize: 13 → 14

  // Wrong section label ("틀린 문제")
  fontSize: 11 → 12

  // Wrong item word
  fontSize: 15 → 16

  // Wrong item meaning ("정답: ...")
  fontSize: 12 → 13

  // Wrong item user answer ("내 답: ...")
  fontSize: 11 → 12

  // History section label ("전체 풀이 내역")
  fontSize: 11 → 12

  // History item meaning
  fontSize: 12 → 13

  // History item user answer
  fontSize: 11 → 12
  ```

  Leave: score display (`fontSize: 52`), score unit span (`fontSize: 22`), history word (`fontSize: 14` — body text, already correct).

- [ ] **Step 3: Commit**

  ```bash
  git add components/practice/UploadScreen.tsx components/practice/ResultScreen.tsx
  git commit -m "style: bump upload and result screen UI font sizes for consistency"
  ```

---

## Task 5: globals.css — Update Mobile Override Attribute Selectors

**Files:**
- Modify: `app/globals.css`

The mobile overrides section (~line 3836–3866) uses `[style*="font-size: Xpx"]` attribute selectors to override inline styles in the practice components on narrow screens. After Tasks 3–4 change those inline values, the selectors no longer match. Update them.

- [ ] **Step 1: Update setup-card font-size attribute selectors**

  Find (around line 3844–3854):
  ```css
  .setup-card [style*="font-size: 26px"] {
    font-size: 24px !important;
  }

  .setup-card [style*="font-size: 13px"] {
    font-size: 14px !important;
  }

  .setup-card [style*="font-size: 11px"] {
    font-size: 13px !important;
  }
  ```

  After Task 4, UploadScreen's `fontSize: 13` becomes `fontSize: 14`, and `fontSize: 11` becomes `fontSize: 12`. Update selectors:

  ```css
  .setup-card [style*="font-size: 26px"] {
    font-size: 24px !important;  /* title heading — unchanged */
  }

  .setup-card [style*="font-size: 14px"] {
    font-size: 15px !important;  /* subtitle/drop zone on mobile */
  }

  .setup-card [style*="font-size: 12px"] {
    font-size: 13px !important;  /* small body text on mobile */
  }
  ```

- [ ] **Step 2: Check `.opt` and `#typed-answer` mobile overrides — no change needed**

  ```css
  .opt { font-size: 15px !important; }         /* MCQ option — fine, leave */
  #typed-answer { font-size: var(--form-control-font-size) !important; }  /* input — leave */
  ```

- [ ] **Step 3: Check mobile typography floor overrides (lines ~4172–4191)**

  These use class selectors, not attribute selectors, so they're unaffected by inline-style changes.

  Review the mobile floor raises and confirm they still make sense given the new base sizes. If a mobile override now sets a size equal to or less than the new base, remove it.

  Example — the override `.session-preview span { font-size: 12px; }` in the mobile block raised the then-11px to 12px. After Task 1 the base is already 12px. Remove that line from the mobile block to avoid redundancy.

  Similarly check each line in the `/* Raise floor: 10px → 11px */` and `/* Raise secondary labels: 11px → 12px */` blocks and remove any that are now redundant.

- [ ] **Step 4: Commit**

  ```bash
  git add app/globals.css
  git commit -m "style: update mobile attribute-selector overrides to match new inline font sizes"
  ```

---

## Self-Review Checklist

- [ ] `<input>` and `<textarea>` font sizes unchanged — still `var(--form-control-font-size)` or `16px`
- [ ] No heading display size (h1/h2/h3 26px+) accidentally reduced
- [ ] `#typed-answer` input in QuizScreen untouched
- [ ] Mobile attribute selectors now match new inline style values
- [ ] No `10px` font-size remaining for any non-decorative UI element
- [ ] Tab buttons (`.tutor-tabs button`, `.tutee-tabs button`) now `13px`
- [ ] Primary action button now `16px` with `padding: 14px`

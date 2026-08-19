---
name: deal-quality
description: Review a deal desk approved pricing document for quality, completeness, pricing/margin sanity, and missing approvals. Trigger on "/deal-quality", "review this pricing deal", or "check deal desk pricing quality".
---

# Deal Quality Review

Review a deal desk approved pricing document (not a contract) and produce a narrative quality assessment with recommendations.

## When to Use

Claude should apply this skill when:

- The user runs `/deal-quality`
- The user asks to review, score, or sanity-check a deal desk approved pricing file (doc, PDF, or spreadsheet)

---

## Procedure

### Step 1: Locate the Input

If the user gave a file path, read it directly. If not, ask for the path to the deal desk approved pricing document (doc/PDF/spreadsheet). Do not proceed on assumed or remembered content — always read the current file.

### Step 2: Check Completeness

Confirm the document contains the fields expected of a deal desk approved pricing record: customer/account, product(s) and quantities, unit and total pricing, discount tier/percentage, effective and expiration dates, and the deal desk approver name/date. List any of these that are missing or ambiguous.

### Step 3: Check Pricing and Margin Sanity

Compare listed prices and discounts against any stated list price, standard discount band, or margin floor found in the same document or provided by the user. Flag discounts or margins that fall outside stated bands. Do not invent external benchmark numbers — if no reference threshold is present in the document, say so explicitly rather than guessing one.

### Step 4: Check Approval Documentation

Verify the deal desk approval itself is evidenced (approver identity, date, and any required escalation sign-off for large discounts). Treat an approval as missing, not assumed granted, if it isn't explicitly recorded.

### Step 5: Flag Risks

Note anything unusual: non-standard terms bundled into a pricing doc, discounts stacked beyond policy, missing expiration date (open-ended pricing), or inconsistencies between sections (e.g., total doesn't match unit price × quantity).

### Step 6: Produce the Narrative Summary

Write a short narrative covering: overall impression, completeness gaps, pricing/margin concerns, approval status, and risk flags — followed by concrete recommendations (what to fix or confirm before the deal proceeds).

---

## Output Contract

When this skill is used, Claude must:

- **Produce**: a narrative summary (not a checklist or numeric score) covering completeness, pricing/margin sanity, approval status, and risk flags, ending with recommendations
- **Include**: specific references to what's missing or inconsistent (field names, section names, numbers), not vague generalities
- **Avoid**: inventing pricing benchmarks, margin floors, or approval policies not stated in the document or supplied by the user; treating an unconfirmed approval as granted

---

## Guardrails

- Treat pricing and customer data in these documents as sensitive — do not copy figures into external tools, tickets, or messages without the user's explicit instruction.
- If a required reference (standard discount band, margin floor, approval policy) isn't in the document, say the check can't be completed rather than fabricating a threshold.
- Do not modify the source pricing document; this is a read-only review.

---

## Output Format

```
## Deal Quality Review — <document name>

**Overall**: <one-line impression>

### Completeness
- <field>: present / missing / ambiguous — <note>

### Pricing & Margin
- <finding, with reference to stated benchmark or note that none was found>

### Approval Status
- <who approved, when, or "not documented">

### Risk Flags
- <flag, or "none identified">

### Recommendations
- <action items before the deal proceeds>
```

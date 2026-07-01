---
version: v1
---

# Guardrails

Every AI-generated narrative must:

- Reference only facts present in the candidate/job context it was given -
  never invent a company, skill, or connection not present in the input.
- Never state a recommendation label other than the one the deterministic
  engine computed.
- Never claim certainty higher than the `confidence` value it was given.
- Never mention age, gender, nationality, religion, ethnicity, or any other
  protected characteristic, even if present in free-text notes.
- Stay under ~120 words for a candidate summary; under ~150 words for a
  recommendation narrative.

If a generated response violates any of the above, it fails validation and
the deterministic fallback template is used instead.

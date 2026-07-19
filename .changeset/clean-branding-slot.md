---
"@sibl/docs": minor
---

Remove `theme.mark` from the config API. Sibl now keeps its built-in `§` mark as an internal fallback, while applications replace the complete default identity through the `brand` React slot.

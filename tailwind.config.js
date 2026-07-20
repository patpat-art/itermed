/**
 * AEQUAN Premium Theme — token source of truth is app/globals.css (@theme inline).
 * Path aliases (`@/*`) are resolved by TypeScript/Next via tsconfig.json `paths`;
 * Tailwind v4 does not require a separate resolve alias here.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        "brand-primary": "#1E324E",
        "brand-primary-hover": "#2A486D",
        "brand-secondary": "#345884",
        "brand-primary-light": "#345884",
        "text-primary": "#2F4156",
        "text-secondary": "#64748B",
        "ui-bg": "#F8FAFC",
        "panel-bg": "#FFFFFF",
        border: "#E2E8F0",
        "border-subtle": "#F1F5F9",
        "status-safe": "#345884",
        "status-warn": "#F39C12",
        "status-risk": "#C0392B",
        "monitor-stable": "#22C55E",
        "monitor-warn": "#F59E0B",
        "monitor-critical": "#EF4444",
        "score-excellent": "#345884",
        "score-warning": "#F39C12",
        "score-risk": "#C0392B",
        "clinical-bg": "#F8FAFC",
        "clinical-navy": "#1E324E",
        "clinical-blue": "#345884",
        "clinical-teal": "#345884",
        "clinical-rose": "#C0392B",
      },
      borderRadius: {
        clinical: "0.5rem",
        "clinical-card": "0.75rem",
        aequan: "0.625rem",
        "aequan-lg": "1rem",
        "aequan-xl": "1.25rem",
      },
      boxShadow: {
        clinical: "0 1px 3px 0 rgba(30, 50, 78, 0.06)",
        aequan: "0 4px 24px -4px rgba(30, 50, 78, 0.12)",
        "aequan-panel":
          "0 1px 2px 0 rgba(30, 50, 78, 0.04), 0 8px 24px -8px rgba(52, 88, 132, 0.1)",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "var(--font-plus-jakarta)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      transitionDuration: {
        aequan: "300ms",
      },
    },
  },
};

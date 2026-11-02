---
name: 21st-components
description: "Browse, import, and build modern UI components using the 21st.dev (Magic MCP) component registry. Provides production-ready React, Tailwind CSS, and shadcn/ui components, hero cards, interactive buttons, carousels, and animations."
---

# 21st.dev Components Skill

This skill guides discovering, retrieving, and implementing modern UI components from the **21st.dev** registry directly into React & Next.js applications with Tailwind CSS.

## When to Use

- Adding new UI components to the car fleet website (e.g., modern car cards, interactive pricing switches, booking modal animations, badge indicators).
- Finding battle-tested Tailwind and shadcn/ui component variants.
- Looking up interactive micro-animations (hover effects, shimmer cards, magnetic buttons, glowing borders).

## MCP Server Integration

This skill connects with the **21st MCP Server** configured in Antigravity:
```json
"21st": {
  "command": "npx",
  "args": ["-y", "@21st-dev/cli", "mcp"]
}
```

### Key Capabilities

1. **Component Search**: Search over 12,000+ hand-crafted community components.
2. **Component Pulling**: Pull code directly into the workspace with TypeScript types and Tailwind CSS classes.
3. **Logo & Asset Integration**: Search SVG brand icons and logos for car manufacturers (JAC, Toyota, Hyundai, Mercedes, etc.).

## Direct CLI Usage

You can also use the 21st CLI directly to add components:
```bash
npx @21st-dev/cli add <component-name>
```

## Automotive Fleet Best Practices

When selecting components for **شركة اليمن والخليج لتوريد السيارات**:
- Maintain editorial elegance: prefer subtle elevation (`shadow-md` to `shadow-lg`) over chaotic glows.
- Mobile responsiveness: ensure every card and modal has touch targets of at least 44x44px.
- RTL (Right-to-Left) compatibility: ensure Arabic text layout flows naturally without broken flex directions.
- Keep dependencies lean: prioritize pure Tailwind CSS solutions rather than installing heavy external canvas runtimes.

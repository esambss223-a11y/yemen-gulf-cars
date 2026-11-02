---
name: graphify
description: "Build, query, and analyze code knowledge graphs using Graphify and Tree-sitter. Maps dependencies, callers, database schema connections, and blast radius for codebase refactoring."
---

# Graphify Code Knowledge Graph Skill

This skill guides the construction, querying, and architectural analysis of the codebase using **Graphify** via Tree-sitter AST parsing.

## When to Use

- Tracing dependencies across files before major refactoring (e.g. checking what breaks if `FleetContext` or `Car` types change).
- Finding "God Nodes" (tightly coupled functions or modules that require decoupling).
- Mapping database tables (`cars`, `bookings`, `contracts`) to their API routes and frontend components.
- Running impact and blast-radius analysis across complex features.

## MCP Server Integration

Graphify runs via the configured MCP server:
```json
"graphify": {
  "command": "npx",
  "args": ["-y", "graphify", "--mcp"]
}
```

### Key MCP Tools Provided

- `query_graph`: Search symbols, files, and architectural nodes.
- `get_node` / `get_neighbors`: Inspect callers, callees, and imports of any function or component.
- `shortest_path`: Trace the path of execution between two separate code symbols.
- `god_nodes`: Highlight the most connected hubs in the project architecture.

## Workflow

1. **Build Local Graph**:
   ```bash
   npx graphify scan .
   ```
2. **Query Relationships**:
   Trace relationships before deleting or modifying core interfaces (`Car`, `Booking`, `FleetContext`).
3. **Verify Refactor**:
   Confirm that all dependents have been updated to match new signatures.

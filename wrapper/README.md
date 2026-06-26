# @andrewkimjoseph/celina (deprecated)

This package is deprecated. Use [`@andrewkimjoseph/celina-mcp`](https://www.npmjs.com/package/@andrewkimjoseph/celina-mcp) instead.

## Migration

If you still use `@andrewkimjoseph/celina`, update your MCP config `args` to `@andrewkimjoseph/celina-mcp` and rename the server key to `celina-mcp`.

```json
{
  "mcpServers": {
    "celina-mcp": {
      "command": "npx",
      "args": ["-y", "@andrewkimjoseph/celina-mcp"]
    }
  }
}
```

See the [celina-mcp README](https://github.com/andrewkimjoseph/celina-mcp#readme) for full setup instructions.

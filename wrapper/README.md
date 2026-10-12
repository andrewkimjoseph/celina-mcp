# @cnvlabskoxyz/celina (deprecated)

This package is deprecated. Use [`@cnvlabskoxyz/celina-mcp`](https://www.npmjs.com/package/@cnvlabskoxyz/celina-mcp) instead.

## Migration

If you still use `@cnvlabskoxyz/celina`, update your MCP config `args` to `@cnvlabskoxyz/celina-mcp` and rename the server key to `celina-mcp`.

```json
{
  "mcpServers": {
    "celina-mcp": {
      "command": "npx",
      "args": ["-y", "@cnvlabskoxyz/celina-mcp"]
    }
  }
}
```

See the [celina-mcp README](https://github.com/andrewkimjoseph/celina-mcp#readme) for full setup instructions.

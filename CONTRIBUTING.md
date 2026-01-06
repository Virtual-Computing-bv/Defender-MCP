# Contributing to Microsoft Defender MCP Server

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all experience levels.

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, etc.)
   - Relevant logs (with sensitive data redacted)

### Suggesting Features

1. Check existing issues and discussions
2. Create a feature request issue with:
   - Use case description
   - Proposed solution
   - Alternative approaches considered

### Submitting Code

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add/update tests if applicable
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run build
   npm start
   ```

5. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new tool for X functionality"
   ```

   Use conventional commits:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `refactor:` for code changes that don't add features or fix bugs
   - `test:` for adding tests

6. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Microsoft Defender for Endpoint test environment (recommended)

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev
```

### Adding New Tools

1. Identify the appropriate tool file in `src/tools/`:
   - `alerts.ts` - Alert management
   - `machines.ts` - Device management
   - `machine-actions.ts` - Response actions
   - `vulnerabilities.ts` - Vulnerability management
   - `indicators.ts` - Threat intelligence
   - `advanced-hunting.ts` - KQL queries
   - `entities.ts` - Entity relationships
   - `scoring.ts` - Security scores

2. Follow the existing pattern:
   ```typescript
   // Define Zod schema
   export const YourToolSchema = z.object({
     paramName: z.string().describe("Parameter description"),
   });

   // Implement handler
   export async function yourToolHandler(params: z.infer<typeof YourToolSchema>) {
     return defenderApiRequest("/your/endpoint", { /* options */ });
   }

   // Add to tools array
   export const yourTools = [
     {
       name: "defender_your_tool",
       description: "What this tool does",
       inputSchema: YourToolSchema,
       handler: yourToolHandler,
     },
   ];
   ```

3. Export from `src/index.ts`

4. Update README.md with the new tool

## Security Guidelines

- **Never commit credentials** - Use environment variables
- **Validate all inputs** - Use Zod schemas for validation
- **Handle errors gracefully** - Don't expose internal details
- **Document security implications** - Note if a tool performs sensitive operations

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include tests for new functionality
- Update documentation
- Ensure CI passes
- Request review from maintainers

## Questions?

Open an issue for any questions about contributing.

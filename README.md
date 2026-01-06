Microsoft Defender for Endpoint MCP Server
An MCP (Model Context Protocol) server that exposes the Microsoft Defender for Endpoint (MDE) REST API as structured, machine-callable tools for LLMs, agents, and automation systems.
This server enables secure, programmatic access to Defender alerts, machines, vulnerabilities, advanced hunting, indicators, exposure scoring, and (optionally) response actions—without embedding Defender logic directly into the model.
Why This Exists
Modern security operations increasingly rely on AI-assisted analysis and decision-making. This MCP server provides a clean separation of concerns:
•	LLMs reason
•	MCP tools act
•	Defender remains the source of truth
This design allows you to:
•	Add Defender context to AI systems safely
•	Enable SOC copilots, security agents, and automation
•	Avoid hard-coding Defender APIs into prompt logic
•	Apply governance and guardrails at the tool layer
Key Capabilities
This server exposes 72 MCP tools mapped directly to Microsoft Defender for Endpoint APIs.
Visibility & Intelligence
•	Alerts (list, get, incidents)
•	Machines & device inventory
•	Vulnerabilities & software inventory
•	Exposure & secure score metrics
•	Advanced Hunting (KQL)
•	Threat indicators
•	Entity lookups (IPs, domains, files, users)
Response & Actions (Optional / High-Privilege)
•	Machine isolation / un-isolation
•	Antivirus scans
•	Investigation actions
•	Live Response sessions
•	Library file uploads
•	Device offboarding
Important: Response actions require elevated Defender permissions and should be tightly controlled.
Architecture Overview
LLM / Agent
    ↓
MCP Host (Claude Desktop, custom runtime, etc.)
    ↓
Defender MCP Server (this repo)
    ↓
Microsoft Defender for Endpoint API
Design Principles
•	Stateless tool execution
•	Explicit schemas (Zod → JSON Schema)
•	Token-cached authentication
•	No shell execution or OS-level access
•	API-only interaction with Defender
Project Structure
src/
├── index.ts                # MCP server bootstrap & tool registry
├── auth.ts                 # MSAL authentication + token caching
├── api-client.ts           # Defender API wrapper + pagination
├── alerts.ts               # Alert-related tools
├── machines.ts             # Device inventory & queries
├── machine-actions.ts      # Response actions (high impact)
├── vulnerabilities.ts      # CVEs, software, exposure
├── indicators.ts           # IOC management
├── advanced-hunting.ts     # KQL hunting queries
├── entities.ts             # IP, domain, file, user entities
└── scoring.ts              # Exposure & secure score
Authentication & Permissions
This server uses Azure AD Application Authentication via MSAL (confidential client).
Required Environment Variables
TENANT_ID=<azure-ad-tenant-id>
CLIENT_ID=<app-registration-client-id>
CLIENT_SECRET=<client-secret>
Azure App Registration
1.	Create an Azure AD App Registration
2.	Add Microsoft Threat Protection API permissions
3.	Grant Admin Consent
Common Permissions
Read-only use cases:
•	Alert.Read.All
•	Machine.Read.All
•	Vulnerability.Read.All
•	AdvancedHunting.Read.All
Response / action use cases (use sparingly):
•	Machine.Isolate
•	Machine.Offboard
•	Machine.LiveResponse
•	Machine.Scan
•	Ti.ReadWrite
Best practice:
Use separate app registrations for:
•	Read-only access
•	Response / remediation actions
Installation
git clone <repo-url>
cd defender-mcp-server
npm install
Running the Server
This MCP server uses stdio transport, designed to be launched by an MCP host.
npm run build
node dist/index.js
Or directly:
npm run start

Example Tool Categories
Alerts
•	defender_list_alerts
•	defender_get_alert
•	defender_list_incidents
Machines
•	defender_list_machines
•	defender_get_machine
•	defender_list_machine_alerts
Vulnerabilities
•	defender_list_vulnerabilities
•	defender_list_software
•	defender_get_machine_vulnerabilities
Advanced Hunting
•	defender_run_advanced_hunting
Indicators
•	defender_list_indicators
•	defender_create_indicator
•	defender_update_indicator
Machine Actions (High Impact)
•	defender_isolate_machine
•	defender_run_antivirus_scan
•	defender_start_live_response

Security Considerations (Read This)
This server can expose organization-wide endpoint control if misconfigured.
Critical Risks
•	Application permissions are not user-scoped
•	Any MCP host compromise = Defender compromise
•	LLM prompt injection could trigger destructive actions
Recommended Safeguards
•	Separate read-only vs response MCP servers
•	Require human approval for isolate / offboard / live response
•	Limit app permissions to the minimum required
•	Rotate secrets regularly (prefer certificate auth)
•	Log and audit all response actions
Intended Use Cases
•	SOC copilots
•	Threat hunting assistants
•	Security posture analysis
•	Vulnerability prioritization
•	Executive security reporting
•	Controlled automated response workflows

What This Is NOT
•	A SIEM replacement
•	A fully autonomous remediation engine
•	A substitute for human security judgment
This server is a tooling layer, not a decision maker.

Roadmap Ideas (Optional Enhancements)
•	Action approval workflows
•	Role-based tool exposure
•	Rate limiting & retry logic
•	Read-only / response mode flags
•	Audit logging middleware
•	Multi-tenant support
Disclaimer
This project interacts with security-critical infrastructure.
Use at your own risk. The authors assume no liability for misuse, misconfiguration, or unauthorized access.


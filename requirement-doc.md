# ConvoMono - AI Voice Calling Platform

## Project Overview

ConvoMono is a white-label AI voice calling platform that enables businesses to create and manage automated voice campaigns using RetellAI technology. The platform serves as a middleman between clients and RetellAI, providing a complete management interface while handling billing, credits, and profitability tracking.

## Core Concept

**Super Admin** manages the platform, provisions phone numbers, creates client accounts, and monitors profitability.
**Clients** create voice campaigns, upload leads, and launch automated calling campaigns.
**RetellAI** provides the underlying voice AI technology for making the actual calls.

## User Roles & Responsibilities

### Super Admin
- Create and manage client accounts
- Allocate credits to clients (minutes-based billing)
- Purchase and assign phone numbers to clients
- Monitor RetellAI costs vs client billing for profit/loss analysis
- View detailed cost breakdowns for each call and campaign
- Access comprehensive system analytics and reports

### Clients
- Create voice campaigns with custom scripts
- Upload knowledge bases (files, text, URLs) for AI training
- Import leads via CSV with dynamic variables
- Launch immediate or scheduled calling campaigns
- View campaign performance and call analytics
- Manage credit usage and billing

## Platform Flow

### 1. Client Onboarding
Super admin creates client account, sets billing rate, and allocates initial credits.

### 2. Campaign Creation
Client creates campaign by:
- Writing call script/prompts
- Uploading knowledge files for AI training
- Selecting voice settings
- Configuring call parameters (max duration, retry logic)

### 3. Lead Management
Client uploads lead lists with:
- Phone numbers (auto-formatted to E.164)
- Dynamic variables for personalization
- Campaign assignment

### 4. Campaign Launch
Client launches campaign after:
- Credit validation (sufficient balance check)
- Phone number assignment from super admin's pool
- Lead validation and deduplication
- Credit reservation for estimated usage

### 5. Call Execution
System handles:
- Bulk call creation via RetellAI batch API
- Real-time call status monitoring
- Webhook processing for call events
- Credit consumption tracking

### 6. Analytics & Reporting
- **Client View**: Campaign performance, lead conversion rates, credit usage
- **Super Admin View**: Profitability analysis, RetellAI cost breakdown, system health

## Key Features

### Credit Management
- Minutes-based billing system
- Credit reservation on campaign launch
- Real-time consumption tracking
- Automatic reconciliation after calls complete

### Cost Transparency (Super Admin Only)
- RetellAI actual costs per call
- Client billing rates vs platform costs
- Profit/loss analysis per client and campaign
- Detailed financial reporting

### Campaign Management
- Simple script-based campaign creation (no complex flow builder)
- Knowledge base integration for smarter AI responses
- Lead import with CSV validation
- Scheduled and immediate launch options

### Phone Number Management
- Super admin controls phone number inventory
- Assignment-based system (no client self-service)
- Integration with RetellAI and Twilio for provisioning

## Technical Architecture

### Frontend
- **Client App**: Next.js 15 dashboard for campaign management
- **Admin App**: Next.js 15 dashboard for system administration
- **UI Library**: Shared shadcn components with Tailwind CSS

### Backend
- **API**: Express.js with TypeScript
- **Database**: MongoDB for flexible data storage
- **Integrations**: RetellAI SDK, Twilio API
- **Real-time**: WebSocket connections for live updates

### Third-Party Services
- **RetellAI**: Voice AI platform for call execution
- **Twilio**: Phone number provisioning (backup/alternative)

## Business Model

Platform operates on a markup model:
1. Purchase RetellAI services at their rates
2. Bill clients at higher rates (super admin sets markup)
3. Profit = Client billing - RetellAI costs - operational expenses
4. Super admin has full visibility into this profit calculation

## Success Metrics

- **Client Satisfaction**: Campaign conversion rates, call quality scores
- **Platform Performance**: Call success rates, system uptime
- **Business Growth**: Profit margins, client retention, usage volume
- **Operational Efficiency**: Cost per call, support ticket volume
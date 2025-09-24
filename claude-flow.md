# ConvoMono Development Flow

A comprehensive step-by-step implementation plan for the RetellAI-powered voice calling platform.

## Phase 1: Database Models & Core Infrastructure

### 1.1 Database Schema Design

- [✅] Design and create `campaigns` model with fields: `campaignId`, `clientId`, `name`, `script_raw`, `kb_files_meta`, `voice_id`, `settings`, `status`, `agent_id`, `knowledge_base_id`, `published_version`
- [✅] Design and create `leads` model with fields: `leadId`, `campaignId`, `clientId`, `phone_number`, `dynamic_vars`, `status`, `last_attempted_at`, `last_call_id`
- [✅] Design and create `phone_numbers` model with fields: `phone_number`, `provider`, `assigned_client_id`, `type`, `imported`, `is_active`
- [✅] Design and create `batch_calls` model with fields: `batch_id`, `campaign_id`, `client_id`, `tasks_count`, `scheduled_ts`, `status`
- [✅] Design and create `calls` model with fields: `call_id`, `campaign_id`, `lead_id`, `agent_id`, `from`, `to`, `start_ts`, `end_ts`, `duration_seconds`, `call_cost`, `retell_cost`, `client_cost`, `transcript`, `call_analysis`, `status`
- [✅] Design and create `transactions` model with fields: `tx_id`, `client_id`, `campaign_id`, `call_id`, `type` (purchase|reserve|consume|refund), `minutes`, `amount_usd`, `reference_id`, `status`, `created_at`
- [✅] Design and create `webhook_events` model with fields: `event_id`, `event_type`, `payload`, `processed`, `created_at`
- [✅] Design and create `reports` model with fields: `report_id`, `campaign_id`, `client_id`, `metrics`, `generated_at`
- [✅] Design and create `audit_logs` model with fields: `log_id`, `user_id`, `user_type`, `action`, `resource`, `details`, `created_at`

### 1.2 Update Existing Models

- [] Extend `clients` model to include: `credits_total_minutes`, `credits_reserved_minutes`, `credits_consumed_minutes`, `billing_rate`
- [] Add credit tracking methods to client model
- [ ] Update `admin` model permissions to include campaign and phone number management

### 1.3 RetellAI Integration Setup

- [ ] Install and configure RetellAI SDK
- [ ] Create RetellAI service wrapper with methods for: `createKnowledgeBase`, `createAgent`, `publishAgent`, `createPhoneNumber`, `createBatchCall`, `updateAgent`
- [ ] Set up RetellAI webhook endpoint and signature verification
- [ ] Create RetellAI configuration management

## Phase 2: Authentication & Authorization Enhancement

### 2.1 Enhanced Auth System

- [ ] Implement JWT token management with refresh tokens
- [ ] Add role-based middleware for super_admin, admin, and client routes
- [ ] Create protected route wrappers for frontend apps
- [ ] Implement session management and token refresh logic

### 2.2 API Routes Structure

- [ ] Set up admin routes: `/api/v1/admin/clients`, `/api/v1/admin/phone-numbers`, `/api/v1/admin/reports`
- [ ] Set up client routes: `/api/v1/client/campaigns`, `/api/v1/client/leads`, `/api/v1/client/calls`
- [ ] Set up webhook routes: `/api/v1/webhooks/retell`
- [ ] Add input validation middleware using Joi or similar

## Phase 3: Super Admin Dashboard

### 3.1 Client Management

- [ ] Create client listing page with search and filters
- [ ] Build create/edit client form with credit allocation
- [ ] Implement client activation/deactivation
- [ ] Add bulk client operations

### 3.2 Phone Number Management

- [ ] Create phone number inventory management page
- [ ] Build phone number assignment interface (assign to clients)
- [ ] Implement phone number purchase workflow (integrate with providers)
- [ ] Add phone number status tracking and management

### 3.3 Financial Management & Analytics

- [ ] Create cost analysis dashboard showing RetellAI costs vs client billing
- [ ] Build profit/loss reports per client and campaign
- [ ] Implement detailed call cost breakdown with RetellAI charges
- [ ] Add credit management interface (purchase, refund, adjust)
- [ ] Create transaction history and audit trails

### 3.4 System Monitoring

- [ ] Build webhook event monitoring dashboard
- [ ] Create system health monitoring page
- [ ] Implement error logging and alert system
- [ ] Add performance metrics and usage statistics

## Phase 4: Client Dashboard Core Features

### 4.1 Campaign Management

- [ ] Build campaign creation wizard (name, script, voice selection)
- [ ] Create campaign listing with status indicators
- [ ] Implement campaign editing and versioning
- [ ] Add campaign duplication feature

### 4.2 Knowledge Base Management

- [ ] Build file upload interface for campaign knowledge
- [ ] Create text/URL knowledge input forms
- [ ] Implement knowledge base versioning
- [ ] Add knowledge base testing interface

### 4.3 Lead Management

- [ ] Create lead upload interface (CSV import)
- [ ] Build lead management table with filters
- [ ] Implement lead validation and E.164 formatting
- [ ] Add dynamic variables management
- [ ] Create lead deduplication logic

### 4.4 Campaign Launch System

- [ ] Build pre-launch validation (credits, leads, phone numbers)
- [ ] Create launch scheduling interface
- [ ] Implement credit reservation system
- [ ] Add launch confirmation and status tracking

## Phase 5: Call Management & Execution

### 5.1 RetellAI Integration

- [ ] Implement agent creation workflow with knowledge base binding
- [ ] Create batch call creation and management
- [ ] Build real-time call status monitoring
- [ ] Add call retry and failure handling logic

### 5.2 Credit System

- [ ] Implement credit reservation on campaign launch
- [ ] Build real-time credit consumption tracking
- [ ] Create credit reconciliation after calls complete
- [ ] Add insufficient credit handling and notifications

### 5.3 Webhook Processing

- [ ] Implement RetellAI webhook event processing
- [ ] Create call lifecycle status updates
- [ ] Build transcript and analysis data storage
- [ ] Add real-time call status updates to frontend

## Phase 6: Reporting & Analytics

### 6.1 Campaign Reports

- [ ] Build campaign performance dashboards
- [ ] Create call analytics (pickup rates, duration, conversion)
- [ ] Implement transcript analysis and keyword extraction
- [ ] Add export functionality (CSV, PDF)

### 6.2 Lead Reports

- [ ] Create lead status tracking and history
- [ ] Build lead conversion tracking
- [ ] Implement follow-up scheduling system
- [ ] Add lead scoring and prioritization

### 6.3 Financial Reports

- [ ] Create client billing reports and invoicing
- [ ] Build credit usage analytics
- [ ] Implement cost per lead/conversion tracking
- [ ] Add payment history and transaction logs

## Phase 7: Advanced Features

### 7.1 Real-time Features

- [ ] Implement WebSocket connections for live call monitoring
- [ ] Create real-time dashboard updates
- [ ] Build live call queue management
- [ ] Add real-time notifications system

### 7.2 Advanced Analytics

- [ ] Implement A/B testing for scripts and voices
- [ ] Create predictive analytics for call outcomes
- [ ] Build sentiment analysis on call transcripts
- [ ] Add machine learning insights for optimization

### 7.3 Automation Features

- [ ] Create automatic retry logic for failed calls
- [ ] Implement smart scheduling based on time zones
- [ ] Build automatic lead scoring and prioritization
- [ ] Add automated follow-up workflows

## Phase 8: Performance & Security

### 8.1 Performance Optimization

- [ ] Implement database indexing and query optimization
- [ ] Add Redis caching for frequently accessed data
- [ ] Create background job processing for heavy operations
- [ ] Implement API rate limiting and throttling

### 8.2 Security Enhancements

- [ ] Add comprehensive input validation and sanitization
- [ ] Implement API key management and rotation
- [ ] Create audit logging for all sensitive operations
- [ ] Add data encryption for sensitive information

### 8.3 Monitoring & Logging

- [ ] Set up comprehensive error monitoring
- [ ] Implement structured logging with log aggregation
- [ ] Create health check endpoints
- [ ] Add performance monitoring and alerts

## Phase 9: Testing & Quality Assurance

### 9.1 Backend Testing

- [ ] Write unit tests for all service functions
- [ ] Create integration tests for API endpoints
- [ ] Implement webhook testing with mock RetellAI responses
- [ ] Add database integration tests

### 9.2 Frontend Testing

- [ ] Write component tests for all UI components
- [ ] Create end-to-end tests for critical user flows
- [ ] Implement visual regression testing
- [ ] Add accessibility testing

### 9.3 Load Testing

- [ ] Create load tests for high-volume scenarios
- [ ] Test webhook processing under load
- [ ] Validate database performance with large datasets
- [ ] Test concurrent campaign launches

## Phase 10: Deployment & DevOps

### 10.1 Environment Setup

- [ ] Configure development, staging, and production environments
- [ ] Set up environment-specific configurations
- [ ] Implement secret management
- [ ] Create deployment scripts and automation

### 10.2 CI/CD Pipeline

- [ ] Set up automated testing pipeline
- [ ] Create automated deployment workflows
- [ ] Implement rollback procedures
- [ ] Add deployment monitoring and health checks

### 10.3 Documentation

- [ ] Create API documentation
- [ ] Write user manuals for admin and client dashboards
- [ ] Document deployment and maintenance procedures
- [ ] Create troubleshooting guides

## Technical Notes

**Architecture Decisions:**

- Use MongoDB for flexibility with call data and analytics
- Implement webhook-first approach for real-time updates
- Separate RetellAI costs from client billing for profit tracking
- Use credit reservation system to prevent overspending

**Key Integrations:**

- RetellAI: Primary voice calling platform
- Twilio: Phone number provisioning (backup/alternative)
- MongoDB: Primary database
- Redis: Caching and session management

**Security Considerations:**

- All API keys stored in environment variables
- Webhook signature verification required
- Role-based access control throughout
- Audit logging for financial transactions

**Performance Targets:**

- Support 1000+ concurrent calls
- Process webhooks within 100ms
- Dashboard load times under 2 seconds
- 99.9% uptime for core services

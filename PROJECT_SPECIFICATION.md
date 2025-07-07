# BOB EXPLORER V3 - WhatsApp CRM Application

## Project Overview
**BOB EXPLORER** is an Electron.js desktop application that provides a "WhatsApp on steroids" experience for managing WhatsApp Business conversations. It serves as the central command hub for WhatsApp sales, support, and automation.

## Core Purpose
- View and manage WhatsApp Business number (581006905101002) conversations
- Enable seamless handover between AI agent (Bob) and human staff
- Centralize customer data, RFQs, and conversation history
- Provide real-time notifications and conversation monitoring
- Schedule follow-ups and manage customer relationships

## Database Configuration
**Railway PostgreSQL Database:**
- Host: switchback.proxy.rlwy.net
- Port: 27066
- Database: railway
- User: railway
- Password: ZcqoQLA2X2w70Qh!I6_n94wAw9nqpQ_d

**Existing Tables:**
- `customers` - Customer information
- `rfq_products` - Products in RFQ requests
- `rfq_requests` - RFQ request data
- `chat_sessions` - WhatsApp chat sessions
- `chat_messages` - Individual messages
- `staff_users` - Staff authentication and roles
- `customer_notes` - Staff notes about customers

## WhatsApp Business API Integration
- Phone Number ID: 581006905101002
- Business Account ID: 569761626112138
- Token: EAANwRHZAVbqoBOx8jKJtdMWKQ4bZCcDEsZA030CKWDZBxgZCbxHixiDLaP7rBBOHSLZBLXNB9f0ZCDsgTUiKZCPtYW3RZBtyDukpzKXZBGzDZCRLh9ZChZAe1xuJo6MFTQrLiha4kKGaURilme72yibjeYt3LsCz5hglufPV1Bp4AeNIFD5qxUP0ZCUTFGTEiCem0NtBplpwZDZD
- Webhook URL: https://bob-explorer-webhook-production.up.railway.app/api/whatsapp/webhook

## Key Features Required

### 1. Authentication & User Management
- **Login System**: Staff authentication with role-based access
- **Default Admin**: Username: `Pieter87` (exists in database)
- **User Management**: Admin can add/remove staff members
- **Role-Based Permissions**: Admin vs. Staff access levels

### 2. WhatsApp-like Interface
- **Modern UI**: Clean, black/white/grey color scheme with shadcn components
- **Chat Sidebar**: List of active customer conversations
- **Message View**: Real-time chat interface with message bubbles
- **Media Support**: Images, voice notes, documents, videos
- **Profile Pictures**: Display actual customer WhatsApp profile pictures

### 3. Customer Management
- **Customer Details Drawer**: Opens when clicking customer info button
- **RFQ History**: Display recent RFQ requests with order numbers
- **Customer Notes**: Staff can add/edit notes about customers
- **Hot Customer Marking**: Flag high-priority customers ready to buy
- **Customer Profiles**: Complete customer information display

### 4. Staff Features
- **Chat Assignment**: Assign staff members to specific conversations
- **Handover System**: Transfer chat to staff member's WhatsApp number
- **Multi-Staff Chat**: Multiple staff can view/respond in same window
- **Staff Notifications**: Desktop notifications for new messages
- **Workload Monitoring**: Managers can track staff activity

### 5. Messaging Capabilities
- **Send Text Messages**: Direct messaging through WhatsApp Business API
- **Drag & Drop Media**: Upload and send images/documents
- **Voice Notes**: Record and send voice messages
- **Message Status**: Sent/delivered/read indicators
- **Real-time Updates**: Live message synchronization

### 6. Advanced Features
- **Calendar Integration**: Schedule automatic follow-ups
- **AI Agent Handover**: Seamless transition between Bob (AI) and human staff
- **Follow-up Scheduling**: Configure automated follow-ups via n8n
- **Conversation Analytics**: Track conversation quality and outcomes
- **Admin Controls**: Remove chats and manage database records

### 7. Data Management
- **RFQ-Initiated Chats Only**: Only show conversations from RFQ workflow
- **Message Sorting**: Chronological order with proper timestamps
- **Data Synchronization**: Real-time sync with Railway webhook
- **Backup Integration**: Fallback to database messages if API unavailable

### 8. UI/UX Requirements
- **Responsive Design**: Works on various desktop screen sizes
- **Dark/Light Themes**: User preference-based theming
- **Smooth Animations**: Modern micro-interactions
- **Intuitive Navigation**: WhatsApp-familiar interface patterns
- **Loading States**: Proper feedback for all operations

## Technical Architecture

### Frontend Stack
- **Electron.js**: Desktop application framework
- **React**: UI component library
- **shadcn/ui**: Component system for modern UI
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations

### Backend Integration
- **PostgreSQL**: Database via Railway
- **WhatsApp Business API**: Message handling
- **Railway Webhook**: Real-time message updates
- **n8n Integration**: AI agent coordination

### Development Approach
- **Modular Architecture**: Feature-based folder structure
- **Small Files**: Token-constraint friendly development
- **Component Reusability**: Shared UI components
- **Service Layer**: Abstracted API calls
- **Error Handling**: Comprehensive error management

## User Workflows

### 1. Staff Login
1. Open application
2. Enter credentials (Pieter87 as admin)
3. Access main dashboard

### 2. Customer Conversation
1. View chat list in sidebar
2. Click on customer conversation
3. See message history with media
4. Send responses or assign to staff
5. Add notes about customer

### 3. Admin Management
1. Access user management settings
2. Add new staff members
3. Assign roles and permissions
4. Monitor conversation assignments

### 4. Follow-up Scheduling
1. Open customer details
2. Access calendar integration
3. Schedule automated follow-ups
4. Configure AI agent or staff assignment

## Success Criteria
- ✅ Professional WhatsApp-like interface
- ✅ Real-time message synchronization
- ✅ Complete media support (images, voice, documents)
- ✅ Staff assignment and handover functionality
- ✅ Customer data integration with RFQ system
- ✅ Desktop notifications for new messages
- ✅ Admin user management capabilities
- ✅ Calendar-based follow-up scheduling
- ✅ Modular, maintainable codebase

## Future Enhancements
- Advanced analytics and reporting
- CRM integration capabilities
- Mobile companion app
- Advanced AI agent training interface
- Bulk message operations
- Advanced conversation routing

## Development Timeline
1. **Phase 1**: Core structure and authentication (Complete)
2. **Phase 2**: WhatsApp integration and basic chat (In Progress)
3. **Phase 3**: Customer management and media support
4. **Phase 4**: Staff management and notifications
5. **Phase 5**: Calendar integration and follow-ups
6. **Phase 6**: Polish and optimization

---

**Project Directory**: `C:\Code Projects\Bob3`
**Repository**: New project (will integrate with existing webhook system)
**Deployment**: Windows desktop application (.exe installer)

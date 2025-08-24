# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Iris (Iris)** is a personality-based photo styling and photographer matching platform built on Next.js. It transforms from the existing `sunset-cinema` project into a comprehensive system that:

1. **Personality Diagnosis**: 21-question psychological assessment determining one of 9 personality types
2. **AI Image Generation**: Creates style previews based on user photos and personality
3. **Photographer Matching**: Connects users with compatible photographers
4. **Booking System**: Handles appointment scheduling and management

## Development Commands

### Essential Commands
```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint and fix code
npm run lint
```

### Database Management
```bash
# Start local Supabase (if using locally)
npx supabase start

# Generate TypeScript types from Supabase
npx supabase gen types typescript --local > types/database.types.ts

# Apply database migrations
npx supabase db push
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript with strict mode
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query for server state, React hooks for client state
- **Image Handling**: browser-image-compression, html2canvas-pro
- **AI Integration**: OpenAI DALL-E, Runway API

### Key Directories

- `app/` - Next.js App Router pages and layouts
  - `admin/` - Admin dashboard and management
  - `gallery/` - Public photo gallery
  - `login/` - Authentication pages
- `components/` - Reusable UI components
  - `admin/` - Admin-specific components
  - `inquiry/` - Personality quiz and booking forms
  - `ui/` - shadcn/ui base components
- `lib/` - Utility functions and configurations
  - `actions/` - Server actions
  - `supabase/` - Database client configurations
  - `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `specs/` - Detailed project documentation

## Database Schema

### Core Tables

**Personality System:**
- `personality_types` - 9 personality type definitions (A1, A2, B1, C1, D1, E1, E2, F1, F2)
- `quiz_questions` - 21 assessment questions
- `quiz_choices` - Multiple choice options for each question
- `choice_weights` - Scoring weights for personality calculation
- `quiz_sessions` - User session tracking
- `quiz_responses` - Individual user answers

**User Management:**
- `photographers` - Photographer/admin accounts
- `admin_portfolio_photos` - Photographer portfolios

**Matching System:**
- `personality_admin_mapping` - Photographer-personality compatibility scores
- `personality_photos` - Curated gallery photos per personality type

**AI & Booking:**
- `ai_image_generations` - AI preview generation tracking
- `inquiries` - Booking requests and customer information
- `available_slots` - Photographer availability

**Review System:**
- `reviews` - Anonymous review system with token-based access

## Key Implementation Patterns

### State Management
- Use React Query (`@tanstack/react-query`) for server state
- Supabase client configurations in `lib/supabase/`
- Server-side rendering with `lib/supabase/server.ts`
- Client-side operations with `lib/supabase/client.ts`

### Component Architecture
- Leverages shadcn/ui as base design system
- Admin components separate from public-facing components
- Responsive-first design with Tailwind CSS
- Form handling with `react-hook-form` and `zod` validation

## Important Implementation Notes

### Supabase Configuration
- Project ID: `kypwcsgwjtnkiiwjedcn`
- Uses Row Level Security (RLS) policies
- Edge functions in `supabase/functions/resend/` for email notifications
- Image storage configured for `belqqpwnajsccgrqbzfd.supabase.co` domain

### AI Image Generation
- Integrates with OpenAI DALL-E and Runway APIs
- Personality-specific prompts stored in `personality_types.ai_preview_prompt`
- User uploads processed through `browser-image-compression`
- Generation status tracked in `ai_image_generations` table

### Authentication & Authorization
- Supabase Auth for admin users
- Public access for personality assessments (anonymous users)
- Admin dashboard requires authentication
- RLS policies enforce data access controls

### Performance Considerations
- Next.js Image component with remote patterns configured
- Turbopack for fast development builds
- Database indexes on critical query paths
- React Query for efficient data caching

## Testing & Development

### File Structure Understanding
- Legacy components from `sunset-cinema` are being extended
- New personality-related features integrate with existing booking system
- Admin system expanded to handle photographer-personality mappings
- Gallery system adapted for personality-based photo curation

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RUNWAY_API_KEY=
NEXT_PUBLIC_APP_URL=
```

### Common Development Tasks

**Adding New Personality Features:**
1. Update database schema via Supabase dashboard
2. Regenerate types: `npx supabase gen types typescript --local > types/database.types.ts`
3. Implement server actions in `lib/actions/`
4. Create UI components following existing patterns
5. Add React Query hooks for data fetching

**Extending Admin Functionality:**
1. Components go in `components/admin/`
2. Pages go in `app/admin/`
3. Follow existing authentication patterns
4. Ensure RLS policies are updated

**Working with AI Integration:**
1. API calls handled in server actions
2. Status tracking in database
3. Error handling for API failures
4. User feedback during processing

## Migration Context

This project evolved from `sunset-cinema` (film photography booking) to Iris (personality-based matching). Key migration points:

- **Preserved**: Booking system, admin dashboard, photo management
- **Extended**: Database schema for personality features
- **Added**: Quiz system, AI generation, personality matching
- **Maintained**: TypeScript strict mode, Tailwind styling, Supabase infrastructure

Refer to detailed specifications in `specs/` directory for comprehensive feature requirements and implementation guidance.

## Debugging and Development Notes

- **Tools for Debugging and Schema Modification**:
  - Use Supabase MCP (Managed Control Panel) to inspect and modify database schema
  - Utilize Playwright MCP tools for comprehensive testing and debugging across different scenarios

## Development Guidelines

- **New Development Note**: Saved development guide at @specs/development-guide.md

## Authentication System Update (2025.01.18)

**MAJOR CHANGE**: The complex RBAC system has been completely removed and replaced with a simplified 2-system approach:

### Current Authentication Architecture
- **Admin System**: 
  - Users stored only in `auth.users` table
  - Identified by `user_metadata.user_type === 'admin'`
  - Signup via invite codes at `/admin/signup`
  - All authenticated users can access admin dashboard (no role guards)
- **Photographer System**:
  - Users stored in `auth.users` + `photographers` table 
  - Created by admin via `/admin/users`
  - Original flow maintained

### Key Changes Made
- ✅ Removed `role` column from `photographers` table
- ✅ Removed all AdminGuard and role-based access controls
- ✅ Simplified admin layout to only check authentication (not roles)
- ✅ Updated all user management functions for new system
- ✅ Maintained invite code system for admin signup

### Important Files Updated
- `app/admin/layout.tsx` - Removed role checking
- `lib/actions/user-management.ts` - Complete rewrite for new system
- `lib/actions/admin-auth.ts` - Removed role validations
- `components/admin/user-management.tsx` - Removed role field

## Recent Updates (2025.08.24)

### Admin-Photographer System Separation Completed
**MAJOR ARCHITECTURAL CHANGE**: Complete separation of Admin and Photographer systems with dedicated tables and routes.

#### Database Schema Changes
- ✅ **New `admins` table created**: Separate table for admin user profiles
  - Fields: `id`, `email`, `name`, `role`, `department`, `phone`, `created_at`, `updated_at`, `last_login_at`
  - Linked to Supabase `auth.users` via `id` field
- ✅ **Updated `photographers` table**: Removed admin-related fields, cleaned up structure
- ✅ **RLS Policies Fixed**: Resolved infinite recursion issues in `admins` table policies
  - Removed complex role-based policies causing recursion
  - Implemented simple authenticated user access: `auth.role() = 'authenticated'`

#### Route Structure Reorganization
- ✅ **Admin Routes** (`/admin/*`): System-wide management interface
  - `/admin/my-page` - Admin profile management using `admins` table
  - `/admin/schedule` - All photographers' schedules overview
  - `/admin/reviews` - All reviews from all photographers with filtering
  - `/admin/users` - User management (create admins/photographers)
- ✅ **Photographer Routes** (`/photographer-admin/*`): Individual photographer management
  - `/photographer-admin/dashboard` - Individual photographer dashboard
  - `/photographer-admin/schedule` - Own schedule management
  - `/photographer-admin/reviews` - Own reviews only
- ✅ **Public Routes** (`/photographers/*`): Public photographer listings maintained

#### Components Architecture
- ✅ **AdminProfileSettings**: New component for admin profile management
- ✅ **AdminScheduleOverview**: System-wide schedule calendar view
- ✅ **AdminAllReviewsManagement**: All reviews management with photographer filtering
- ✅ **Photographer Sidebar**: Dedicated navigation for photographer admin area

#### Server Actions Updates
- ✅ **`lib/actions/admin.ts`**: Complete admin CRUD operations
  - `getCurrentAdmin()` - Get/create admin records
  - `updateAdminProfile()` - Admin profile updates
  - `createAdmin()` - Create new admin users (super admin only)
  - `getAllAdmins()` - List all admins
- ✅ **Authentication Flow**: Automatic user type detection and redirection
- ✅ **Permission System**: Simplified from complex RBAC to authentication-based

#### Bug Fixes Applied
- ✅ **TypeScript Errors**: Fixed all null value handling in interfaces
- ✅ **Database Query Issues**: Corrected field references (`matched_admin_id` vs `photographer_id`)
- ✅ **RLS Policy Recursion**: Eliminated infinite recursion in admin table policies
- ✅ **Component Type Mismatches**: Updated all interfaces to handle nullable database fields

#### Security Improvements
- ✅ **Row Level Security**: Proper policies without recursion issues
- ✅ **Data Isolation**: Admins see system-wide data, Photographers see only their own
- ✅ **Authentication Guards**: Proper checks for admin vs photographer access

### Current System Status
- **Admin System**: Fully operational with dedicated table and routes
- **Photographer System**: Individual management interface at `/photographer-admin/*`
- **Public Interface**: Maintained at `/photographers/*` for user browsing
- **Authentication**: Simplified and secure with proper user type separation

## Tools and Workflow Notes

- If needed, use Supabase MCP to:
  - Change database schema
  - Modify table policies
  - Utilize supabase-heechan tool for project with ID `kypwcsgwjtnkiiwjedcn`
- **Documentation**: New auth system documented at @specs/authentication-update-2025.md
- **Daily Tasks**: Track ongoing work at @todos/20250824.md
- and everytime you done your work, mark as checked in the @specs/feature.md file. it is important to keep track of the work that is finished and not finished that needs to worked on.
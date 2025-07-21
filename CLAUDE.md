# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Photo4You (Iris)** is a personality-based photo styling and photographer matching platform built on Next.js. It transforms from the existing `sunset-cinema` project into a comprehensive system that:

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
- `admin_users` - Photographer/admin accounts
- `admin_portfolio_photos` - Photographer portfolios

**Matching System:**
- `personality_admin_mapping` - Photographer-personality compatibility scores
- `personality_photos` - Curated gallery photos per personality type

**AI & Booking:**
- `ai_image_generations` - AI preview generation tracking
- `inquiries` - Booking requests and customer information
- `available_slots` - Photographer availability

## Key Implementation Patterns

### Personality Type System
The platform revolves around 9 personality codes:
- **A1**: 고요한 관찰자 (Quiet Observer)
- **A2**: 따뜻한 동행자 (Warm Companion)
- **B1**: 감성 기록자 (Emotional Recorder)
- **C1**: 시네마틱 몽상가 (Cinematic Dreamer)
- **D1**: 활력 가득 리더 (Energetic Leader)
- **E1**: 도시의 드리머 (Urban Dreamer)
- **E2**: 무심한 예술가 (Indifferent Artist)
- **F1**: 자유로운 탐험가 (Free Explorer)
- **F2**: 감각적 실험가 (Sensory Experimenter)

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

This project evolved from `sunset-cinema` (film photography booking) to Photo4You (personality-based matching). Key migration points:

- **Preserved**: Booking system, admin dashboard, photo management
- **Extended**: Database schema for personality features
- **Added**: Quiz system, AI generation, personality matching
- **Maintained**: TypeScript strict mode, Tailwind styling, Supabase infrastructure

Refer to detailed specifications in `specs/` directory for comprehensive feature requirements and implementation guidance.
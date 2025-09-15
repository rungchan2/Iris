# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Iris (Iris)** is a photographer matching and booking platform built on Next.js. The system combines AI-powered photographer matching with streamlined booking and payment processing:

1. **10-Question Matching System**: Advanced embedding-based photographer matching using pgvector
2. **Direct Booking System**: Simplified appointment scheduling and management
3. **Photographer Management**: Admin-managed photographer accounts with 4-dimensional profile system
4. **Payment Processing**: Multi-PG payment system (Toss, Eximbay, Adyen, Stripe)
5. **Admin Dashboard**: Comprehensive management interface for matching settings, bookings, and analytics

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

# Sync Types with Supabase
npm run gen-types
```

### Database Management
```bash
# Generate TypeScript types from Supabase
npx supabase gen types typescript --project-id kypwcsgwjtnkiiwjedcn > types/database.types.ts
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript with strict mode
- **Database**: Supabase (PostgreSQL) with pgvector extension
- **AI/ML**: OpenAI embeddings (text-embedding-3-small), pgvector for similarity search
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query for server state, React hooks for client state
- **Image Handling**: browser-image-compression, html2canvas-pro

### Key Directories

- `app/` - Next.js App Router pages and layouts
  - `admin/` - Admin dashboard and matching system management
  - `matching/` - 10-question matching flow and results
  - `gallery/` - Public photo gallery
  - `login/` - Authentication pages
- `components/` - Reusable UI components
  - `admin/` - Admin-specific components (including matching system controls)
  - `matching/` - Matching flow components (questionnaire, results)
  - `booking/` - Booking and inquiry forms
  - `ui/` - shadcn/ui base components
- `lib/` - Utility functions and configurations
  - `actions/` - Server actions (including matching algorithms)
  - `supabase/` - Database client configurations
  - `hooks/` - Custom React hooks
  - `matching/` - Matching algorithms and embedding utilities
- `types/` - TypeScript type definitions
- `specs/` - Detailed project documentation

## Database Schema

### Core Tables (Legacy)

**User Management:**
- `users` - General users (customers) for payment/booking system
- `photographers` - Photographer accounts with approval workflow
- `products` - Unified photo packages with admin approval system

**Payment System (2025.08.31):**
- `payments` - PG-neutral payment processing
- `refunds` - Comprehensive refund management
- `settlements` - Automated photographer settlement system
- `payment_logs` - Detailed audit trail

**Booking System:**
- `inquiries` - Booking requests and customer information
- `available_slots` - Photographer availability management
- `reviews` - Anonymous review system

### New Matching System Tables (2025.09.16)

**Matching Core:**
- `survey_questions` - 10-question master template (admin configurable)
- `survey_choices` - Choice options with embeddings (Q1-Q6, Q8-Q9)
- `survey_images` - Image choices with embeddings (Q7)
- `matching_sessions` - User questionnaire sessions with aggregated embeddings
- `matching_results` - 4-dimensional matching scores and rankings

**4-Dimensional Photographer Profiles:**
- `photographer_profiles` - Extended profiles with 4 description dimensions:
  - `style_emotion_description` + `style_emotion_embedding` (40% weight)
  - `communication_psychology_description` + `communication_psychology_embedding` (30% weight)
  - `purpose_story_description` + `purpose_story_embedding` (20% weight)
  - `companion_description` + `companion_embedding` (10% weight)
- `photographer_keywords` - Specialty keywords with proficiency levels

**Analytics & Optimization (V2/V3):**
- `weight_experiments` - A/B testing for matching weights
- `experiment_sessions` - Session assignment to experiments
- `user_feedback` - Matching quality feedback collection
- `matching_performance_logs` - System performance tracking
- `embedding_jobs` - Async embedding regeneration queue

**System Management:**
- `system_settings` - Global matching configuration
- Enhanced `photos` table with `image_embedding` for portfolio matching

## Matching System Architecture

### 4-Dimensional Matching Algorithm

**Question Weight Distribution:**
- **Style/Emotion (40%)**: Q6 (keyword), Q7 (image), Q8 (lighting), Q9 (location)
- **Communication/Psychology (30%)**: Q3 (comfort), Q4 (atmosphere), Q5 (immersion)
- **Purpose/Story (20%)**: Q1 (purpose), Q10 (subjective text)
- **Companion (10%)**: Q2 (companion type) - also serves as hard filter

**Matching Pipeline:**
1. **Hard Filtering**: Region, budget, companion type, keyword compatibility
2. **4D Similarity**: Each user response mapped to corresponding photographer dimension
3. **Keyword Bonus**: Graduated scoring (1-3+ matches = 50%-100% bonus weight)
4. **Final Ranking**: Weighted combination of similarity scores

### Embedding Strategy
- **Pre-computed**: All choice options and photographer profiles
- **Real-time**: Only Q10 subjective responses
- **Admin-triggered**: Regeneration via `embedding_jobs` queue when content changes
- **Model**: OpenAI text-embedding-3-small (1536 dimensions)

## Key Implementation Patterns

### Matching Flow Components
- `QuestionFlow` - Progressive 10-question interface
- `MatchingResults` - Ranked photographer display with explanation
- `PhotographerMatchCard` - Individual result with 4D score breakdown

### Admin Matching Controls
- Question/choice text editing with auto-embedding regeneration
- Weight experiment setup and A/B testing
- Performance analytics and matching quality metrics
- Photographer profile completeness monitoring

### State Management
- React Query for matching results and photographer data
- Session token-based anonymous matching (no login required)
- Supabase real-time subscriptions for admin dashboards

## Important Implementation Notes

### Supabase Configuration
- Project ID: `kypwcsgwjtnkiiwjedcn`
- **pgvector extension enabled** for similarity search
- IVFFLAT indexes on all embedding columns for performance
- RLS policies support anonymous matching via session tokens

### Authentication & Authorization
- **Anonymous Matching**: Full questionnaire and results without login
- **Session Tokens**: Secure access to anonymous matching results
- **Admin Controls**: Full matching system configuration access
- **Photographer Profiles**: 4-dimensional description management

### Performance Considerations
- pgvector indexes optimized for embedding similarity search
- Batch embedding generation via background jobs
- Caching of frequent matching queries
- Efficient hard filtering before expensive similarity calculations

## Matching System Development

### Adding New Questions
1. Insert into `survey_questions` with proper weights
2. Add choices to `survey_choices` or images to `survey_images`
3. Update matching algorithm to handle new question type
4. Regenerate embeddings via `embedding_jobs`

### Modifying Matching Weights
1. Create new `weight_experiments` entry
2. A/B test with `experiment_sessions` assignment
3. Monitor performance via `matching_performance_logs`
4. Update `system_settings` with successful configurations

### Extending Photographer Profiles
1. Add new description fields to `photographer_profiles`
2. Create corresponding embedding columns
3. Update matching algorithm dimensions
4. Modify admin interface for profile management

## Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY= # Required for embedding generation
RUNWAY_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Recent Updates

### 2025.09.16 - Matching System Implementation
**MAJOR FEATURE**: Complete 10-question photographer matching system

#### Database Architecture
- ✅ **pgvector Integration**: Semantic similarity search with 1536-dimension embeddings
- ✅ **4-Dimensional Profiles**: Photographer descriptions split by matching categories
- ✅ **Admin-Configurable Questions**: Dynamic question/choice management with auto-embedding
- ✅ **Anonymous Matching**: Token-based system for non-logged users
- ✅ **V2/V3 Analytics Framework**: A/B testing and performance tracking infrastructure

#### Matching Algorithm
- ✅ **Weighted Similarity**: 40/30/20/10 distribution across style/communication/purpose/companion
- ✅ **Hard Filtering**: Budget, region, companion compatibility pre-filtering
- ✅ **Keyword Bonuses**: Graduated scoring for specialty matching
- ✅ **Real-time Optimization**: Only Q10 subjective responses generate embeddings live

#### User Experience
- ✅ **Progressive Questionnaire**: 10-question flow with image selection
- ✅ **Explained Results**: 4D score breakdown with matching highlights
- ✅ **Anonymous Access**: Full matching without account creation
- ✅ **Photographer Profiles**: Rich 4-dimensional profile system

### Previous Major Updates
- **2025.08.31**: Multi-PG payment system and product consolidation
- **2025.08.24**: Admin-photographer system separation
- **2025.01.18**: RBAC simplification to 2-tier structure

## Development Guidelines

### Matching System Development
- Use `lib/actions/matching.ts` for core matching logic
- Embedding generation in `lib/embedding/` utilities
- Admin matching controls in `components/admin/matching/`
- Anonymous user flow in `app/matching/` routes

### Database Schema Changes
- Always regenerate TypeScript types after schema changes
- Use migrations for pgvector index updates
- Test RLS policies with anonymous session tokens
- Monitor embedding job queue for async operations

## Tools and Workflow Notes

- **Database Management**: Use Supabase MCP tools for schema modifications
- **Embedding Operations**: OpenAI API integration for text-embedding-3-small
- **Performance Monitoring**: pgvector query performance and matching analytics
- **A/B Testing**: Weight experiment framework for matching optimization

## Key Database Changes (2025.09.16)

### Matching System Tables
```sql
-- Core matching infrastructure
survey_questions (id, question_key, weight_category, base_weight)
survey_choices (id, question_id, choice_key, choice_embedding)
survey_images (id, question_id, image_key, image_embedding)
matching_sessions (id, session_token, responses, final_user_embedding)

-- 4D photographer profiles
photographer_profiles (
  photographer_id,
  style_emotion_embedding,
  communication_psychology_embedding, 
  purpose_story_embedding,
  companion_embedding
)

-- Results and analytics
matching_results (id, session_id, photographer_id, 4d_scores, total_score)
weight_experiments (id, weight_config, performance_metrics)
```

### Performance Indexes
```sql
-- pgvector similarity search optimization
CREATE INDEX USING ivfflat ON survey_choices (choice_embedding vector_cosine_ops);
CREATE INDEX USING ivfflat ON photographer_profiles (style_emotion_embedding vector_cosine_ops);
-- Additional indexes for all embedding dimensions
```
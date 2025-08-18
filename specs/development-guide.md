# Photo4You Development Guide

## 🎯 Project Overview & Development Principles

**Photo4You (Iris)** is a personality-based photo styling and photographer matching platform that transforms an existing photography booking system into a comprehensive personality-driven service. The development follows a **sequential, path-by-path approach** to ensure quality and maintainability.

### Core Development Philosophy

1. **Sequential Development**: Complete one route/feature at a time before moving to the next
2. **No API Routes**: Use Next.js Server Actions exclusively for server-side logic
3. **Incremental Enhancement**: Build upon existing stable foundation
4. **Path-First Approach**: Focus on completing entire user journeys, not individual components

## 🏗️ Technical Architecture Requirements

### Data Layer
- **Database**: Supabase PostgreSQL with existing schema + personality extensions
- **Server Logic**: Next.js Server Actions in `lib/actions/` directory
- **Client State**: React Query for server state, React hooks for client state
- **Authentication**: Supabase Auth with Row Level Security (RLS)

### Frontend Stack
- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS + shadcn/ui components
- **Forms**: react-hook-form + zod validation
- **Image Handling**: browser-image-compression, Next.js Image component

### File Structure Conventions
```
app/                          # Next.js App Router pages
├── (public routes)/          # Anonymous user accessible
├── admin/                    # Authenticated admin routes
└── api/ (FORBIDDEN)          # DO NOT USE - Use Server Actions instead

lib/actions/                  # Server Actions (replaces API routes)
├── quiz.ts                   # Personality assessment logic
├── personality.ts            # Personality type management
├── ai.ts                     # AI image generation
└── matching.ts               # Photographer matching

components/                   # Reusable UI components
├── ui/                       # shadcn/ui base components
├── quiz/                     # Personality quiz components
├── landing/                  # Landing page components
└── booking/                  # Booking flow components
```

## 📋 Development Phases & Execution Strategy

### Phase 1: Landing Page & Database Foundation
**Objective**: Create marketing-focused homepage and establish personality data infrastructure

**Execution Order**:
1. **Database Schema Extension**
   - Create personality_types, quiz_questions, quiz_choices, choice_weights tables
   - Migrate CSV data to PostgreSQL
   - Set up proper indexes and RLS policies

2. **Landing Page Development** (`/`)
   - Replace existing inquiry flow with marketing content
   - Implement hero section with value proposition
   - Add 9 personality types preview section
   - Create service features showcase
   - Add main CTA button linking to `/quiz`

3. **Navigation & Routing Setup**
   - Ensure proper routing from landing to quiz
   - Maintain existing admin routes
   - Test all navigation flows

### Phase 2: Personality Assessment System
**Objective**: Build complete 21-question personality diagnosis system

**Execution Order**:
1. **Quiz Route Structure** (`/quiz`)
   - Create session management system
   - Implement progress tracking
   - Build question navigation logic

2. **Server Actions Implementation**
   - `lib/actions/quiz.ts`: Session CRUD, response storage
   - `lib/actions/personality.ts`: Score calculation algorithm
   - Error handling and validation

3. **Quiz UI Components**
   - Question display with image/text support
   - Progress bar and navigation
   - Response collection and validation
   - Loading states and transitions

### Phase 3: Results & AI Integration
**Objective**: Display personality results and integrate AI image generation

**Execution Order**:
1. **Results Page Structure** (`/quiz/result/[sessionId]`)
   - Personality type display
   - Recommended photos gallery
   - AI image generation section

2. **AI Server Actions** (`lib/actions/ai.ts`)
   - OpenAI DALL-E API integration
   - Image upload and processing
   - Generation status management

3. **AI UI Components**
   - Photo upload interface
   - Generation progress indicators
   - Result display and download

### Phase 4: Photographer Matching
**Objective**: Connect personality types with compatible photographers

**Execution Order**:
1. **Matching Algorithm** (`lib/actions/matching.ts`)
   - Compatibility scoring system
   - Photographer ranking logic
   - Data retrieval optimization

2. **Photographer Display**
   - Recommended photographers section
   - Compatibility score visualization
   - Portfolio preview integration

3. **Booking Integration**
   - Connect to existing booking system
   - Pass personality context to booking flow
   - Maintain booking functionality

## 🔐 RBAC (Role-Based Access Control) System

### Overview
Photo4You implements a comprehensive RBAC system that separates users into distinct types with granular permission control. This ensures secure access management and scalable authorization.

### User Types & Roles
1. **Super Admin** (`super_admin`): Full system access, user management
2. **Admin** (`admin`): Content and inquiry management, limited user access
3. **Photographer** (`photographer`): Portfolio and schedule management, own content only

### Core RBAC Components

#### 1. Types & Permissions (`lib/rbac/types.ts`)
```typescript
// Permission categories
type Permission = 
  | 'users.create' | 'users.read' | 'users.update' | 'users.delete'
  | 'photos.create' | 'photos.read' | 'photos.update' | 'photos.delete'
  | 'categories.create' | 'categories.read' | 'categories.update' | 'categories.delete'
  | 'inquiries.read' | 'inquiries.update' | 'inquiries.delete'
  | 'schedule.create' | 'schedule.read' | 'schedule.update' | 'schedule.delete'
  | 'system.config' | 'system.logs'
  | 'analytics.read'

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [/* all permissions */],
  admin: [/* most permissions except user management */],
  photographer: [/* limited permissions for own content */]
}
```

#### 2. Permission Hooks (`lib/rbac/hooks.ts`)
```typescript
// Check if user has specific permission
const hasPermission = usePermissions(['photos.create', 'photos.update'])

// Check user role
const isAdmin = useIsAdmin()
const isSuperAdmin = useIsAdmin(true) // super admin only

// Get current user profile with type detection
const { profile, userType, isLoading } = useUserProfile()
```

#### 3. Guard Components (`lib/rbac/components.tsx`)
```typescript
// Protect entire components
<AdminGuard>
  <SensitiveAdminContent />
</AdminGuard>

<AdminGuard superAdminOnly>
  <SuperAdminOnlyContent />
</AdminGuard>

<PermissionGuard permissions={['users.create']}>
  <UserCreationForm />
</PermissionGuard>

<RoleGuard roles={['admin', 'super_admin']}>
  <ManagementDashboard />
</RoleGuard>
```

### Implementation Patterns

#### Server Actions with Permission Checks
```typescript
'use server'

export async function sensitiveAction() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  
  // Check permissions
  const { data: admin } = await supabase
    .from('admins')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
    return { error: 'Insufficient permissions' }
  }
  
  // Proceed with action...
}
```

#### Component-Level Protection
```typescript
// In admin pages
import { AdminGuard } from '@/lib/rbac/components'

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  )
}

// In sensitive sections
import { usePermissions } from '@/lib/rbac/hooks'

export function UserManagement() {
  const canCreateUsers = usePermissions(['users.create'])
  
  return (
    <div>
      {canCreateUsers && (
        <CreateUserButton />
      )}
    </div>
  )
}
```

#### Navigation Filtering
```typescript
// Sidebar component with permission-based filtering
import { usePermissions } from '@/lib/rbac/hooks'

const navigationItems = [
  { label: 'Users', href: '/admin/users', permission: 'users.read' },
  { label: 'Photos', href: '/admin/photos', permission: 'photos.read' },
  { label: 'System', href: '/admin/system', permission: 'system.config' }
]

export function Sidebar() {
  const permissions = usePermissions(navigationItems.map(item => item.permission))
  
  return (
    <nav>
      {navigationItems
        .filter((item, index) => permissions[index])
        .map(item => (
          <SidebarItem key={item.href} {...item} />
        ))}
    </nav>
  )
}
```

### User Management Workflows

#### Initial Setup
1. **First Time Setup**: Visit `/superadmin` to create initial Super Admin
2. **Super Admin Creation**: One-time use page, automatically disabled after first admin
3. **Subsequent Admins**: Use `/admin/users` page to create additional users

#### User Creation Process
```typescript
// For admins (requires super_admin role)
await createAdminUser({
  email: 'admin@example.com',
  password: 'securePassword',
  name: 'Admin Name',
  role: 'admin' // or 'super_admin'
})

// For photographers (requires admin+ role)
await createPhotographerUser({
  email: 'photographer@example.com',
  password: 'securePassword',
  name: 'Photographer Name',
  phone: '+1234567890',
  bio: 'Professional photographer'
})
```

#### Authentication Flow
1. **Login**: User enters credentials at `/login`
2. **Type Detection**: System automatically detects user type (admin vs photographer)
3. **Permission Loading**: User permissions and profile loaded
4. **Smart Redirect**: Automatic redirect based on user type and permissions
5. **Navigation Filtering**: Sidebar and menus filtered based on permissions

### Database Security

#### Row Level Security (RLS) Policies
```sql
-- Admins table access
CREATE POLICY "Admins can view their profile or super_admins can view all"
ON admins FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'super_admin')
);

-- Photographers table access  
CREATE POLICY "Photographers can update their profile"
ON photographers FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage photographers"
ON photographers FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);

-- Photos access control
CREATE POLICY "Photographers manage own photos"
ON photos FOR ALL USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all photos"
ON photos FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);
```

### Best Practices

#### 1. Always Use Guard Components
```typescript
// ❌ Don't expose sensitive content without guards
export function AdminPage() {
  return <SensitiveContent /> // Anyone can access!
}

// ✅ Always wrap with appropriate guards
export function AdminPage() {
  return (
    <AdminGuard>
      <SensitiveContent />
    </AdminGuard>
  )
}
```

#### 2. Server-Side Permission Checks
```typescript
// ❌ Client-side only checks are not secure
export function deleteUser(id: string) {
  // Anyone can call this!
  return fetch(`/api/users/${id}`, { method: 'DELETE' })
}

// ✅ Always validate permissions on server
'use server'
export async function deleteUser(id: string) {
  // Server-side permission check
  const hasPermission = await checkUserPermission('users.delete')
  if (!hasPermission) return { error: 'Unauthorized' }
  
  // Proceed with deletion...
}
```

#### 3. Principle of Least Privilege
- Grant minimal necessary permissions
- Use specific permissions instead of broad roles
- Regularly audit user permissions
- Implement permission expiration for temporary access

#### 4. Error Handling
```typescript
// ✅ Graceful permission failures
const hasPermission = usePermissions(['users.create'])

return (
  <div>
    {hasPermission ? (
      <CreateUserForm />
    ) : (
      <Alert>You don't have permission to create users.</Alert>
    )}
  </div>
)
```

### Testing RBAC

#### Unit Testing Permissions
```typescript
// Test permission logic
import { hasPermission } from '@/lib/rbac/utils'

describe('RBAC Permissions', () => {
  test('super_admin has all permissions', () => {
    expect(hasPermission('super_admin', 'users.delete')).toBe(true)
    expect(hasPermission('super_admin', 'system.config')).toBe(true)
  })
  
  test('photographer has limited permissions', () => {
    expect(hasPermission('photographer', 'users.delete')).toBe(false)
    expect(hasPermission('photographer', 'photos.create')).toBe(true)
  })
})
```

#### Integration Testing
```typescript
// Test guard components
import { render } from '@testing-library/react'
import { AdminGuard } from '@/lib/rbac/components'

test('AdminGuard blocks non-admin users', () => {
  // Mock non-admin user
  mockUser({ role: 'photographer' })
  
  const { queryByText } = render(
    <AdminGuard>
      <div>Admin Content</div>
    </AdminGuard>
  )
  
  expect(queryByText('Admin Content')).toBeNull()
})
```

### Security Considerations

1. **Never Trust Client-Side**: Always validate permissions on server
2. **Use TypeScript**: Leverage type safety for permission checks
3. **Regular Audits**: Review user permissions periodically
4. **Logging**: Track permission changes and access attempts
5. **Principle of Least Privilege**: Grant minimal necessary permissions
6. **Session Management**: Proper session timeout and refresh handling

## 🔧 Development Standards & Best Practices

### Code Quality Requirements
1. **TypeScript Strict Mode**: All code must pass strict type checking
2. **Error Handling**: Comprehensive error handling in all Server Actions
3. **Loading States**: Proper loading indicators for all async operations
4. **Responsive Design**: Mobile-first approach for all UI components
5. **Accessibility**: WCAG 2.1 AA compliance for all interactive elements
6. **RBAC Compliance**: Always implement proper permission checks

### Server Actions Standards
```typescript
// Template for Server Actions
'use server'

import { creatClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function actionName(formData: FormData) {
  try {
    const supabase = await creatClient()
    
    // Validation
    const data = validateInput(formData)
    
    // Database operation
    const result = await supabase
      .from('table_name')
      .operation(data)
    
    if (result.error) {
      return { error: result.error.message }
    }
    
    // Revalidate if needed
    revalidatePath('/relevant-path')
    
    return { success: true, data: result.data }
  } catch (error) {
    return { error: 'Operation failed' }
  }
}
```

### Component Development Guidelines
1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Define clear TypeScript interfaces for all props
3. **Error Boundaries**: Implement error boundaries for critical components
4. **Performance**: Use React.memo, useMemo, useCallback appropriately
5. **Testing**: Write unit tests for complex logic components

### Database Interaction Patterns
1. **RLS First**: Always implement Row Level Security policies
2. **Type Safety**: Use generated TypeScript types for all queries
3. **Error Handling**: Handle database errors gracefully
4. **Performance**: Optimize queries with proper indexing
5. **Transactions**: Use transactions for multi-table operations

## 📊 Quality Assurance Checklist

### Per-Phase Completion Criteria
- [ ] All TypeScript errors resolved
- [ ] All components responsive on mobile/desktop
- [ ] Error handling implemented and tested
- [ ] Loading states functional
- [ ] Database operations tested
- [ ] Navigation flows verified
- [ ] Performance optimized (Core Web Vitals)
- [ ] Security considerations addressed

### Integration Testing Requirements
- [ ] End-to-end user journey functional
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness confirmed
- [ ] Database integrity maintained
- [ ] Authentication flows working
- [ ] Error scenarios handled gracefully

## 🚀 Deployment & Monitoring

### Pre-Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build process successful
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Backup procedures in place

### Post-Deployment Monitoring
- [ ] Application performance metrics
- [ ] Error tracking and alerting
- [ ] Database performance monitoring
- [ ] User journey analytics
- [ ] AI API usage tracking
- [ ] Cost monitoring (Supabase, OpenAI)

## 🔍 Troubleshooting Guidelines

### Common Issues & Solutions
1. **Server Action Errors**: Check Supabase connection and RLS policies
2. **Type Errors**: Regenerate database types with `npx supabase gen types`
3. **Build Failures**: Verify all imports and dependencies
4. **Performance Issues**: Analyze bundle size and optimize images
5. **Authentication Problems**: Check Supabase Auth configuration

### Debug Procedures
1. Enable Next.js debug mode in development
2. Use Supabase dashboard for database queries
3. Monitor Network tab for API calls
4. Use React Developer Tools for component debugging
5. Check browser console for client-side errors

---

## 📝 Implementation Notes

This guide ensures systematic, high-quality development of Photo4You's personality-based features while maintaining the stability of existing functionality. Each phase builds upon the previous one, creating a robust and scalable platform.

**Key Success Factors:**
- Sequential development prevents feature conflicts
- Server Actions provide better performance than API routes
- Existing admin system provides proven foundation
- Personality data preparation enables rapid feature development
- Mobile-first approach ensures broad accessibility
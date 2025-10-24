# Project Context

## Purpose
GarmentFlow is a comprehensive production process tracking system designed specifically for the garment industry. The application digitizes and tracks the entire production workflow, enabling manufacturers to monitor work orders, quality control, sales orders, customer management, and production analytics in real-time.

## Tech Stack
- **Framework**: Next.js 15.5.4 with App Router and Turbopack
- **Language**: TypeScript 5.x with strict mode enabled
- **UI Library**: React 19.1.0 with Radix UI components
- **Styling**: Tailwind CSS 4.0 with custom design system
- **Form Management**: React Hook Form with Zod validation
- **Database/Backend**: Supabase for authentication and data persistence
- **Data Visualization**: Recharts for production and performance charts
- **State Management**: React built-in state and Next.js server state
- **Development Tools**: ESLint with Next.js configuration, TypeScript

## Project Conventions

### Code Style
- **Formatting**: Uses class-variance-authority (CVA) for component variants
- **ClassNames**: Custom `cn()` utility combining clsx and tailwind-merge
- **Imports**: Uses absolute imports with `@/*` path mapping (e.g., `@/components/ui/button`)
- **Component Structure**: Radix UI pattern with slots and forward refs
- **TypeScript**: Strict mode enabled, proper type definitions throughout

### Architecture Patterns
- **App Router**: Next.js 15 App Router with server/client components
- **UI Components**: Follows shadcn/ui pattern with accessible Radix UI primitives
- **File Organization**:
  - `src/app/*` - Next.js pages and API routes
  - `src/components/ui/*` - Reusable UI components
  - `src/components/*` - Business-specific components
  - `src/lib/*` - Utilities and configurations
  - `src/utils/supabase/*` - Database and auth utilities

### Testing Strategy
- No testing framework currently configured
- ESLint for code quality and type checking
- Next.js built-in development and production builds

### Git Workflow
- **Current Branch**: `bugs` (development branch)
- **Main Branch**: Default (production)
- **Commit Style**: Conventional commits with automated messages
- **Recent Work**: UI redesign, bug fixes, and build improvements

## Domain Context
This is a business process management system for garment manufacturing with the following key modules:
- **Dashboard**: Production overview and KPI tracking
- **Work Orders**: Manufacturing job management and tracking
- **Quality Control**: Inspection and quality assurance workflows
- **Sales Orders**: Customer order processing and management
- **Customers**: Client relationship management
- **Reports**: Production analytics and business intelligence

The system handles typical garment industry workflows including design approval, material sourcing, production planning, quality checkpoints, and delivery tracking.

## Important Constraints
- **Performance**: Uses Turbopack for fast development builds
- **Accessibility**: Follows Radix UI accessibility standards
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Authentication**: Supabase-based user authentication
- **Real-time**: Production tracking needs near real-time updates

## External Dependencies
- **Supabase**: Authentication, database, and real-time subscriptions
- **Vercel Hosting**: Likely deployment target (Next.js application)
- **Web APIs**: Potential integration with manufacturing equipment APIs
- **External Services**: Possible integrations with ERP systems, inventory management

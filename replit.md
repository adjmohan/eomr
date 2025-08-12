# OMR Scan Pro

## Overview

OMR Scan Pro is a full-stack web application for Optical Mark Recognition (OMR) processing. The system allows users to upload scanned answer sheets or feedback forms, automatically processes them to detect marked responses, and provides comprehensive results analysis and reporting. Built with a modern React frontend and Express.js backend, the application features real-time processing status updates, batch management, and detailed analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and better developer experience
- **Routing**: Wouter for lightweight client-side routing without the complexity of React Router
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI primitives with shadcn/ui components for accessible, customizable design system
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript for API server
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **File Handling**: Multer for multipart file uploads with validation and size limits
- **Processing**: Simulated OMR processing pipeline (extensible for real computer vision integration)
- **Error Handling**: Centralized error handling middleware with structured responses

### Database Design
- **Primary Tables**: 
  - `users` - User management with role-based access
  - `batches` - Processing batch grouping and metadata
  - `omr_sheets` - Individual sheet processing results and responses
  - `omr_templates` - Configurable form templates
  - `feedback_questions` - Dynamic question definitions
  - `system_settings` - Application configuration
- **Schema Management**: Drizzle with PostgreSQL dialect and migration support
- **Validation**: Zod schemas for runtime type checking and API validation

### File Processing Pipeline
- **Upload Validation**: File type restrictions (JPG, PNG, PDF) with size limits
- **Processing Simulation**: Mock OMR detection with confidence scoring
- **Status Tracking**: Real-time processing status updates (pending → processing → completed/failed)
- **Result Storage**: Structured response data with metadata for review and analysis

### API Design
- **RESTful Structure**: Standard HTTP methods with consistent response formats
- **Batch Operations**: Grouped file processing with progress tracking
- **Export Functionality**: CSV/Excel export capabilities for results
- **Health Monitoring**: System status and statistics endpoints

### Authentication & Authorization
- **Prepared Infrastructure**: User roles (user, admin, teacher) with extensible permission system
- **Session Management**: Ready for session-based or JWT authentication
- **Role-Based Access**: Different interface views based on user permissions

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: Neon PostgreSQL serverless database driver for cloud deployment
- **drizzle-orm**: Modern TypeSQL ORM with excellent TypeScript support
- **@tanstack/react-query**: Powerful data synchronization for React applications
- **multer**: Node.js middleware for handling multipart/form-data file uploads
- **wouter**: Minimalist routing library for React applications

### UI Components
- **@radix-ui/***: Comprehensive suite of accessible, unstyled UI primitives
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Tool for building component variant APIs
- **lucide-react**: Beautiful, customizable SVG icons

### Development Tools
- **vite**: Next-generation frontend tooling for development and building
- **typescript**: Static type checking for JavaScript
- **zod**: TypeScript-first schema validation library
- **date-fns**: Modern JavaScript date utility library

### Processing Libraries
- **react-dropzone**: File drag-and-drop functionality
- **react-hook-form**: Performant forms with easy validation
- **embla-carousel-react**: Lightweight carousel library

### Styling & Design
- **@hookform/resolvers**: Validation resolvers for react-hook-form
- **cmdk**: Command palette component for search interfaces
- **clsx**: Utility for constructing className strings conditionally
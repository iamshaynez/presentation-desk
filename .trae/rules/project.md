# Presentation Desk Project Rules

## 1. Project Overview
**Presentation Desk** is a locally-run web application designed for training and presentation purposes. It allows users to browse courses, view presentation slides (images), read teaching materials (markdown), and take notes.

## 2. Technical Architecture
*   **Frontend**: React (Vite), Tailwind CSS, Lucide React, React Router, React Markdown.
*   **Backend**: Express.js (running on port 3001), serving as a lightweight API layer for file system operations.
*   **Development**: Uses `concurrently` to run both Vite (port 5173) and Express (port 3001). Vite proxies `/api` and `/courses-static` requests to the backend.

## 3. Directory Structure & Data Source

The project follows a strict directory structure to separate concerns between the frontend application, backend API, and course data.

```text
presentation-desk/
├── api/                   # Backend Application (Express)
│   ├── routes/            # API Route definitions
│   │   ├── auth.ts        # Authentication routes (Placeholder)
│   │   └── courses.ts     # Course file system operations
│   ├── app.ts             # Express application setup & middleware
│   ├── server.ts          # Local development server entry point
│   └── index.ts           # Serverless entry point (Vercel)
│
├── courses/               # Data Root (Content Storage)
│   └── [Course Name]/     # Level 1: Course Directory
│       └── [Unit Name]/   # Level 2: Unit/Topic Directory
│           ├── Readme.md  # Teaching content (Markdown)
│           ├── Update.md  # User notes (Markdown, Writable)
│           └── [Image]    # Presentation slide (*.png, *.jpg, *.svg)
│
├── src/                   # Frontend Application (React)
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page components (Routed)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── assets/            # Static assets imported in code
│   ├── types.ts           # Shared TypeScript interfaces
│   ├── App.tsx            # Main application component & Routing
│   └── main.tsx           # Application entry point
│
├── docs/                  # Project Documentation
│   └── prd.md             # Product Requirements Document
│
├── public/                # Public static assets (Favicon, etc.)
└── [Config Files]         # Root configuration (vite.config.ts, tailwind.config.js, etc.)
```

### Key Data Rules
*   **Data Root**: The application reads data strictly from the `./courses` directory in the project root.
*   **Course Structure**:
    *   **Level 1**: Course Name (Folder)
    *   **Level 2**: Unit/Topic Name (Folder)
        *   `Readme.md`: Teaching content (Read-only in UI)
        *   `Update.md`: User notes (Read/Write in UI)
        *   `*.png/jpg/svg`: Presentation image (First found image is displayed)

## 4. Key Conventions
*   **Static Files**: The `courses` directory is served statically at `/courses-static`.
    *   *Implementation*: `app.use('/courses-static', express.static(path.join(__dirname, '../courses')))` in `api/app.ts`.
*   **Path Encoding**: All file paths in URLs must be properly encoded (`encodeURIComponent`) to handle spaces and special characters.
*   **Exports**: Prefer **Named Exports** (e.g., `export function Component`) over Default Exports for consistent refactoring and import usage.
*   **Linting**: 
    *   Allow unused variables if prefixed with `_` (e.g., `_req`, `_next`).
    *   Use `eslint.config.js` for flat config.

## 5. Deployment/Running
*   **Local Run**: `npm run dev` starts both client and server.
*   **Access**: Open `http://localhost:5173`. Do not access port 3001 directly for the UI.

# DanfengTodo

A personal full-stack todo application with weekly planning, category management, drag-and-drop reordering, and productivity analytics.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS + Radix UI
- **Data Fetching**: SWR
- **Drag & Drop**: dnd-kit
- **Charts**: Recharts

---

## How Next.js Is Used

### App Router

This app uses the Next.js **App Router** exclusively. All routes live under the `/app` directory.

```
app/
├── layout.tsx        # Root layout — metadata, viewport, HTML shell
├── page.tsx          # Home page (main dashboard)
└── api/              # Route Handlers (server-side API)
```

There is no Pages Router. Navigation is handled via URL query parameters (`?category=X&year=Y&week=Z`) rather than separate page routes, since the app is a single-panel dashboard.

---

### Root Layout (`app/layout.tsx`)

The root layout defines app-wide metadata and wraps the full component tree:

```tsx
export const metadata: Metadata = {
  title: "DanfengTodo",
  description: "...",
};

export const viewport: Viewport = { ... };
```

It sets the favicon, mobile viewport, and provides the HTML shell. No nested layouts are used — all panels render within the single root layout.

---

### Server vs Client Components

- **`app/page.tsx`** — marked `'use client'` since it uses hooks (`useSearchParams`, `useState`) and wraps the app in `TodoProvider`
- **API Route Handlers** — implicitly server-side; they access the database directly via Prisma
- **UI components** — all marked `'use client'` for interactivity (drag-and-drop, state, events)
- **`Suspense`** — used in the root page to handle async loading states

The app is mostly client-rendered with a thin server layer via API routes.

---

### API Route Handlers

All backend logic is implemented as Next.js **Route Handlers** under `app/api/`. They follow RESTful conventions with dynamic route segments.

```
app/api/
├── categories/
│   ├── route.ts                      # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts                  # PATCH (update)
│       ├── weeks/route.ts            # GET weeks (paginated)
│       ├── day-tags/route.ts         # GET day tags for date range
│       └── day-notes/route.ts        # GET, POST day notes
├── todos/
│   ├── route.ts                      # POST (create)
│   ├── [id]/route.ts                 # PATCH (update), DELETE
│   └── reorder/route.ts              # POST (bulk reorder)
├── weeks/
│   ├── generate/route.ts             # POST (auto-generate weeks)
│   └── [id]/
│       ├── todos/route.ts            # GET todos grouped by date
│       └── reflection/route.ts       # PATCH (save reflection)
└── day-tags/
    ├── route.ts                      # POST (create)
    └── [id]/route.ts                 # DELETE
```

Each handler uses `NextRequest`/`NextResponse`, parses `params` as a Promise (Next.js 15+ pattern), and delegates to Prisma for database operations.

Example pattern:
```ts
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const result = await prisma.todo.update({ where: { id }, data: body });
  return NextResponse.json(result);
}
```

---

### Data Fetching (SWR + API Routes)

The app does **not** use `getServerSideProps`, `getStaticProps`, or server component `fetch`. All data fetching is client-side via **SWR** calling the API routes above.

`TodoProvider` (a client component) orchestrates all SWR hooks:

```ts
const { data: categories } = useSWR('/api/categories', fetcher);
const { data: weekTodos } = useSWR(`/api/weeks/${weekId}/todos`, fetcher);
```

Mutations use `mutate()` with **optimistic updates** — the UI updates immediately before the server confirms, then revalidates:

```ts
// Optimistic update example
mutate('/api/categories', updatedData, false);
await fetch('/api/categories', { method: 'POST', body: ... });
mutate('/api/categories');
```

This keeps the UI snappy without server components or server actions.

---

### Dynamic Route Segments

Resource IDs use the `[id]` dynamic segment pattern:

- `/api/categories/[id]` — category by ID
- `/api/todos/[id]` — todo by ID
- `/api/weeks/[id]/todos` — todos for a specific week

All dynamic params are typed and awaited as `Promise<{ id: string }>` per Next.js 15+ requirements.

---

### URL-Based State

Client-side navigation uses `useSearchParams()` and `useRouter()` from `next/navigation` to read and update query parameters without full page reloads:

```ts
const searchParams = useSearchParams();
const categoryId = searchParams.get('category');
const weekId = searchParams.get('week');
```

This makes views bookmarkable and shareable while keeping the app as a single route.

---

### Metadata & Viewport

Static metadata is defined once in `app/layout.tsx` using Next.js's typed `Metadata` and `Viewport` exports:

```ts
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = { title: "DanfengTodo", ... };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL

### Setup

```bash
# Install dependencies
npm install

# Configure database
cp .env.example .env
# Edit DATABASE_URL in .env

# Run migrations
npx prisma migrate dev

# Seed initial data (optional)
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database Schema

Managed with Prisma. Key models:

| Model | Description |
|-------|-------------|
| `Category` | Todo categories with color coding |
| `Week` | Weekly periods (year + week number) per category |
| `Todo` | Individual items; supports subtasks via self-relation |
| `DayTag` | Per-day tags (Weekend, Vacation, Sick) |
| `WeekReflection` | Weekly summary notes |
| `DayNote` | Per-day notes |

```bash
# View/edit data in browser
npx prisma studio
```

---

## Project Structure

```
├── app/
│   ├── api/            # Next.js Route Handlers
│   ├── globals.css     # Tailwind base styles + CSS variables
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Dashboard (single page)
├── components/
│   ├── panels/         # CategoryPanel, WeekPanel, TodoPanel
│   ├── providers/      # TodoProvider (Context + SWR)
│   ├── ui/             # Button, Card, Modal, Checkbox, etc.
│   └── modals/         # EditCategoryModal
├── lib/
│   ├── prisma.ts       # Prisma client singleton
│   ├── dateUtils.ts
│   └── weekGenerator.ts
├── prisma/
│   └── schema.prisma
└── types/
    └── index.ts
```

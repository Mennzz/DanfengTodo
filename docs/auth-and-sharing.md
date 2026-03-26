# Auth & Multi-User Sharing

## Overview

DanfengTodo supports multiple users. Each user owns their own categories and can share them with others. An admin role can see and manage everything.

---

## User Roles

| Role    | Can see                          | Can delete category |
|---------|----------------------------------|---------------------|
| `ADMIN` | All categories from all users    | Yes                 |
| `USER`  | Own categories + shared with them | Only own categories |

---

## How Category Access Works

A user can access a category if **any** of these is true:
1. They are the **owner** (`Category.ownerId === user.id`)
2. The category has been **shared** with them (a `CategoryShare` row exists)
3. They are an **ADMIN**

This logic lives in `lib/auth.ts → getCategoryFilter()` and is applied to all category API queries.

---

## Authentication

### Overview

NextAuth.js is an auth library built for Next.js. It handles the login flow, session management, and exposes helpers to read the current user in both server and client code. We use it with:
- **CredentialsProvider** — email + password verified against the DB
- **JWT sessions** — the session is stored in a signed cookie, not in the database

### Login Flow (step by step)

```
User submits /login form
  │
  ▼
signIn("credentials", { email, password })   ← next-auth/react (client)
  │
  ▼
POST /api/auth/callback/credentials          ← NextAuth handles this internally
  │
  ▼
authorize() in lib/auth.ts
  ├── prisma.user.findUnique({ where: { email } })
  ├── bcrypt.compare(password, user.passwordHash)
  └── returns { id, email, name, role }  ← becomes the "user" object
  │
  ▼
jwt() callback in lib/auth.ts
  └── copies id + role from user → into the JWT token
  │
  ▼
JWT is signed with NEXTAUTH_SECRET and stored in a cookie
  │
  ▼
session() callback in lib/auth.ts
  └── copies id + role from token → into session.user
  │
  ▼
Client redirected to /  ← login complete
```

If `authorize()` returns `null` (wrong password or user not found), NextAuth rejects the login and `signIn()` resolves with `{ error: "CredentialsSignin" }`.

### JWT vs Database Sessions

We use **JWT sessions** (`strategy: "jwt"` in `lib/auth.ts`). This means:
- The session is encoded into a signed cookie (`next-auth.session-token`)
- No session table is needed in the database
- The cookie is verified using `NEXTAUTH_SECRET` on every request
- The tradeoff: you cannot instantly invalidate a session server-side (the token lives until it expires)

The alternative (database sessions) stores a session row in the DB and is needed if you want forced logout / session revocation.

### JWT & Session Callbacks

These two callbacks in `lib/auth.ts` are how `id` and `role` flow from the DB into the session:

```
authorize() returns { id, email, name, role }
         │
         ▼
jwt() callback  ─── fires on login and every request
  token.id   = user.id
  token.role = user.role
         │
         ▼
session() callback  ─── fires when session is read
  session.user.id   = token.id
  session.user.role = token.role
         │
         ▼
session.user is now available in API routes and components
```

Without these callbacks, `session.user` would only contain `name`, `email`, and `image` (NextAuth defaults). Adding `id` and `role` requires the declaration in `types/next-auth.d.ts` as well, otherwise TypeScript won't know those fields exist.

### Reading the Session

**In API routes (server-side):**
```ts
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
if (!session) return 401

session.user.id    // the user's DB id
session.user.role  // "ADMIN" or "USER"
```

**In client components:**
```ts
import { useSession } from 'next-auth/react'

const { data: session } = useSession()
session?.user.id
session?.user.role
```

`useSession()` works because `app/layout.tsx` wraps the whole app in `<SessionProvider>`, which provides the session via React context.

### Route Protection (`proxy.ts`)

`proxy.ts` runs on **every request** before it hits any page or API route. It uses `getToken()` to read and verify the JWT cookie directly — this is faster than `getServerSession()` because it doesn't need to call any callbacks.

```
Incoming request
  │
  ▼
proxy.ts: getToken({ req, secret: NEXTAUTH_SECRET })
  ├── token found → NextResponse.next()  (let the request through)
  └── no token
        ├── /api/* request  → 401 JSON
        └── page request    → redirect to /login
```

Routes excluded from protection (via the `matcher` config in `proxy.ts`):
- `/api/auth/*` — NextAuth's own endpoints (login, signout, session)
- `/login` — the login page itself
- `/_next/*` and `/favicon.ico` — static assets

### How `NEXTAUTH_SECRET` Is Used

- Signs and verifies the JWT cookie — anyone with the secret can forge a session token
- Must be kept private and never committed to source control
- Should be rotated if compromised (all existing sessions will be invalidated)
- Generate a new one with: `openssl rand -base64 32`

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | NextAuth config, `getCategoryFilter()` helper |
| `proxy.ts` | Route protection (Next.js 16 proxy convention) |
| `app/login/page.tsx` | Login form UI |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth handler |
| `types/next-auth.d.ts` | Extends session types with `id` and `role` |
| `app/api/categories/route.ts` | GET/POST scoped to session user |
| `app/api/categories/[id]/route.ts` | GET/PATCH/DELETE with access checks |
| `app/api/categories/[id]/shares/route.ts` | Share management API |
| `components/providers/SessionProvider.tsx` | Wraps app with NextAuth session |

---

## Sharing API

Base path: `/api/categories/:id/shares`

Only the category **owner** or an **admin** can manage shares.

### `GET /api/categories/:id/shares`
Returns the list of users the category is shared with.

```json
{
  "shares": [
    { "id": "...", "createdAt": "...", "user": { "id": "...", "email": "dan@example.com", "name": "Dan" } }
  ]
}
```

### `POST /api/categories/:id/shares`
Share the category with a user by email.

```json
// Request
{ "email": "friend@example.com" }

// Response 201
{ "share": { "id": "...", "user": { "id": "...", "email": "...", "name": "..." } } }
```

Errors:
- `404` — user with that email not found
- `400` — trying to share with the owner
- `409` — already shared with this user

### `DELETE /api/categories/:id/shares`
Remove a share by userId.

```json
// Request
{ "userId": "..." }

// Response
{ "success": true }
```

---

## Database Models

See `docs/db-design.md` for full schema details. The relevant models:

- **`User`** — `id`, `email`, `name`, `passwordHash`, `role`
- **`Category`** — added `ownerId` (FK → User)
- **`CategoryShare`** — bridge table, unique on `(categoryId, userId)`

---

## Seed / Default Admin

The migration (`20260319154737_add_users_and_sharing`) seeds one admin user:

| Field    | Value                      |
|----------|----------------------------|
| Email    | `admin@danfengtodo.com`    |
| Password | `password` (change before deploying) |
| Role     | `ADMIN`                    |

To update the password, run `npx prisma db seed` after deleting the existing admin row, or update it directly via Prisma Studio (`npx prisma studio`).

---

## Environment Variables

| Variable         | Description                                 |
|------------------|---------------------------------------------|
| `NEXTAUTH_SECRET` | Random secret for JWT signing — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL`   | App base URL (`http://localhost:3000` locally, deployed domain in production) |

Both must be set in Vercel dashboard for production.

---

## What's Not Yet Done (Future Work)

- **Share management UI** — no frontend to add/remove shares yet; API is ready
- **User registration UI** — new users must be created directly in the DB or via seed
- **Password reset** — no forgot-password flow
- **OAuth providers** — NextAuth is configured for credentials only; adding Google/GitHub requires adding a provider in `lib/auth.ts`

# Calendly Clone

A full-stack scheduling and booking web application — a production-quality Calendly clone built with React, Node.js, Express, Sequelize ORM, and MySQL.

---

## Features

- **Admin Dashboard** — manage event types, availability, and all bookings
- **Public Booking Page** — invitees pick a date, time slot, and fill in their details
- **Email Notifications** — HTML emails on booking confirmation, cancellation, and reschedule
- **Rescheduling** — invitees can pick a new time; old booking marked as rescheduled
- **Cancellation** — both admin and invitee can cancel bookings with optional reason
- **Buffer Time** — configurable buffer before/after each event type slot
- **Custom Questions** — admin can add per-event-type questions; answers saved with booking
- **Date Overrides** — mark specific dates as unavailable or set custom hours
- **Timezone Support** — all times stored in UTC, displayed in the invitee's local timezone
- **Double-booking Prevention** — conflict check at the controller level before any insert
- **Responsive Design** — mobile-first with Tailwind CSS; sidebar collapses to bottom nav on mobile

---

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18 + Vite + React Router v6 + Tailwind CSS |
| API Client | Axios + date-fns + date-fns-tz                |
| Backend    | Node.js + Express.js                          |
| ORM        | Sequelize v6                                  |
| Database   | MySQL 8+                                      |
| Email      | Nodemailer (Mailtrap for dev, Gmail for prod) |
| Env        | dotenv                                        |

---

## Prerequisites

- Node.js 18+
- MySQL 8+
- npm 9+ or yarn
- (Optional) Mailtrap account for email testing

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/calendly-clone.git
cd calendly-clone
```

### 2. Create the MySQL Database

```sql
CREATE DATABASE calendly_clone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=calendly_clone
DB_USER=root
DB_PASSWORD=your_password

# Email (Mailtrap)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_pass
EMAIL_FROM=noreply@calendlyclone.com

# App
APP_URL=http://localhost:5173
ADMIN_NAME=Alex Johnson
ADMIN_EMAIL=alex@example.com
```

Install dependencies and seed the database:

```bash
npm install
npm run seed        # Creates tables, inserts sample data
npm run dev         # Starts server on http://localhost:5000
```

### 4. Frontend Setup

```bash
cd ../frontend
cp .env.example .env
```

`.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

```bash
npm install
npm run dev         # Starts on http://localhost:5173
```

---

## Usage

| URL | Description |
|-----|-------------|
| `http://localhost:5173/admin/event-types` | Admin: manage event types |
| `http://localhost:5173/admin/availability` | Admin: set weekly hours & overrides |
| `http://localhost:5173/admin/meetings` | Admin: view/cancel all bookings |
| `http://localhost:5173/book/:slug` | Public: booking page |
| `http://localhost:5173/confirmation/:id` | Public: booking confirmed |
| `http://localhost:5173/cancel/:id` | Public: cancel booking |
| `http://localhost:5173/reschedule/:id` | Public: reschedule booking |

**Seeded slugs:**
- `/book/15-min-chat`
- `/book/30-min-meeting`
- `/book/1-hour-deep-dive`

---

## Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── config/           db.js, email.js
│   │   ├── models/           User, EventType, Availability, DateOverride, Booking, extras (BookingAnswer, EventTypeQuestion), index.js
│   │   ├── routes/           eventTypes.js, availability.js, meetings.js, bookings.js
│   │   ├── controllers/      eventTypesController, availabilityController, meetingsController, bookingsController
│   │   ├── middleware/        errorHandler.js, validate.js
│   │   ├── utils/             slots.js, emailTemplates.js
│   │   ├── seeders/           seed.js
│   │   └── app.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/              adminApi.js, publicApi.js
    │   ├── components/       Navbar, CalendarPicker, TimeSlotGrid, Modal, Spinner, Badge
    │   ├── pages/
    │   │   ├── admin/        AdminLayout, EventTypes, Availability, Meetings
    │   │   └── public/       BookingPage, ConfirmationPage, CancelPage, ReschedulePage
    │   ├── hooks/            index.js (useEventTypes, useAvailability, useBookings, usePublicSlots)
    │   ├── utils/            dateUtils.js
    │   └── App.jsx
    ├── tailwind.config.js
    └── package.json
```

---

## API Reference

### Admin Routes (`/api/admin`)

#### Event Types
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/event-types` | List all event types |
| POST | `/event-types` | Create event type |
| PUT | `/event-types/:id` | Update event type |
| DELETE | `/event-types/:id` | Delete event type |
| POST | `/event-types/:id/questions` | Add custom question |
| DELETE | `/event-types/:id/questions/:qid` | Remove question |

#### Availability
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/availability` | Get weekly availability |
| PUT | `/availability` | Update weekly availability (array) |
| GET | `/availability/date-overrides` | List date overrides |
| POST | `/availability/date-overrides` | Create date override |
| DELETE | `/availability/date-overrides/:id` | Delete date override |

#### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meetings?status=upcoming\|past` | List meetings |
| PUT | `/meetings/:id/cancel` | Cancel a meeting |
| PUT | `/meetings/:id/reschedule` | Reschedule a meeting |

### Public Routes (`/api/public`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:slug` | Get event type info |
| GET | `/:slug/slots?date=YYYY-MM-DD&timezone=...` | Available time slots |
| POST | `/:slug/book` | Create booking |
| GET | `/booking/:id` | Get booking details |
| PUT | `/booking/:id/cancel` | Cancel booking |
| PUT | `/booking/:id/reschedule` | Reschedule booking |

---

## Slot Generation Logic

`utils/slots.js` generates available time slots for a given date:

1. Look up admin's weekly availability for the day-of-week
2. Check `date_overrides` — if `is_unavailable=true`, return `[]`; if custom hours set, use those
3. Convert host local time window → UTC
4. Generate candidate slots every `duration_minutes` within the window
5. Apply `buffer_before` and `buffer_after` padding to each slot
6. Filter out slots whose padded windows overlap any existing confirmed booking
7. Filter out past slots (slot start < now)
8. Return slot start times as ISO UTC strings

---

## Assumptions

- Only one admin user (id=1) exists; no multi-tenancy or authentication implemented
- Availability is stored in the admin's local timezone (America/New_York per seed data); slots are calculated in UTC and displayed in the invitee's timezone
- Email failures are non-fatal — logged to console but do not interrupt the booking flow
- The database `sync({ alter: false })` is used in development; use proper migrations for production
- `buffer_before` / `buffer_after` prevents back-to-back bookings and adds padding around each session

---

## Deployment

### Backend — Railway

1. Push to GitHub
2. Create a new Railway project → "Deploy from GitHub"
3. Add a MySQL plugin; Railway auto-injects `DATABASE_URL` — update `db.js` to parse it if needed, or map individual vars
4. Set environment variables matching `.env.example`
5. Set start command: `node src/app.js`
6. Run `npm run seed` via Railway Shell once deployed

### Frontend — Vercel

1. Push `frontend/` folder (or monorepo root) to GitHub
2. Import project in Vercel
3. Set `VITE_API_BASE_URL` = your Railway backend URL (e.g. `https://calendly-clone-backend.up.railway.app`)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy!

---

## Development Tips

- Use [Mailtrap](https://mailtrap.io) to capture dev emails without sending real mail
- Use [TablePlus](https://tableplus.com) or MySQL Workbench to inspect the database
- The Vite dev server proxies `/api` → `localhost:5000` so no CORS issues locally
- Re-seed anytime with `npm run seed` (uses `force: true` — wipes and recreates tables)

---

## Implementation Notes

This project keeps features simple but production-minded, with explicit tradeoffs that are easy to explain:

- Single-admin assumption: all admin workflows are scoped to a default user (`id=1`) to avoid adding auth complexity in the assignment timeline.
- Thin routes, controller-first logic: validation stays in route/middleware, while scheduling/business decisions live in controllers and utilities.
- Centralized slot generation: all booking/rescheduling availability checks flow through the same slot + conflict rules to keep behavior predictable.
- UTC-first persistence: DB stores datetimes in UTC; rendering converts to user-selected timezone at the edges (API/UI).
- Non-blocking email delivery: booking state changes are committed first; email failures are logged without breaking core scheduling flows.
- Stable API clients on frontend: one shared Axios factory reduces duplication and keeps error handling consistent.

### Optimization Choices That Preserve Behavior

- Reduced repeated DB calls by loading booking availability context in parallel where appropriate.
- Simplified transaction flow to avoid rollback-after-commit edge cases.
- Removed dead code and unused imports/variables to make components/controllers easier to reason about.
- Fixed noisy DB timezone configuration warning while preserving UTC behavior.

These choices were intentionally scoped to maintain the same feature set while improving readability, maintainability, and runtime stability.

---

## License

MIT

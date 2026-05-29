# Nova Pulse

**Operational Lead Accountability & Visibility Platform**

Track every lead that enters your business from first contact to final outcome. Stop losing revenue to missed calls, slow responses, and dead follow-ups.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| State | Zustand |
| Charts | Recharts |
| Phone/SMS | Twilio |
| Hosting | Vercel |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
# Fill in your Supabase and Twilio credentials
```

### 3. Set up the database
1. Open your Supabase project → SQL Editor
2. Run `supabase/migrations/001_initial_schema.sql`

### 4. Configure Twilio webhooks
- Voice: `https://your-domain.com/api/webhooks/twilio/voice`
- SMS: `https://your-domain.com/api/webhooks/twilio/sms`

### 5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/                      # Auth pages
│   ├── signup/
│   ├── forgot-password/
│   ├── onboarding/                 # Business onboarding wizard
│   ├── (app)/                      # Protected routes
│   │   ├── dashboard/              # Main dashboard
│   │   ├── leads/                  # Lead list + detail view
│   │   ├── alerts/                 # Alert center
│   │   ├── reports/                # Operational reports
│   │   └── settings/              # Business settings
│   └── api/
│       ├── leads/                  # Lead CRUD API
│       ├── alerts/                 # Alert management API
│       ├── reports/                # Report generation API
│       └── webhooks/twilio/        # Twilio inbound handlers
├── components/
│   ├── ui/                         # Base UI components
│   ├── layout/                     # Logo, Sidebar, TopBar
│   ├── dashboard/                  # Dashboard widgets
│   └── leads/                      # Lead components + timeline
├── hooks/                          # Data fetching hooks
├── lib/                            # Supabase, Twilio, utilities
├── store/                          # Zustand global state
└── types/                          # TypeScript definitions
```

---

## Database Tables

| Table | Purpose |
|---|---|
| `businesses` | Business profile + hours + integrations |
| `leads` | Core leads with status, timing, source |
| `lead_events` | Immutable event log per lead |
| `communications` | All calls, SMS, emails |
| `alerts` | Operational issue alerts |
| `reports` | Generated weekly/monthly reports |
| `integrations` | Third-party integration config |

---

## Alert Engine

| Alert | Trigger |
|---|---|
| Missed Call | Immediately on missed call |
| No Response | 30 min with no contact |
| Stalled Lead | 24 hours inactive |
| Dead Lead | 72 hours, auto-marks ignored |

---

## Operational Health Score (0–100)

Calculated from:
- Missed call rate (−30 max)
- Average response time penalty
- Stalled lead rate (−20 max)

---

## Design Tokens

| Token | Value |
|---|---|
| Background | `#080A0F` |
| Surface | `#0D1017` |
| Card | `#111520` |
| Border | `#1C2235` |
| Gold | `#C9A84C` |
| Text | `#E8EAF0` |
| Muted | `#5A6480` |
| Font | Sora + DM Mono |

---

## Deploy on Vercel

1. Push to GitHub
2. Import in Vercel
3. Add all `.env.local` variables
4. Deploy

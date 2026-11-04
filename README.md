# Libon–Polangui Tricycle Tracking and Commuter Information System

A mobile-responsive web application that modernizes tricycle commuting along the **Libon–Polangui** route. It focuses on real-time visibility, route monitoring, and everyday convenience rather than on-demand ride-hailing.

> **Status:** Phase 1 Academic Prototype (in development)

---

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Coverage Area](#coverage-area)
4. [Stakeholders](#stakeholders)
5. [Scope](#scope)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [Getting Started](#getting-started)
9. [Environment Variables](#environment-variables)
10. [User Roles](#user-roles)
11. [Non-Functional Requirements](#non-functional-requirements)
12. [Roadmap](#roadmap)
13. [Contributing](#contributing)
14. [License](#license)

---

## Overview

Commuters can view active tricycles on a map, check whether an approaching unit still has seats, signal their presence at a designated waiting shed, and choose between **Cash** or **E-Wallet (QR code)** payment. Drivers keep full privacy control by switching their visibility off when on break or off duty.

### Project Objectives
- **Real-time map and route visibility** for Centrong Libon, Lakeside, Palayan League, and Polangui.
- **Seat capacity indicator** – drivers toggle between *Available* and *Full*.
- **Waiting shed signaling** – commuters flag a municipal waiting shed to show someone is waiting.
- **Dual payment options** – Cash, or view the driver's GCash/e-wallet QR code.
- **Driver privacy control** – go *Offline* to disappear from the public map instantly.
- **Demonstrable prototype** – simulated fleet movement plus real authentication for live demos.

## Features

| Feature | Commuter | Driver | Admin |
|---|:--:|:--:|:--:|
| Register / Login | ✅ | ✅ | ✅ |
| View live map and active tricycles | ✅ | ✅ | ✅ |
| Available / Full toggle | | ✅ | |
| Online / Offline (shift visibility) toggle | | ✅ | |
| Upload e-wallet QR code | | ✅ | |
| Signal at waiting shed | ✅ | | |
| Choose payment mode / view QR | ✅ | | |
| Manage users, routes, and sheds | | | ✅ |

## Coverage Area

**Included tricycle zones:** Centrong Libon, Lakeside, Palayan League, and Polangui town center.

**Excluded:** High-elevation and steep zones such as **Pantao**, which are served mainly by jeepneys.

## Stakeholders
- **Commuters / Passengers** – track tricycles, check seats, signal at sheds, choose payment mode.
- **Tricycle Drivers** – broadcast status, toggle capacity, show payment QR, manage shift visibility.
- **System Administrator** – manages accounts, route and waiting shed data, and system health.

## Scope

### In scope (Phase 1)
- Mobile-responsive web app (Chrome, Safari, Edge, Firefox) with no app-store install
- Interactive map with simulated tricycle movement along defined routes
- Driver capacity and shift toggles
- Waiting shed signaling
- Cash / QR payment display
- Authentication with Commuter, Driver, and Admin roles backed by a database

### Out of scope (future work)
- Native mobile apps (.apk / iOS)
- Automated e-wallet API payment processing (payments are offline: cash or QR display)
- Jeepney and non-tricycle zones (e.g., Pantao)

## Tech Stack

> Open-source and free-tier only, per project constraints.

| Layer | Choice |
|---|---|
| Frontend | React + Vite (responsive, mobile-first) |
| Map | Leaflet.js + OpenStreetMap tiles |
| Backend / Database | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Auth | Supabase Auth (passwords hashed with bcrypt) |
| Hosting | Vercel or Netlify (frontend), Supabase free tier (backend) |
| Version control | Git + GitHub |

## Project Structure
```
libon-polangui-tricycle-system/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── package.json
├── vite.config.js
├── index.html
├── docs/
│   ├── requirements.md
│   ├── database-schema.md
│   ├── api-and-realtime.md
│   ├── user-flows.md
│   └── images/
├── public/
│   └── icons/
├── database/
│   ├── schema.sql
│   ├── policies.sql          # Row Level Security rules
│   └── seed.sql              # sample routes, sheds, demo users
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── assets/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapView.jsx
│   │   │   ├── TricycleMarker.jsx
│   │   │   ├── ShedMarker.jsx
│   │   │   └── RouteLayer.jsx
│   │   ├── Driver/
│   │   │   ├── StatusToggle.jsx
│   │   │   ├── ShiftSwitch.jsx
│   │   │   └── QrUpload.jsx
│   │   ├── Commuter/
│   │   │   ├── ShedSignalButton.jsx
│   │   │   └── PaymentSelector.jsx
│   │   ├── Admin/
│   │   │   ├── UserTable.jsx
│   │   │   ├── RouteManager.jsx
│   │   │   └── ShedManager.jsx
│   │   └── common/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── CommuterHome.jsx
│   │   ├── DriverDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── services/
│   │   ├── supabaseClient.js
│   │   ├── authService.js
│   │   ├── tricycleService.js
│   │   └── shedService.js
│   ├── simulation/
│   │   ├── fleetSimulator.js  # animates demo tricycles along routes
│   │   └── routes.geojson     # route paths (Libon–Polangui)
│   ├── hooks/
│   ├── context/
│   └── utils/
└── tests/
```

## Getting Started

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project
- Git

### Installation
```bash
git clone https://github.com/<your-username>/libon-polangui-tricycle-system.git
cd libon-polangui-tricycle-system
npm install
cp .env.example .env     # then fill in your Supabase keys
```

### Database setup
1. Open the Supabase SQL editor.
2. Run `database/schema.sql`, then `database/policies.sql`, then `database/seed.sql`.

### Run locally
```bash
npm run dev
```
Open the printed local URL (usually `http://localhost:5173`) on a desktop or phone browser.

### Build for production
```bash
npm run build
```

## User Roles

- **Commuter** – sees only *Online* tricycles and their Available/Full status; can signal at sheds and choose payment mode.
- **Driver** – appears on the map and exposes a QR code only while logged in and set to *Online*.
- **Admin** – manages users, routes, and waiting sheds.

## Non-Functional Requirements

| Area | Requirement |

| Operational | Works on mobile and desktop browsers (Chrome, Safari, Firefox) with no install |
| Performance | Marker movement and status changes reflect on the UI within 2–3 seconds under stable network |
| Security | Passwords hashed; driver location and QR code only exposed when driver is logged in and *Online* |
| Cultural | Uses recognized local waiting sheds; supports both cash and QR e-wallet payments common in Bicol |
| Constraints | Depends on mobile data; built with open-source and free-tier tools only |

## Roadmap

- [ ] Project setup and repository structure
- [ ] Database schema and role-based authentication
- [ ] Map with routes and waiting sheds
- [ ] Fleet movement simulation
- [ ] Driver dashboard (Available/Full, Online/Offline, QR upload)
- [ ] Commuter features (shed signaling, payment selector)
- [ ] Admin dashboard
- [ ] Realtime updates and performance tuning
- [ ] Testing, deployment, and demo preparation
- [ ] Documentation and final report

**Future improvements:** real GPS tracking from driver devices, automated e-wallet payments, native mobile apps, push notifications, and fare estimation.

## Contributing

1. Create a branch: `git checkout -b feature/short-description`
2. Commit with clear messages: `feat: add driver status toggle`
3. Push and open a Pull Request into `main`.

## License

Released under the MIT License. See `LICENSE` for details.

Authors
Cedrick R. Odoño – Front End Developer
Jacinth D. Caigas – Backend Developer
Janin A. Sanin - Project Manager
Pee Jay M. Laxamana - Github Manager
Harvae Alecks Roperez - Database Manager
Xavier Allen S. Peliño - Tester
Janeica A. Ubiña - Project Manager


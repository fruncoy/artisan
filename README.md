# AMP - Artisan Marketplace Platform

Startup-ready full-stack artisan commerce platform with premium minimal UI.

## Stack

- Frontend: React + Vite + Tailwind CSS + Zustand + React Router
- Backend: Node.js + Express
- Firebase: Auth, Firestore, Storage, Security Rules

## Architecture

### Frontend (`client/src`)

- `components/` reusable UI and auth guards
- `pages/` public pages + role dashboards
- `layouts/` dashboard shells
- `hooks/` bootstrap hooks
- `services/` Firebase auth service layer
- `store/` Zustand auth state
- `context/` app-level context
- `utils/` constants
- `router/` route map + role-based route protection

### Backend (`server/src`)

- `routes/` modular API routes
- `controllers/` request handlers
- `middleware/` auth + RBAC
- `services/` platform services
- `models/` Firestore collection map
- `firebase/` Firebase Admin bootstrap
- `utils/` helper utilities

## Required Firestore Collections

- `users`
- `artisanApplications`
- `stores`
- `products`
- `orders`
- `reviews`
- `notifications`
- `chats`

## Setup

1. Configure `client/.env` from `client/.env.example`
2. Configure `server/.env` from `server/.env.example`
3. Install dependencies:
   - `cd client && npm install`
   - `cd server && npm install`
4. Run:
   - `cd server && npm run dev`
   - `cd client && npm run dev`

## API Surface (initial)

- `GET /health`
- `GET /api/marketplace/products`
- `POST /api/marketplace/products` (artisan)
- `POST /api/artisan/apply`
- `GET /api/artisan/applications` (admin)
- `PATCH /api/artisan/applications/:uid/review` (admin)
- `GET /api/admin/analytics` (admin)
- `PATCH /api/admin/users/:uid/suspend` (admin)

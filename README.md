# PawBack

PawBack is a pet recovery platform for posting lost/found pet listings, browsing nearby cases, chatting with other users, and tracking saved or helped listings.

## Stack

- Frontend: React, Vite, Tailwind-style utility classes
- Backend: Spring Boot, Spring Security, JPA, Flyway
- Data: PostgreSQL + PostGIS, Redis, MinIO
- Runtime: Docker Compose

## Run locally

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:5173
- Backend: http://localhost:8080

## Main features

- Responsive mobile-first UI
- JWT authentication
- Listings feed, detail page, and creation flow
- Search, filters, map view, and saved items
- Chat between users
- File uploads for listing images

## Useful commands

```bash
npm -C frontend run build
cd backend && ./gradlew build
```

## Project layout

- `frontend/` - client app
- `backend/` - server app
- `docker-compose.yml` - full local stack

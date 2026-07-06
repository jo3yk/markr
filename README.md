# Markr

Endorsed by the Taylor Swift Fan Club*

* The value of this endorsement is highly questionable given it slows procurement to half speed.

## Summary

This project delivers a small end-to-end Markr MVP with:

- a backend service that accepts XML exam-result imports and persists them durably
- REST endpoints for test listings, aggregate statistics, and histograms
- a React frontend for uploading results and browsing test dashboards
- a root container setup intended for local development and demo use via Docker Compose

## Key assumptions

- The XML payloads are in the Markr-specific format described in the task brief.
- The backend should trust the provided summary-marks values for scoring and availability.
- If the same student/test is imported more than once, the system keeps the best score for that student and the highest available marks seen for that test.
- A document is accepted only if every record inside it is valid; invalid input causes the whole import to fail and return a 400 response.
- The frontend should be accessible, with clear status/error announcements and a live-updating detail view.
- There is no requirement for authentication.
- XML file size limit of 1mb

## Approach

The solution is split into two parts:

1. Backend
   - Built with TypeScript, Express, and Sequelize.
   - Accepts XML imports via POST /import.
   - Validates the document structure, rejects malformed input atomically, and stores normalized results.
   - Exposes /tests, /results/:test-id/aggregate, and /results/:test-id/histogram.
   - Database can be changed from lightweight SQLite to e.g. Postgres by changing the Sequelize configuration

2. Frontend
   - Built with React + Vite.
   - Provides an upload page, a tests listing page, and a test detail page with aggregate stats and a histogram.
   - Polls for updates so the detail view refreshes automatically when new results arrive.

## What to pay attention to

- Duplicate handling is implemented by keeping the highest obtained marks and the highest available marks for each student/test combination.
- The import endpoint rejects the entire document if any record is invalid, avoiding partial acceptance and confusing downstream data.
- The histogram is rendered as discrete DOM elements so assistive technologies can inspect the chart structure.
- The detail page separates the live-refresh indicator from change announcements to keep screen-reader output useful and non-repetitive.

## Build and run

### Prerequisites

- Node.js 22+ and npm
- Docker and Docker Compose (optional, for the containerized workflow)

### Backend

```bash
cd backend
npm install
npm run build
npm start
```

The backend listens on port 4000 by default.

### Frontend

```bash
cd frontend
npm install
npm run build
npm run dev
```

The frontend is served on port 5173 in development mode.

### Docker Compose

```bash
docker compose up --build
```

This brings up the backend and frontend together from the repository root. The frontend can be accessed at http://localhost:3000, with the backend on port 4567.

## Performance notes

The initial implementation is straightforward and should be sufficient for the MVP workload, but there are a few places to optimize if the volume grows:

- Aggregates and histograms are computed from stored results on demand; for larger data sets, precomputing per-test summary values and histogram buckets would reduce response time.
- A small in-memory or database-backed cache for frequently requested test summaries could help when dashboards are refreshed repeatedly.
- If import volume becomes high, batching writes and using a more scalable database backend would make the system more resilient.

## Testing

```bash
cd backend
npm test
```

```bash
cd frontend
npm test
```

## Additional comments from the author

While the instruction regarding Gen-Z slang in the comments was noted, the author is decidedly millenial and simply... cannot. 

(FWIW, the author is also not a Twilight fan).

## TODO

- verify all tests
- generate additional sample data

# Resellr OS — Product Requirements Document

## Overview
Resellr OS is a premium reseller operating system mobile app for fashion, accessories, vintage, and lifestyle resellers. It helps solo resellers buy better, track inventory, manage listing workflows, understand real profit, and take action on stale stock.

## Architecture
- **Frontend**: Expo React Native (SDK 54) with expo-router file-based navigation
- **Backend**: FastAPI (Python) with MongoDB
- **Design**: Warm-neutral premium theme (cream/stone base, espresso text, muted olive/bronze accents)
- **Auth**: No auth in V1 (architected for future addition)

## App Structure

### Bottom Tab Navigation (5 tabs)
1. **Home** — Command center with monthly net profit, sold count, active listings, capital locked, dead stock count, best platform/category, profit trend chart, quick actions, weekly action feed
2. **Inventory** — Filterable inventory list (All, Listed, Crosslisted, Sourced, Sold, Completed) with item cards showing photo, title, brand, health badges, platform chips, price, profit
3. **Source** — Sourcing Decision Engine (hero feature) with platform selection, cost inputs, and Buy/Risky/Skip verdict with ROI, net profit, break-even, max buy price
4. **Pipeline** — Workflow stages (Sourced→Intake→Photographed→Listed→Crosslisted→Sold→Shipped→Completed) with horizontal scrollable item cards
5. **Insights** — Business intelligence with avg ROI, avg days to sell, dead stock %, stale capital, monthly revenue/profit trends, platform revenue, category performance

### Secondary Screens
- **Item Detail** (`/item/[id]`) — Full item profile with photos, financials (cost basis, fees, net profit, ROI), lifecycle dates, platform chips, action buttons (Mark Listed, Crosslisted, Sold, Shipped, Complete, Archive)
- **Add Item** (`/add-item`) — 3-step intake flow (Info → Sourcing → Listing) with save draft
- **Dead Stock** (`/deadstock`) — Items flagged by age (30-45d, 45-60d, 60-90d, 90+d) with suggested actions
- **Settings** (`/settings`) — Platform fees, target ROI, min profit, default packaging/shipping costs

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/dashboard | Home screen aggregated data |
| GET | /api/items | List items with optional filters |
| GET | /api/items/:id | Item detail |
| POST | /api/items | Create item |
| PUT | /api/items/:id | Update item |
| DELETE | /api/items/:id | Delete item |
| GET | /api/pipeline | Items grouped by workflow stage |
| GET | /api/deadstock | Stale items bucketed by age |
| POST | /api/source/calculate | Source calculator with verdict |
| GET | /api/insights | Analytics data |
| GET | /api/settings | Get settings |
| PUT | /api/settings | Update settings |
| POST | /api/seed | Seed mock data |

## Design System
- **Background**: #F9F8F6 (warm cream)
- **Surface**: #FFFFFF
- **Text Primary**: #1C1C1E (deep charcoal)
- **Accent**: #8C7B70 (muted bronze)
- **Success**: #7A8C75 (sage)
- **Warning**: #BC7C68 (muted clay)
- **Typography**: PlayfairDisplay_700Bold (headings/metrics), Mulish (body), SpaceMono (data)
- **Border Radius**: 12px (cards), pill (buttons/chips)

## Mock Data
15 realistic fashion resale items seeded including Acne Studios, Jacquemus, Maison Margiela, Comme des Garçons, A.P.C., Sandro, Isabel Marant, The Row, Totême, Lemaire, Stüssy, Carhartt WIP, Our Legacy, Margaret Howell, Dries Van Noten.

## Test Results
- Backend: 25/25 tests passed (100%)
- Frontend: All critical flows verified (navigation, data loading, source calculator, CRUD, filters)

## Future Enhancements
- Authentication (JWT or Google OAuth)
- Photo capture/gallery with base64 storage
- Onboarding flow
- Push notifications for stale items
- Export/reporting
- Multi-currency support
- Subscription/premium tier for advanced analytics

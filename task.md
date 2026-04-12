# Project Tasks

- [x] Implement `handleConfirm` in `app/select-vehicle/page.tsx`
    - [x] Save selection to `localStorage`
    - [x] Add "Confirmed" success message
- [x] Update `app/route-planner/page.tsx` to read vehicle data
    - [x] Load confirmed vehicle from local storage
    - [x] Calculate `CONSUMPTION_WH_PER_KM` dynamically
    - [x] Update energy model calculations with real battery capacity
- [x] Update `app/co2-savings/page.tsx` to reflect selected vehicle
    - [x] Load confirmed vehicle from local storage
    - [x] Sync initial state with vehicle category
- [x] Implement Robust Amenities Fix
    - [x] Create `lib/amenities-cache.ts` for SQLite persistence
    - [x] Update `app/api/amenities-bulk/route.ts` with cache and retries
    - [x] Update `app/route-planner/page.tsx` with staggered fetching
- [x] Verify total system stability

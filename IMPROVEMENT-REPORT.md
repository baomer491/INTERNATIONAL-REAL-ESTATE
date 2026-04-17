# INTERNATIONAL REAL ESTATE - Comprehensive Improvement Report
## نظام التثمين العقاري (Real Estate Valuation System)

**Analyzed:** Full codebase (~19,500 lines, 60+ TypeScript/TSX files)  
**Stack:** Next.js 16.2.1, React 19.2.4, Supabase, Docker/Coolify  
**Date:** April 2026

---

## EXECUTIVE SUMMARY

This is an ambitious real estate valuation application for the Omani market with OCR/AI integration, report wizard, approval workflows, and market comparison features. The core functionality works but the project has significant security vulnerabilities, architectural debt, and production-readiness gaps that must be addressed before any deployment handling real financial data.

**Overall Assessment: FUNCTIONAL PROTOTYPE - NOT PRODUCTION READY**

---

## 1. SECURITY VULNERABILITIES

### 1.1 CRITICAL: Plaintext Admin Credentials in Login Page
- **File:** `src/app/login/LoginPage.tsx:182`
- **Issue:** Login page displays `admin / admin123` in the UI for all visitors
- **Impact:** Anyone accessing the app can immediately gain admin access
- **Priority:** CRITICAL | **Effort:** Easy

### 1.2 CRITICAL: Plaintext Default Password in Database Seed
- **File:** `src/lib/store.ts:478`
- **Issue:** `password_hash: 'admin123'` stored as plaintext, not hashed
- **Impact:** Database compromise reveals all credentials; default admin has plaintext password
- **Priority:** CRITICAL | **Effort:** Easy

### 1.3 CRITICAL: Supabase Service Role Key in .env.local
- **File:** `.env.local:3`
- **Issue:** `SUPABASE_SERVICE_ROLE_KEY` is a full JWT token checked into the repository
- **File:** `src/lib/supabase.ts:20` - Falls back to anon key if service role missing, meaning anon key could get admin privileges
- **Impact:** Full database bypass of Row Level Security; anyone with repo access has DB admin
- **Priority:** CRITICAL | **Effort:** Easy (add to .gitignore, rotate keys)

### 1.4 CRITICAL: No Middleware Authentication
- **File:** `middleware.ts:3-4`
- **Issue:** Middleware is a pass-through: `return NextResponse.next()` with no auth check
- **Impact:** All pages and API routes accessible without authentication; only client-side gating exists
- **Priority:** CRITICAL | **Effort:** Medium

### 1.5 CRITICAL: API Routes Have No Auth Guards
- **Files:** `src/app/api/ocr/route.ts`, `src/app/api/market-comps/route.ts`, `src/app/api/extract-ownership/route.ts`, `src/app/api/pdf-extract/route.ts`
- **Issue:** No authentication or authorization checks on any API endpoint
- **Impact:** Anyone can call OCR/Gemini endpoints, consuming API quota; data extraction endpoints can be abused
- **Priority:** CRITICAL | **Effort:** Medium

### 1.6 HIGH: Gemini API Key Passed in URL Query String
- **Files:** `src/app/api/ocr/route.ts:98`, `src/app/api/extract-ownership/route.ts:80`, `src/app/api/market-comps/route.ts:81`, `src/app/api/pdf-extract/route.ts:149`
- **Issue:** `?key=${apiKey}` exposes the API key in server logs, proxy logs, and error traces
- **Impact:** API key leak via log files
- **Fix:** Use `x-goog-api-key` header instead of query parameter
- **Priority:** HIGH | **Effort:** Easy

### 1.7 HIGH: Weak Password Hashing (SHA-256 with 100 iterations)
- **File:** `src/lib/store.ts:97-105`
- **Issue:** Custom SHA-256 implementation with only 100 iterations, no proper KDF (bcrypt/argon2/scrypt)
- **Impact:** Trivial to brute-force; the pure-JS SHA-256 fallback (line 21-83) uses 32-bit integers with potential collision issues
- **Priority:** HIGH | **Effort:** Medium

### 1.8 HIGH: Insecure Salt Generation Fallback
- **File:** `src/lib/store.ts:91`
- **Issue:** `Math.floor(Math.random() * 256)` used when `crypto.getRandomValues` unavailable - Math.random() is not cryptographically secure
- **Priority:** HIGH | **Effort:** Easy

### 1.9 HIGH: Fake IP Address in Login Logs
- **File:** `src/lib/store.ts:575, 600`
- **Issue:** `'192.168.1.' + Math.floor(Math.random() * 255)` - fake IP addresses instead of real client IPs
- **Impact:** Login audit trail is meaningless; cannot detect unauthorized access
- **Priority:** HIGH | **Effort:** Medium

### 1.10 HIGH: No HTTPS Enforcement
- **Context:** App runs on HTTP inside Docker with Coolify
- **Issue:** No HSTS headers, no redirect to HTTPS; crypto.subtle unavailable in HTTP context (the entire reason for the pure-JS SHA-256 workaround)
- **Priority:** HIGH | **Effort:** Medium

### 1.11 MEDIUM: No Rate Limiting
- **Files:** All API routes
- **Issue:** No rate limiting on login attempts, OCR calls, or any API endpoints
- **Impact:** Brute-force attacks on login; API quota exhaustion
- **Priority:** HIGH | **Effort:** Medium

### 1.12 MEDIUM: No Input Validation/Sanitization
- **Files:** All API routes and form handlers
- **Issue:** No Zod/Joi/Yup validation; direct JSON parsing of request bodies; no SQL injection protection beyond Supabase's parameterized queries
- **Priority:** MEDIUM | **Effort:** Medium

### 1.13 MEDIUM: XSS via dangerouslySetInnerHTML
- **Files:** `src/app/layout.tsx:17,24`, `src/app/reports/new/page.tsx:933`, `src/app/login/LoginPage.tsx:192`, `src/app/employees/page.tsx:635`, `src/components/search/CommandPalette.tsx:352`
- **Issue:** 10+ instances of `dangerouslySetInnerHTML` - while currently only injecting static CSS/keyframes, this is a dangerous pattern that should be replaced with CSS modules or styled-components
- **Priority:** MEDIUM | **Effort:** Medium

---

## 2. ARCHITECTURE ISSUES

### 2.1 CRITICAL: Fire-and-Forget Database Writes
- **File:** `src/lib/store.ts:621-623, 631-637, 643-645, 659-661`
- **Issue:** All Supabase writes use `.then()` without awaiting: `db.from('reports').insert(row).then(({ error }) => { if (error) console.error(...) })`
- **Impact:** 
  - Silent data loss - writes fail but UI shows success
  - Race conditions - concurrent tabs can corrupt data
  - No retry logic for transient failures
  - The "revert" in `updateReport` (line 635) doesn't restore original data, it just creates a shallow copy
- **Priority:** CRITICAL | **Effort:** Hard

### 2.2 HIGH: Global Mutable State (960-line God Object)
- **File:** `src/lib/store.ts`
- **Issue:** Single 960-line store with module-level mutable arrays (`_reports`, `_banks`, etc.), no state management library, no immutable updates
- **Impact:** 
  - All components share mutable references
  - No undo/redo capability
  - No state history for debugging
  - React re-render issues (state changes don't trigger re-renders because React doesn't track external mutable state)
- **Priority:** HIGH | **Effort:** Hard

### 2.3 HIGH: No Error Boundaries
- **Files:** None exist
- **Issue:** No React Error Boundaries anywhere in the component tree
- **Impact:** A single component crash takes down the entire app
- **Priority:** HIGH | **Effort:** Easy

### 2.4 HIGH: Client-Side Only Auth
- **Files:** `src/lib/store.ts:528-535`, `middleware.ts`
- **Issue:** Authentication state stored in localStorage (`ireo_logged_in`, `ireo_current_user_id`); server has zero auth awareness
- **Impact:** Trivially bypassed by setting localStorage; no server-side session validation
- **Priority:** HIGH | **Effort:** Hard

### 2.5 HIGH: Massive Component Files
- **Files:** `src/app/employees/page.tsx` (640 lines), `src/lib/report-export.ts` (485 lines), `src/app/reports/new/page.tsx` (~950 lines)
- **Issue:** Monolithic page components mixing business logic, UI, and state management
- **Priority:** MEDIUM | **Effort:** Medium

### 2.6 MEDIUM: Manual camelCase/snake_case Mapping
- **File:** `src/lib/store.ts:150-439`
- **Issue:** ~290 lines of hand-written mapper functions for every entity type; no generic solution
- **Impact:** Error-prone, duplicated code; adding a field requires changes in 4 places (type, mapper, reverse mapper, snake conversion)
- **Priority:** MEDIUM | **Effort:** Medium

### 2.7 MEDIUM: No Database Type Safety
- **File:** `src/lib/database.types.ts` (exists but uses `Record<string, unknown>` everywhere)
- **Issue:** Supabase client is used without generated types; all row mapping casts to `Record<string, unknown>`
- **Priority:** MEDIUM | **Effort:** Medium (use `supabase gen types`)

### 2.8 MEDIUM: Notification Polling Instead of Real-Time
- **File:** `src/lib/notification-service.ts:140`
- **Issue:** Polls Supabase every 5 seconds instead of using Supabase Realtime subscriptions
- **Impact:** Unnecessary database load (every 5s × every logged-in user); delays up to 5 seconds
- **Priority:** MEDIUM | **Effort:** Medium

### 2.9 LOW: Auto-Archiver Runs Client-Side
- **File:** `src/lib/auto-archiver.ts`
- **Issue:** Archive logic only runs when a client browser loads the app; if nobody visits, reports never archive
- **Impact:** Missed archiving; inconsistent behavior across users
- **Priority:** LOW | **Effort:** Medium (should be a cron job / serverless function)

---

## 3. PERFORMANCE ISSUES

### 3.1 HIGH: Initial Load Fetches ALL Data
- **File:** `src/lib/store.ts:442-521`
- **Issue:** `initializeStore()` fetches ALL rows from 9 tables simultaneously with no pagination
- **Impact:** As data grows, app startup time increases linearly; memory usage scales with total data size
- **Priority:** HIGH | **Effort:** Hard

### 3.2 HIGH: No Pagination on Reports/Beneficiaries Pages
- **Files:** `src/app/reports/page.tsx`, `src/app/beneficiaries/page.tsx`
- **Issue:** All data rendered at once; no virtual scrolling or pagination
- **Priority:** HIGH | **Effort:** Medium

### 3.3 MEDIUM: PDF Processing at Scale 2.0 in Browser
- **File:** `src/lib/pdf-processor.ts:26`
- **Issue:** PDF pages rendered at 2x scale (line 26, `SCALE = 2.0`), creating huge canvas elements in memory
- **Impact:** A 10-page PDF creates 10 large canvas elements simultaneously; can crash mobile devices
- **Priority:** MEDIUM | **Effort:** Easy (process one page at a time)

### 3.4 MEDIUM: Image Base64 Sent Without Size Limits
- **Files:** `src/app/api/ocr/route.ts:55-56`, `src/lib/ocr.ts:373-378`
- **Issue:** No limit on number of images or total payload size for OCR API calls
- **Impact:** Can send massive payloads; `bodyParser` size limits not configured
- **Priority:** MEDIUM | **Effort:** Easy

### 3.5 MEDIUM: Duplicate `extractMimeType` Function
- **Files:** `src/app/api/ocr/route.ts:44-49`, `src/app/api/extract-ownership/route.ts:50-56`, `src/app/api/pdf-extract/route.ts:119-125`
- **Issue:** Same function copy-pasted across 3 API routes
- **Priority:** LOW | **Effort:** Easy

### 3.6 LOW: `setTimeout` Artificial Delay in OCR Pipeline
- **File:** `src/lib/ocr.ts:406`
- **Issue:** `await new Promise(r => setTimeout(r, 200))` - artificial 200ms delay after OCR processing
- **Impact:** Unnecessary slowdown
- **Priority:** LOW | **Effort:** Easy

---

## 4. CODE QUALITY ISSUES

### 4.1 HIGH: Massive Code Duplication in API Routes
- **Files:** `src/app/api/ocr/route.ts`, `src/app/api/extract-ownership/route.ts`, `src/app/api/pdf-extract/route.ts`, `src/app/api/extract-sketch/route.ts`
- **Issue:** Nearly identical Gemini API call logic, `extractMimeType()`, `parseJSONResponse()`, and error handling copy-pasted across 4 files
- **Impact:** Bug fixes must be applied in 4 places; inconsistent error handling
- **Priority:** HIGH | **Effort:** Medium

### 4.2 HIGH: Inconsistent UUID Generation
- **Files:** `src/app/banks/page.tsx:22-26`, `src/lib/store.ts:566-570, 591-595`
- **Issue:** `'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ...)` copy-pasted; uses `Math.random()` which is not RFC 4122 compliant
- **Impact:** Potential UUID collisions in distributed environments
- **Priority:** MEDIUM | **Effort:** Easy (use `crypto.randomUUID()` with fallback)

### 4.3 MEDIUM: Inline Styles Instead of CSS Classes
- **Files:** Nearly every component file
- **Issue:** 90%+ of styling done via inline `style={{}}` objects, not CSS classes or Tailwind
- **Impact:** Poor performance (style objects recreated every render); no style reuse; hard to override; huge bundle size from repeated style objects
- **Priority:** MEDIUM | **Effort:** Hard (would need refactoring entire UI)

### 4.4 MEDIUM: No Error Handling in Login Flow
- **File:** `src/components/layout/AppContext.tsx:76-126`
- **Issue:** `initializeStore().then()` - if Supabase is unreachable, the app shows a blank loading screen forever (only console.error)
- **Priority:** MEDIUM | **Effort:** Easy

### 4.5 LOW: TypeScript `any` Types Everywhere
- **Files:** `src/lib/store.ts`, API routes, market-comps
- **Issue:** `Record<string, unknown>`, `any` used extensively; no runtime validation
- **Priority:** LOW | **Effort:** Medium

### 4.6 LOW: No Unit Tests
- **Issue:** Zero test files found in the entire project
- **Impact:** No way to verify correctness of critical business logic (valuation calculations, OCR parsing, password hashing)
- **Priority:** MEDIUM | **Effort:** Hard

---

## 5. FEATURE GAPS FOR PRODUCTION REAL ESTATE VALUATION

### 5.1 HIGH: No Audit Trail / Activity Log
- **Issue:** No immutable audit log for valuation changes; required for regulatory compliance
- **Priority:** HIGH | **Effort:** Medium

### 5.2 HIGH: No Digital Signatures
- **Issue:** Reports exported as DOCX with "Signature: _________" placeholder; no digital signing
- **Priority:** HIGH | **Effort:** Hard

### 5.3 HIGH: No Data Backup/Recovery
- **Issue:** No backup strategy; fire-and-forget writes mean data can be silently lost
- **Priority:** HIGH | **Effort:** Medium

### 5.4 MEDIUM: No Multi-Tenancy / Office Isolation
- **Issue:** Single global store; no way to separate data between valuation offices
- **Priority:** MEDIUM | **Effort:** Hard

### 5.5 MEDIUM: No PDF Export (Only DOCX)
- **File:** `src/lib/report-export.ts`
- **Issue:** Only Word document export; banks typically require PDF
- **Priority:** MEDIUM | **Effort:** Medium

### 5.6 MEDIUM: No Map/GIS Integration
- **Issue:** Property locations stored as text; no map visualization or coordinate validation
- **Priority:** MEDIUM | **Effort:** Medium

### 5.7 MEDIUM: No Report Version History
- **Issue:** Reports can be edited with no history tracking; no way to see previous valuations
- **Priority:** MEDIUM | **Effort:** Medium

### 5.8 LOW: No Offline Mode
- **Issue:** App requires constant internet connection; no PWA/service worker
- **Priority:** LOW | **Effort:** Hard

### 5.9 LOW: No Internationalization Framework
- **Issue:** `next-intl` is a dependency but not configured; all text is hardcoded Arabic strings mixed with English code
- **Priority:** LOW | **Effort:** Hard

---

## 6. UX / ACCESSIBILITY ISSUES

### 6.1 HIGH: No Loading States for Critical Operations
- **Files:** Report wizard, bank pages, beneficiary pages
- **Issue:** Many async operations have no loading indicators; users can double-submit
- **Priority:** HIGH | **Effort:** Medium

### 6.2 MEDIUM: No Form Validation Feedback
- **File:** `src/app/reports/new/page.tsx:345-375`
- **Issue:** `validateStep` function only returns boolean; no specific error messages shown to user
- **Priority:** MEDIUM | **Effort:** Medium

### 6.3 MEDIUM: No Keyboard Navigation Support
- **Issue:** Custom form components lack proper `aria-*` attributes, `tabIndex`, focus management
- **Priority:** MEDIUM | **Effort:** Medium

### 6.4 MEDIUM: No Responsive Design for Tables
- **Files:** Reports list, employees table, banks table
- **Issue:** Fixed-width tables don't adapt to mobile screens
- **Priority:** MEDIUM | **Effort:** Medium

### 6.5 LOW: No Dark Mode Consistency
- **Issue:** Dark mode implemented via `isDark` boolean prop drilling; many components have hardcoded colors
- **Priority:** LOW | **Effort:** Medium

---

## 7. PRIORITY ACTION PLAN

### Phase 1: IMMEDIATE (1-2 weeks) - Security Fixes
| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| 1 | Remove admin credentials from login UI | CRITICAL | Easy |
| 2 | Hash default admin password on seed | CRITICAL | Easy |
| 3 | Add .env.local to .gitignore & rotate keys | CRITICAL | Easy |
| 4 | Add auth middleware | CRITICAL | Medium |
| 5 | Add auth guards to API routes | CRITICAL | Medium |
| 6 | Move Gemini API key to header | HIGH | Easy |
| 7 | Add rate limiting to login | HIGH | Medium |

### Phase 2: SHORT-TERM (2-4 weeks) - Architecture
| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| 8 | Await Supabase writes with error handling | CRITICAL | Hard |
| 9 | Add React Error Boundaries | HIGH | Easy |
| 10 | Extract shared Gemini API client | HIGH | Medium |
| 11 | Implement proper UUID generation | MEDIUM | Easy |
| 12 | Add pagination to data-heavy pages | HIGH | Medium |
| 13 | Add input validation (Zod) | MEDIUM | Medium |

### Phase 3: MEDIUM-TERM (1-2 months) - Production Readiness
| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| 14 | Replace SHA-256 with bcrypt/argon2 (server-side) | HIGH | Medium |
| 15 | Implement server-side sessions | HIGH | Hard |
| 16 | Add audit trail for valuation changes | HIGH | Medium |
| 17 | Add PDF export alongside DOCX | MEDIUM | Medium |
| 18 | Use Supabase Realtime instead of polling | MEDIUM | Medium |
| 19 | Generate Supabase types for type safety | MEDIUM | Medium |
| 20 | Add unit tests for critical business logic | MEDIUM | Hard |

### Phase 4: LONG-TERM (2-3 months) - Polish
| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| 21 | Migrate inline styles to CSS/Tailwind | MEDIUM | Hard |
| 22 | Add map/GIS integration | MEDIUM | Medium |
| 23 | Implement report version history | MEDIUM | Medium |
| 24 | Add digital signatures | HIGH | Hard |
| 25 | Implement proper state management | HIGH | Hard |
| 26 | Add i18n support | LOW | Hard |

---

## 8. FILE-BY-FILE ANALYSIS SUMMARY

| File | Lines | Key Issues |
|------|-------|------------|
| `src/lib/store.ts` | 960 | God object, fire-and-forget writes, weak hashing, fake IPs, plaintext password |
| `src/app/reports/new/page.tsx` | ~950 | Monolithic wizard, no error boundaries, inline styles |
| `src/app/employees/page.tsx` | 640 | Monolithic component, inline UUID generation |
| `src/lib/report-export.ts` | 485 | Good structure but hardcoded translations |
| `src/lib/ocr.ts` | 458 | Well-structured, good Arabic normalization |
| `src/app/api/pdf-extract/route.ts` | 409 | Duplicated code, no auth, no rate limit |
| `src/lib/market-comps.ts` | 380 | Creative scraping approach, brittle API integration |
| `src/components/search/CommandPalette.tsx` | 364 | All inline styles, good keyboard nav |
| `src/lib/notification-service.ts` | 288 | Polling instead of realtime, well-structured |
| `src/lib/pdf-processor.ts` | 261 | Good separation, memory concerns with scale 2x |
| `src/app/api/market-comps/route.ts` | 244 | Duplicated Gemini code, no auth |
| `src/lib/supabase.ts` | 29 | Service role fallback to anon key |
| `middleware.ts` | 9 | Completely empty middleware |

---

## 9. POSITIVE OBSERVATIONS

1. **OCR/AI Integration**: Well-designed OCR pipeline with image compression, Arabic text normalization, confidence scoring, and graceful fallback from structured to regex parsing
2. **Report Wizard**: Comprehensive multi-step wizard covering land, villa, apartment types with proper type-specific fields
3. **Market Comps**: Creative integration with OmanReal API with caching, fallback scraping, and AI-assisted analysis
4. **Notification System**: Browser push notifications, sound alerts, and polling-based updates (though should use realtime)
5. **Arabic-first Design**: Proper RTL support throughout
6. **Docker Deployment**: Proper multi-stage Dockerfile with non-root user
7. **DOCX Export**: Comprehensive Word document export with proper formatting and bilingual field labels

---

*Report generated by comprehensive static analysis of all source files.*
*Total files analyzed: 60+ | Total lines: ~19,500*

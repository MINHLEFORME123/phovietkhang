# Phố Việt Khang - Project Record

## Modifications

### [2026-06-06] Standardized Navigation, Inbox Redirect & Lucky Wheel
- **Unified Navigation Rendering**: Modified `js/client.js` to compile and render a standardized header layout dynamically on all user pages, ensuring correct language switches, links, and buttons (including a persistent Inbox link).
- **Guest Inbox Redirect**: Added a global click listener in `js/auth.js` to prevent unregistered guests from opening `inbox.html`, automatically redirecting them to `login.html`.
- **Lucky Wheel (Vòng quay may mắn)**:
  - Integrated a premium SVG wheel inside `profile.html` with 12 segments corresponding to 5%, 10%, 15%, and 20% discounts.
  - Implemented custom two-stage inertia physics: when landing on lower discounts (5% and 10%), the wheel slows to a crawl on the adjacent high segment (20% or 15%), hesitates, and then slips forward.
  - Hidden spin classification: aggregated all spin types (Normal, Good, VIP) into a single "Remaining Spins" count on the frontend so the customer is unaware of the internal spin quality tier, consuming them dynamically in the background. Probabilities: Normal (50% for 5%, 50% for 10%), Good (20% for 5%, 60% for 10%, 20% for 15%), VIP (100% for 20%).
  - Seeded new users (from register forms or admin tool creation) with `spins: { deu: 1, xin: 0, vip: 0 }`.
  - Configured Firestore decrements, custom voucher code generation (e.g. `WHEEL5-XXXX`), and transactional Firestore message alerts.
  - **Fixed Physical Pointer Angle Mismatch & Realistic Easing**: Corrected the wheel rotation angle calculations in `profile.html` by shifting calculations relative to the top center pointer ($270^\circ$). Implemented a pure 3-phase physics simulation using Hermite spline interpolation for the "inertia slip" (bait effect), completely eliminating artificial "crawling" and matching entry/exit velocities at each transition:
    1. **Natural Deceleration**: The wheel spins and runs out of momentum naturally, coming to a near-stop exactly as it touches the final peg.
    2. **Instant Slip**: Gravity and the mechanical pointer instantly snap the wheel down into the adjacent target slot (5% or 10%).
    3. **Settle/Wobble**: An elastic spring-like bounce/vibration to tactilely lock the wheel in place.
    - **Physical Pointer Snapping**: Integrated dynamic rotation physics on the top red pointer element (`#wheel-pointer`), causing it to bend in the direction of rotation when passing segment dividers (pegs) and snap back elastically, vibrating rapidly during high-speed spins and clicking slowly during crawling phases.
- **Admin Chat Spin Management**:
  - Implemented `sendSpinsToUser(uidOrEmail, spinType, count)` in `js/admin.js` to let the Cerebras AI assistant grant spins to users instantly.
  - Added a **Tặng lượt quay (Quick Gift)** control panel inside the header of the administrator chat window, allowing manual input of Email/UID, type select (Thường, Xịn, VIP), spin count, and an instant execution trigger.
- **Admin Message Composer Spin Attachment**:
  - Modified `admin/messages.html` and `js/admin-messages.js` to add a "Tặng lượt quay Lucky Wheel" checkbox options panel next to the voucher configurations.
  - Administrators can now gift spins (Normal, Good, VIP) to a specific user or broadcast them to all users while sending messages/announcements, showing spin details in the Sent History logs.

### [2026-06-05] Added Gmail Fields & Transactional Email Notifications
- **Gmail Checkout Input**: Added a required Email/Gmail input field to the checkout form on the Cart & Checkout page (`cart.html`).
- **Firestore Schema Update**: Updated `js/checkout.js` order submission process to extract and save the `customerEmail` property inside each Firestore order document.
- **Cloudflare Worker Email Integration**: Implemented a new `sendEmail` action inside `cloudflare-worker/worker.js` utilizing the Resend API. Included a graceful development sandbox simulation that logs warnings if no `RESEND_API_KEY` is configured, preventing checkout crashes.
- **Order Placement Confirmation**: Automatically dispatches a beautifully formatted html order confirmation email to the customer immediately upon successful checkout.
- **Order Completed Alerts**: Programmed the admin panel `changeStatus` trigger to automatically dispatch a transactional "Order Ready & Completed" email when an order's status transitions to `completed` in the Order Manager.

### [2026-06-05] Fixed Footer Logo Visibility & Brand Styling in Dark Theme Pages
- **Contrast Optimization**: Corrected the `"on-tertiary"` value in the Tailwind configuration from `#07182b` (dark blue) to `#ffffff` (white) for `menu.html`, `locations.html`, `contact.html`, and `reservations.html`. This ensures the brand logo and text in the footer render clearly on the dark backgrounds.
- **Brand Identity & Icon**: Explicitly forced the brand link logo text in the footer to `text-white` on all pages and added a custom modern `ramen_dining` (bowl/chopsticks) Material Symbols icon next to it for enhanced premium aesthetics.

### [2026-06-05] Implemented Live Admin Dashboard & Order Manager UI
- **Real-Time Dashboard**: Replaced the static dashboard placeholder `admin/index.html` with a fully operational real-time dashboard featuring stat cards for today's revenue, active orders count, completed orders today, and total products. Integrated Chart.js from CDN to display 7-day revenue trend line charts and order type distribution doughnut charts. Injected a live list of the 5 most recent orders with status-based colored badges.
- **Advanced Order Manager**: Overhauled `admin/order-manager.html` with multi-tab status filters ("All", "Pending", "Cooking", "Ready", "Completed", "Cancelled") and a responsive live query search filter. Added direct inline status transitions using dropdown selectors.
- **Detailed Order Modal**: Implemented a customer-friendly popup overlay modal displaying details such as customer name/phone, dining type details (table/address info), items ordered with custom options, special instructions notes, and final calculations.
- **Firestore Snapshots**: Configured client-side `onSnapshot` real-time listeners inside `js/admin.js` to automatically redraw both the dashboard charts/tables and the order manager listings instantly when customer orders are placed or altered.

### [2026-06-05] Integrated 14 Custom AI Menu Management Tools
- **14 Advanced Tools**: Added complete client-side implementations, XML routing, system prompt descriptions, and validation lists for all 14 requested functions: `updateMenuName`, `updateMenuDescription`, `updateMenuCategory`, `updateMenuAvailability`, `uploadMenuImage`, `removeMenuImage`, `updateMenuPreparationTime`, `updateMenuNutritionInfo`, `addMenuTag`, `removeMenuTag`, `reorderMenuItems`, `duplicateMenuItem`, `deleteMenuItem`, and `updateMenuCustomFields`.
- **Robust Argument Parsing**: Configured the agent loop dispatcher to handle alternative parameter mappings (e.g., matching `newCategoryId`, `categoryId`, `imageUrl`, `newDishId`, and `customFieldsObject` automatically with the Firestore writer).
- **Auto-Refresh Integration**: Programmed successful tool execution callbacks to trigger `window.loadFood()` and `window.loadCategories()`, instantly updating administrative tables.

### [2026-06-05] Added Full Trilingual Categories & Options Support
- **Trilingual Categories**: Overhauled the category system to save `categoryVi`, `categoryEn`, and `categoryFi` in Firestore documents. Admin Add Food page and Edit Food modal split single category fields into three fields. The client-side customer menu groups by `categoryVi` (with legacy fallback) and applies translations dynamically on category header rendering.
- **Trilingual Options**: Option group names and option choice labels now accept and display translated values (`nameVi`, `nameEn`, `nameFi` for groups and `labelVi`, `labelEn`, `labelFi` for choices) in the admin builders, lists, and customer options custom popup modal.
- **Trilingual AI Operations**:
  - Updated Vision scanning (`btnAiScan`) and Excel bulk import (`btnAiExtract`) system prompts and save loops to request and output trilingual categories and options.
  - Updated AI Assistant's option manipulation tools (`addMenuOptionGroup` and `addChoiceToOptionGroup`) to accept language-specific fields.
  - Implemented 2 new custom AI tools: `updateMenuOptionGroup` (for renaming option groups or updating types) and `updateChoiceInOptionGroup` (for modifying choice labels/prices) supporting 3 languages.

### [2026-06-05] Implemented Sequential Tool Call Execution & Robust Failure Summaries
- **Sequential Execution**: Replaced the parallel `Promise.all` execution of tool calls with sequential processing (with a 40ms safety buffer). This prevents hitting Firebase and Cloudflare Worker rate limits and avoids browser concurrent HTTP request limits (max 6 connections).
- **Error Classification Fix**: Correctly classified tool responses that contain an `error` key as failures (setting `success: false`) instead of falsely flagging them as successful executions.
- **Real-Time Progress UI**: Enhanced the floating assistant UI to show live progress of sequential executions (e.g. "Đang thực hiện 3/10 (toolName)... (Thành công: 2, Thất bại: 1)").
- **Summary-Driven AI Feedback**: Added a structured header summarizing success/failure counts to the prompt fed back to the AI model, ensuring the AI correctly understands and reports failures rather than claiming everything succeeded.
- **Added Option & Choice Management Tools**: Implemented 4 new helper tools (`addMenuOptionGroup`, `removeMenuOptionGroup`, `addChoiceToOptionGroup`, `removeChoiceFromOptionGroup`) allowing the AI to add/remove custom option groups or individual choice modifiers directly in Firestore menu items.
- **Trilingual Options Support**: Refactored options structure to fully support Vietnamese, English, and Finnish language localization dynamically matching the guest's selected language in the customer menu interface.
- **Added Web Browsing & Search Tools**: Integrated `webSearch` (using DuckDuckGo HTML scraper routed via Cloudflare Worker) and `browseWebUrl` (scraping, cleaning, and context-truncating web page text via Cloudflare Worker) allowing the AI assistant to browse external websites, look up market data, or research menu items.

### [2026-06-05] Fixed AI Menu Scan Parsing & OpenRouter Call Resilience
- Added `<think>...</think>` tag stripping in `admin.js` to prevent reasoning tags from interfering with JSON boundaries locator.
- Implemented a robust `repairJson` auto-repair algorithm that balances unclosed brackets, braces, and open quotes in case of truncated or slightly malformed JSON responses from reasoning models.
- Replaced manual retry loops with a unified `callOpenRouterWithFallback` utility function that sequentially tries preferred models (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`, `meta-llama/llama-3-8b-instruct:free`, and `google/gemma-2-9b-it:free`).
- Updated the OpenRouter API key for both AI Translate and AI Auto Description features to use the correct active key (`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`) and configured secondary backup API keys (`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` and `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`) for automated failover rotation.

### [2026-06-05] Implemented Messenger-Style AI Admin Chat with Custom Tools
- Added a floating chat bubble (Messenger style) in the bottom-right corner of all admin pages.
- Configured the chat to communicate with Cerebras API (`gpt-oss-120b` using key `csk-rv8v6r5vevr2pxmw8h9nprtv3nty525wc6m3xw2rykxfmc4f`) for ultra-fast response times, with robust fallbacks to OpenRouter (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`).
- Designed a custom client-side function-calling agent loop using XML `<tool_call>` markers with support for parallel tool execution (allowing multiple tool blocks to be returned in a single turn and executed concurrently).
- Implemented 8 custom assistant tools that run directly in the user's browser session:
  1. `getOrdersSoldToday`: Analyzes Firestore orders collection to count total orders, total revenue, and lists detail records for the current day.
  2. `listAllFoodItems`: Lists all menu items, IDs, base prices, categories, and option groups.
  3. `setOptionChoicePrice`: Allows AI to update prices of custom item choice modifiers (e.g. sauce, size toppings) directly in Firestore.
  4. `updateMenuPrice`: Updates a dish's main base price in Firestore.
  5. `listAllUsers`: Fetches all user profiles (uid, email, name, role) from Firestore.
  6. `changeUserRole`: Dynamically updates a user's access role (admin, customer, kitchen, host).
  7. `deleteUserAccount`: Deletes a user profile document from Firestore.
  8. `createUserAccount`: Automatically registers a new account using a secondary client-side Auth instance and populates their Firestore profile (preventing logging out the current admin session).
  9. `sendPasswordReset`: Triggers a native Firebase Auth password reset/recovery email sent to the target user.
  10. `updateOrderStatus`: Updates the workflow status of a customer order (e.g. pending, completed).
  11. `deleteOrder`: Removes an order document from Firestore.
  12. `getOrdersByStatus`: Fetches a filtered list of orders matching a given status code.
  13. `changeCurrentAdminPassword`: Modifies the currently authenticated administrator's login password.
  14. `updateCurrentAdminEmail`: Changes the email address associated with the active admin account.
  15. `updateCurrentAdminProfile`: Updates the display name of the current administrator.
- Added support for auto-refreshing the dashboard list tables (`loadFood` / `loadUsers`) immediately when data is modified by the AI.
- Fixed script importing across `admin/index.html` and `admin/order-manager.html` to load `admin.js` with `type="module"` to match the other pages and support Firestore ESM imports.

### [2026-06-04] Implemented Premium Dark Theme for Secondary Pages
- Transformed the background of `menu.html`, `locations.html`, `contact.html`, and `reservations.html` to a rich dark theme (`#0a0e17` with a subtle restaurant pattern).
- Reconfigured the Tailwind CSS theme colors on these pages:
  - Background: Deep slate dark (`#0b0f19`).
  - Cards: Semi-transparent glassmorphic dark surface (`#121824` at `90%` opacity).
  - Main text: Crisp off-white (`#f3f4f6`).
  - Accent titles and categories: Vibrant sky blue (`#3b82f6`).
  - Form fields and inputs: Styled with dark container low backgrounds (`#18202d`) and subtle borders (`rgba(255,255,255,0.1)`).
- Added `color-scheme: dark;` to form pages (`contact.html` and `reservations.html`) to ensure native select dropdowns, time pickers, and date pickers adapt flawlessly to the dark theme.
- Kept `index.html` completely untouched to preserve its homepage design, snowfall effects, and current styling.

### [2026-06-04] Updated Locations to Real Addresses
- Replaced 3 fictional locations with 2 real **Phở Việt Khang** branches:
  1. **Pengerkatu** – Pengerkatu 29, 00500 Helsinki (Mon: Closed, Tue–Fri: 11:00–20:00, Sat–Sun: 12:00–20:30)
  2. **Easton Helsinki** – Kauppakartanonkatu 3, 00930 Helsinki (Mon–Fri: 11:00–21:00, Sat–Sun: 12:00–21:00)
- Updated phone number across all pages to **+358 44 978 9995**.
- Updated `locations.html` grid from 3-col to 2-col layout.
- Updated `contact.html` address and hours to match Pengerkatu branch.
- Updated `reservations.html` location dropdown and phone number.
- Opening hours sourced from Google Maps/Easton website.

### [2026-06-04] Added Smooth Page Transitions
- Added CSS `@keyframes` animations (`pageFadeIn` / `pageFadeOut`) to all 5 pages.
- Content fades in with a subtle slide-up (0.4s) on page load.
- When clicking an internal nav link, content fades out with slide-up (0.3s) before navigation.
- JS event listener intercepts internal `<a>` clicks, adds `page-exit` class, and delays `window.location.href`.

### [2026-06-04] Created All Remaining Pages
- Created **menu.html** with 4 categories: Khai vị (4 items), Món chính (6 items), Đồ uống (3 items), Tráng miệng (3 items). Each dish with name, description, and price in EUR.
- Created **locations.html** with 3 branch cards (Helsinki Center, Espoo Leppävaara, Vantaa Tikkurila), each with address, opening hours, phone, and Google Maps embed.
- Created **contact.html** with a contact form (name, email, phone, message) and info cards (email, phone, address, hours).
- Created **reservations.html** with a full booking form (name, phone, email, date, time picker, guest count, location selector, special requests).
- All 4 pages share the exact same design system (Tailwind config, color palette, typography, patterns, nav, footer) as index.html.
- All 4 pages support full trilingual localization (Vietnamese, English, Finnish) with the same language switcher and localStorage persistence.
- Updated **index.html** navigation links from `#` to actual page filenames (`menu.html`, `locations.html`, `contact.html`, `reservations.html`).

### [2026-06-04] Fixed Image Loading Issues
- Switched dish imagery to Pexels CDN (`images.pexels.com`) and Unsplash (`images.unsplash.com`) to fix broken Unsplash IDs and 403 Forbidden errors encountered with Wikimedia Commons and Pollinations AI. These platforms permit direct hotlinking and load flawlessly.

### [2026-06-04] Replaced Signature Dishes with Vietnamese Menu
- Changed the "Signature Creations" menu from generic Asian fine dining to authentic Vietnamese dishes:
  1. Cơm rang vịt (Duck Fried Rice)
  2. Súp hoành thánh (Wonton Soup)
  3. Phở tái lăn (Stir-fried Rare Beef Pho)
  4. Gỏi cuốn tôm (Shrimp Fresh Spring Rolls)
  5. Cafe muối (Salted Coffee)
- Updated the Javascript localization dictionary (`translations`) with comprehensive titles and descriptions for all 5 dishes in Vietnamese, English, and Finnish.

### [2026-06-04] Added Language Switching Feature
- Replaced the navigation flag image buttons with crisp, inline SVG flags for **Vietnam**, **United Kingdom**, and **Finland**.
- Implemented a clientside JavaScript localization system using a translations dictionary (`translations`).
- Added `data-i18n` attributes to target text nodes across the entire page (navigation links, hero section, story section, signature dishes, call to action, and footer).
- Added `localStorage` integration to persist the user's selected language between sessions.
- Added visual feedback (active border and scale effect) on the active language button.
- Replaced the SVG/Button setup with direct `<img>` tags sourcing native circular SVG flags from `hatscripts/circle-flags` CDN.
- Updated Javascript highlighting logic to use `ring-2` instead of `border` to perfectly wrap around the circular flag images.

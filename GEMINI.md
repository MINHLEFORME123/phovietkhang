# Phố Việt Khang - Project Record

## Modifications

### [2026-09-05] Resolved Character Encoding (Mojibake) Across All HTML Pages
- **Changes**:
  - Diagnosed encoding issue where Vietnamese and Nordic characters rendered as mojibake (`Phá»Ÿ Viá»‡t Khang`, `SÃ¶rnÃ¤inen`).
  - Identified root cause: `<meta charset="utf-8">` was placed past byte 1024 (down at line 90 behind analytics scripts and style tags), causing browsers on Windows to default to Windows-1252/ISO-8859-1 decoding.
  - Relocated `<meta charset="utf-8"/>` and `<meta name="viewport">` to the very top of `<head>` (at byte ~51) across all 21 root HTML pages (`index.html`, `menu.html`, `locations.html`, `about.html`, etc.) in full compliance with the HTML5 charset declaration specification.
  - Added explicit `charset="utf-8"` attribute to all `<script src="js/client.js">` tags across all pages to guarantee proper Unicode string evaluation in all browser environments.
  - Verified via browser test that all Vietnamese diacritics, Finnish/Swedish umlauts, and emojis render crisply without mojibake.

### [2026-09-05] Added Sushi Launch -20% Promotional Pop-up Modal on Website Entry
- **Changes**:
  - Implemented a high-impact, premium promotional pop-up modal (`#sushi-promo-modal`) on website entry (`index.html`) using the promotional launch poster and full menu sheets from `C:\Users\minhb\OneDrive\Desktop\WhatsApp Unknown 2026-09-05 at 15.30.43`.
  - Copied and organized the assets: main launch poster into `/images/sushi-launch.jpeg` and all 5 sheets (poster + 4 menu pages for Sashimi, Nigiri, Maki, Sets, and Combos) into `/images/sushi/`.
  - Built an interactive multi-sheet viewer right inside the popup: customers can browse the 4 detailed menu sheets with thumbnail tabs and a page indicator, or click to open high-res images.
  - Added primary call-to-action button linking directly to `/menu` ("🍣 Xem Thực Đơn Ngay / Explore Menu") and direct close button.
  - Implemented polite dismissal handling: remembers dismissals during current browsing session via `sessionStorage`, supports a "Không hiện lại hôm nay" checkbox saving 24h suppression in `localStorage`, and supports Escape key and backdrop clicks.
  - Added a floating re-open pill badge ("🍣 Sushi Launch -20%") in the bottom-left corner of the homepage so users can reopen the promotion anytime.
  - Added full 4-language translations (`vi`, `en`, `fi`, `sv`) to `js/client.js` with reactive updates when switching languages.

### [2026-09-05] Implemented Separate Menus for Branches & Enforced Location Selection on Entry
- **Changes**:
  - Overhauled `menu.html` location selector modal into a modern, card-based modal with addresses, opening hours, and visual indicators for Pengerkatu and Easton Helsinki, fully translated into 4 languages (VI, EN, FI, SV).
  - Enforced branch selection on entry to `/menu`: Customers must select their branch before the menu items are rendered, preventing accidental orders from the wrong branch.
  - Implemented dynamic URL query state management (`/menu?location=pengerkatu` or `/menu?location=easton`) allowing direct links from `locations.html` and preserving choice on reload.
  - Added cart branch protection: Warns customers before switching branches if they already have items in the cart to avoid cross-branch order mixups.
  - Updated `js/menu.js` filtering logic to support dishes assigned to `both` (available at both branches), `pengerkatu`, or `easton`.
  - Upgraded Admin menu management in `admin/food-add.html`, `admin/food-list.html`, `js/admin/food-add.js`, and `js/admin/food-manager.js` to support the `both` option, display visual branch badges in the food table, and filter items accurately.
  - Added self-healing background sync in `food-manager.js` to automatically assign `both` to legacy menu items missing a location field.
  - Updated AI Admin Assistant in `js/admin/ai-chat.js` with `location` parameter support in `createMenuItem` and added the `updateMenuItemLocation` tool.
  - Integrated branch recording in `js/checkout.js` so orders store `branch` and `branchLabel`, and displayed branch badges in Kitchen KDS (`js/kitchen.js`) and Order Management (`js/admin/order-manager.js`).
  - Added direct "Xem thực đơn" action buttons to both branch cards on `locations.html`.

### [2026-06-21] Fixed Console Errors, Conditional App Check, and Public Config Rules
- **Changes**:
  - Removed `frame-ancestors 'self';` from the CSP `<meta>` tags in all 38 HTML files, resolving browser warnings (since it is already properly set via server HTTP headers in `firebase.json`).
  - Added conditional initialization for Firebase App Check in `js/firebase-config.js` to prevent 400 Bad Request network errors when the site key is the default placeholder.
  - Adjusted Firestore rules in `firestore.rules` to allow public reads on `/config/{docId}` so guests can retrieve AI API keys for the chatbot and distance calculation, resolving permission denied errors.
  - Deployed updated security rules and hosting files to Firebase, and synced changes to GitHub.

### [2026-06-21] Hardened Enterprise Security & Fixed Mobile Hamburger Menu
- **Changes**:
  - Replaced Google Photos interior image in `about.html` with local `/images/story-img.jpg`.
  - Updated `css/client.css` to load `/assets/pattern-light.svg` and `/assets/pattern-dark.svg` locally, eliminating expiring Google Photos URLs.
  - Hardened security headers in `firebase.json` by adding `X-XSS-Protection`, `Referrer-Policy`, and `Permissions-Policy`, and setting `X-Frame-Options` to `DENY` to protect against Clickjacking.
  - Patched Stored XSS vulnerabilities by implementing `escapeHtml` sanitization for dynamic rendering in `js/inbox.js`, `js/kitchen.js`, and `js/order-history.js`.
  - Fixed mobile hamburger menu double-trigger conflict by removing redundant inline event listeners across all 18 HTML pages using `remove_redundant_mobile_scripts.py`.
  - Fixed mobile layout overflow bug in `css/client.css` by wrapping desktop navigation styles inside a media query.
  - Synchronized modifications between Desktop and GitHub workspaces using `sync_github.py` and deployed updated assets to Firebase Hosting.

### [2026-06-19] Implemented Generative Engine Optimization (GEO) & Local Keyword Mapping
- **Changes**:
  - Refactored `scratch/update_seo_meta.py` to inject rich `VietnameseRestaurant` JSON-LD schemas (containing precise geo-coordinates, cuisine specs, and social media/TripAdvisor links) and `<meta name="keywords">` tags across all 21 user-facing HTML pages (including `index.html`).
  - Updated `llms.txt` with high-density terms targeting search patterns like "phở ngon helsinki" and "phở ngon sornainen", explicitly outlining direct answers for LLM web-search scrapers.
  - Updated client-side translations dictionary in `js/client.js` to label the Pengerkatu branch as "Sörnäinen" and map local neighborhood terms (Sörnäinen, Sornainen, Kallio) across all supported languages (vi, en, fi, sv).
  - Synchronized changes to the GitHub workspace and deployed to Firebase Hosting.

### [2026-06-19] Replaced Reviews Marquee with Google Maps Trustindex Widget
- **Changes**:
  - Replaced the local reviews marquee rows on the homepage (`index.html`) with the Google Maps Trustindex reviews widget.
  - Deleted the marquee CSS keyframes and class selectors from the `<style>` block in `index.html`.
  - Decommissioned the local marquee Firestore loader function `loadFeedbackMarquee()` and its DOMContentLoaded call from `js/homepage.js`, optimizing database read footprint.
  - Synchronized and updated both the local Desktop and GitHub workspaces, and rebuilt SEO headers.

### [2026-06-19] Implemented Clean URLs, Dynamic Routing Protection, and Bento Grid pre-rendering for SEO & Usability
- **Changes**:
  - Configured `firebase.json` to enable `cleanUrls: true` and clean rewrite targets.
  - Corrected `scratch/sync_seo_footers.py` to strip `.html` from canonical and `hreflang` alternates, ensuring search engines index the clean URL paths.
  - Rewrote internal hyperlinks in all HTML pages to use clean paths (e.g., `href="/menu"` instead of `href="menu.html"`, `href="/"` instead of `href="index.html"`).
  - Modified client-side scripts `js/auth.js`, `js/client.js`, and `js/checkout.js` to perform authentication, routing checks, and page redirections based on clean pathnames (no `.html` suffix).
  - Cleaned up redirection endpoints inside `js/paytrail-worker.js` and `js/paytrail-gateway.test.js` to point to clean URLs `/order-tracking` and `/cart`.
  - Statically pre-rendered the 5 signature creations as a beautiful, SEO-crawlable bento grid in `index.html` to reduce FCP/LCP times.
  - Updated `js/homepage.js` to check for pre-rendered cards and prevent clear-container layout shifts.
  - Excluded transactional, user-specific pages from `sitemap.xml` while ensuring all indexable pages use clean URLs.
  - Synchronized both workspaces and deployed to Firebase Hosting.

### [2026-06-19] Synchronized and Optimized SEO & GEO tags and Footers across all User-Facing Pages
- **Changes**:
  - Unified the footer across all 20 user-facing HTML files in both Desktop and GitHub workspaces to use the premium 4-column layout including branches, contact details, quick links, and 6 social platform links (Facebook, Instagram, X/Twitter, YouTube, LinkedIn, TripAdvisor).
  - Injected Google Analytics (gtag.js) and Facebook Pixel tracking code to all user-facing HTML pages (addressing "Add Google Analytics" and "Facebook Pixel" audit warnings).
  - Implemented page-specific `<link rel="canonical">` and `hreflang` alternate link tags for `vi`, `en`, `fi`, `sv`, and `x-default` on all pages to ensure proper search engine indexing and multilingual routing.
  - Resolved tracking pixel alt compliance warnings by setting `alt="Facebook Pixel"` in the noscript tracking element.
  - Optimized metadata and index status for `404.html` by injecting custom meta description, canonical, GA, and FB pixel tags.
  - Obfuscated plain text email addresses (using client-side dynamic reconstruction mapping in `js/client.js`) to protect privacy and prevent spam bots from scraping them.
  - Upgraded branch details in the unified footer to use HTML5 `<address>` tags and added the `Finland` country suffix to ensure correct Local SEO address detection.
  - Expanded `sitemap.xml` to list all crawlable content pages (`about.html`, `careers.html`, `press.html`, `privacy.html`, `terms.html`, `reservations.html`, `rewards-store.html`), while intentionally excluding transactional user-specific pages.
  - Successfully committed changes to GitHub and deployed the optimized web assets to Firebase Hosting.

### [2026-06-19] Reverted Homepage Word Count Expansion, Updated Client Translations, and Optimized Local SEO & GEO
- **Changes**:
  - Reverted the homepage layout back to the original ~250-word story phrasing on `index.html` in both the Desktop and GitHub repositories.
  - Updated `js/client.js` in both workspaces to use the elegant, minimalist `story-p1` and `story-p2` phrasing for Vietnamese, English, and Finnish, and translated Swedish to follow the matching ~250-word pattern.
  - Removed `story-p3` from the translation files in all languages (`vi`, `en`, `fi`, `sv`).
  - Redesigned the footer across all root-level HTML files to feature a beautiful 4-column layout presenting contact details (Phone, Email), branch addresses (Pengerkatu, Easton Helsinki), quick links, and 6 active social media profile icons (adding X/Twitter, YouTube, and LinkedIn).
  - Injected multicharacter `hreflang` alternate link tags in `<head>` across all root-level HTML pages for `vi`, `en`, `fi`, `sv`, and `x-default`, and enabled dynamic language switcher loading from URL query parameters (`?lang=...`).
  - Added a structured `llms.txt` file at the root of the site to optimize Generative Engine Optimization (GEO) and ensure LLMs can parse the menu, story, and locations.
  - Synced and pushed all changes to the remote GitHub repository.

### [2026-06-13] Fixed Undefined Errors in Menu Option Tools
- **Changes**:
  - Fixed `Cannot read properties of undefined (reading 'toLowerCase')` in `updateMenuOptionGroup`, `removeMenuOptionGroup`, `addChoiceToOptionGroup`, `removeChoiceFromOptionGroup`, and `setOptionChoicePrice` by casting potentially missing LLM arguments: `String(optionName||'').toLowerCase()`.
  - Fixed `Function updateDoc() called with invalid data. Unsupported field value: undefined` in `addMenuOptionGroup` and `addChoiceToOptionGroup` by supplying fallback values (`|| ""`) so undefined properties are never pushed to the `options` array in Firestore.
  - Fixed option names falling back to "Tùy chọn" by implementing robust argument mapping in the AI chat controller, automatically flattening `groupData`/`optionData` objects and redirecting `groupId`, `groupName`, `name`, and `choiceName` inputs into the expected variables (`optionNameVi`, `choiceLabelVi`, etc.).

### [2026-06-13] Upgraded Admin Tools to Support Bulk Execution
- **Changes**:
  - Modified `updateOrderStatus`, `deleteOrder`, `updateMenuPrice`, `updateMenuAvailability`, `deleteMenuItem`, `changeUserRole`, `adminDeleteAuthUser`, `adminDisableUser`, `adminEnableUser`, `deleteReservation`, `deleteFeedback`, and `removeVoucher` in [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js).
  - These tools now accept either a single string, a comma-separated string, or an array of IDs/UIDs, allowing the AI to execute bulk actions in a single tool call without exhausting context tokens or API requests.

### [2026-06-13] Optimized Tool Return Payloads for Token Efficiency
- **Changes**:
  - Optimized `getOrdersByStatus`, `listAllVouchers`, `listAllReservations`, and `listAllFeedbacks` in [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js).
  - Optimized `getOrdersSoldToday` in `ai-chat.js` to truncate the returned items array to the top 20 most recent to save LLM context tokens.
  - Optimized `listAllUsers` in [utils.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/utils.js) to sort by `createdAt` descending and return only the top 30 most recent users.
  - Added a safety `limit(50)` fallback to `adminExecuteQuery` in `ai-chat.js` to prevent massive token payloads if the AI forgets to provide a limit parameter.
  - Truncated unnecessary fields, sorted results by date/importance, and sliced lists to return only the top 20-30 most recent items to the LLM context.
  - Replaced full collection scans in `getOrdersByStatus` with direct targeted Firestore `where` status queries.

### [2026-06-13] Optimized Menu Option Management Tools
- **Changes**:
  - Refactored `setOptionChoicePrice`, `addMenuOptionGroup`, `removeMenuOptionGroup`, `addChoiceToOptionGroup`, `removeChoiceFromOptionGroup`, `updateMenuOptionGroup`, and `updateChoiceInOptionGroup` inside [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js).
  - Switched from querying the entire menu collection to fetching specific dishes by ID using `getDoc` for improved performance.
  - Added robust handling and automatic fallback parsing for stringified JSON and comma-separated choices arrays.

### [2026-06-13] Temporarily Bypassed Lounas Time Restriction
- **Changes**:
  - Modified [menu.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/menu.js) to force `isLounasTime = true` and bypass the Helsinki time check.
  - This allows testing lunch (lounas) item ordering and pricing behavior at any time.

### [2026-06-13] Added 30 High-Privilege Super-Admin Tools to AI Admin Assistant
- **Changes**:
  - Implemented 30 new advanced tools inside [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js) giving the AI assistant direct database-level and system-wide capabilities that exceed the standard admin UI.
  - Added support for collection CRUD operations (`adminListAllCollections`, `adminGetCollectionStats`, `adminExecuteQuery`, `adminCreateDocument`, `adminUpdateDocument`, `adminDeleteDocument`).
  - Added system backups, site settings management, and maintenance mode toggling (`adminBackupCollection`, `adminRestoreCollection`, `adminGetSystemSettings`, `adminUpdateSystemSettings`, `adminToggleMaintenanceMode`).
  - Added auditing utilities (`adminGetSystemLogs`, `adminClearSystemLogs`).
  - Integrated powerful revenue and business reporting analytics (`adminGetRevenueReport`, `adminGetPopularDishesReport`, `adminGetLoyaltyUsersReport`, `adminGetFeedbackSummary`).
  - Implemented bulk user/loyalty management, promo code generation, suspended account status handling, and inbox alert notifications (`adminBulkUpdateUserPoints`, `adminBulkCreateVouchers`, `adminSendCustomInboxMessage`, `adminDeleteAllVouchers`, `adminBanUser`, `adminUnbanUser`).
  - Added menu management and reservations tools (`adminBulkUpdateMenuPrices`, `adminBulkToggleMenuAvailability`, `adminGetInventoryAlerts`, `adminAddMultipleDishes`, `adminBulkUpdateReservationsStatus`, `adminGetReservationsByDate`).
  - Added external webhook support (`adminSendWebhook`).
  - Registered all 30 tools in the registry, configured parameter normalizations, and documented details in the AI's system prompt instructions.

### [2026-06-13] Implemented Reactive Multi-Language Support for User Ranks & Loyalty Points
- **Changes**:
  - Implemented event listeners for `languageChanged` in [profile.html](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/profile.html) and [rewards-store.html](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/rewards-store.html).
  - Stored user profile documents in state (`window.userProfileDocData`) to dynamically re-render loyalty ranks (Đồng/Bronze/Pronssi, Bạc/Silver/Hopea, etc.) and loyalty points text instantly when language flags are clicked.
  - Fixed a ReferenceError in `rewards-store.html` where `totalSpent` was not defined inside the `loadUserProfile` scope.
  - Fixed a SyntaxError in `rewards-store.html` caused by a duplicate declaration of the `lang` variable in the same scope.
  - Restored `closeRewardModal` in `profile.html` which was accidentally removed during refactoring.
  - Transformed both `voucher_15` (15% discount voucher) and `shrimp_chips_bag` (1 bag of shrimp chips) rewards into vouchers that are generated in Firestore (`vouchers` collection) and sent to the user's Inbox (`messages` collection) upon points redemption, allowing users to copy the codes or present them to restaurant staff. Changed success dialog messages to reflect this.
  - Upgraded the AI Admin Assistant's `createMenuItem` tool in both [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js) and [admin.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin.js) to accept 11 parameters (Vietnamese, English, Finnish fields for name, category, and description), allowing the AI to create fully translated menu items in Firestore. Added parameter resolvers in `ai-chat.js` for fallback names.
  - Implemented 8 new powerful tools for the AI Admin Assistant to manage Reservations, Feedbacks (Contact Messages), and Vouchers: `listAllReservations`, `createReservation`, `updateReservationStatus`, `deleteReservation`, `listAllFeedbacks`, `replyToFeedback` (sends a structured HTML reply via email), `deleteFeedback`, and `updateVoucher` (edits voucher details in Firestore). Registered these tools in both [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js) and [admin.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin.js) and updated the AI's system prompt accordingly.

### [2026-06-13] Fixed False Redemption Failures by Isolating UI Refreshes
- **Changes**:
  - Isolated the `loadUserProfile()` UI update call inside a safe `try-catch` block after the Firestore database transaction commits successfully.
  - This prevents post-commit queries (such as `pointTransactions` queries which require custom composite indexes or suffer transient network dropouts) from throwing errors inside the transaction's main `try` block, which previously caused the client UI to trigger a false "Đổi quà thất bại" error toast even when the points were successfully deducted and rewards created on the server.

### [2026-06-13] Added User Points & Rank Management Tools to AI Admin Assistant
- **Changes**:
  - Implemented `updateUserLoyaltyPoints(uidOrEmail, pointsAmount, isRelative)` to allow the AI Admin Assistant to add, subtract, or set a user's loyalty points in Firestore.
  - Implemented `updateUserRank(uidOrEmail, targetRank)` to allow changing a user's rank/tier (Đồng, Bạc, Vàng, Bạch Kim, Kim Cương) by updating their Firestore `totalSpent` threshold.
  - Implemented `updateUserTotalSpent(uidOrEmail, totalSpentAmount, isRelative)` for direct manipulation of the accumulated spending database field.
  - Documented the three new tools in the assistant's system prompt inside [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js) and configured parameter resolver mappings for robustness against variable casing or abbreviations.

### [2026-06-13] Completed and Polished Rewards Store (Shop Đổi Quà) UI
- **Changes**:
  - Overhauled [rewards-store.html](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/rewards-store.html) to incorporate the unified top navigation bar (matching [index.html](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/index.html) with Home, Menu, Locations, Contact, Inbox, Register, Reservations, Cart, and Profile links).
  - Integrated the standard footer component at the bottom of the page.
  - Loaded `js/client.js` and `js/cart.js` scripts, ensuring language translation event listeners, the custom beautiful toast notification system, and the cart badge count update function correctly.
  - Implemented the three requested reward items (15% discount voucher for 200 points, 1 Lucky Wheel spin for 50 points, and 1 bag of shrimp chips for 80 points) with trilingual Vietnamese, English, and Finnish translation structures.
  - Verified logic for directly incrementing Lucky Wheel spins (`spins.deu` on the user profile document in Firestore) and generating zero-price orders/vouchers.

### [2026-06-13] Added Trilingual Support for Cash or Card Payment Description
- **Changes**:
  - Added missing `"payment-cod"` and `"payment-cod-desc"` keys to the English (`en`) and Finnish (`fi`) dictionaries in [client.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/client.js).
  - This ensures that selecting either language translates the "Cash or Card" method title and subtitle descriptions reactively on the cart checkout page.

### [2026-06-13] Added Trilingual Support to Homepage Signature Creations Tool
- **Changes**:
  - Overhauled `updateHomepageSignatureText` in both [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js) and [admin.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin.js) to accept six parameters: `titleVi`, `titleEn`, `titleFi`, `descVi`, `descEn`, `descFi`.
  - Implemented non-destructive partial updates using an object builder to avoid null overwriting of omitted fields when making updates to specific languages.
  - Documented the trilingual argument signature inside the AI system prompts for both administration script controllers.
  - Refactored signature dishes rendering logic in [homepage.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/homepage.js) to dynamically pull and render translated names and descriptions for the selected language, responding reactively to language changes.
  - Added the `getHomepageConfig()` tool to both [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js) and [admin.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin.js) so the AI assistant can query and inspect the active homepage state before executing updates.
  - Overhauled and upgraded all homepage text editing tools (`updateHomepageHero`, `updateHomepageHeroText`, `updateHomepageStory`, `updateHomepageStoryText`, and `updateHomepageCTA`) in both [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js) and [admin.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin.js) to be fully trilingual, taking 3 languages (Vietnamese, English, Finnish).
  - Refactored [homepage.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/homepage.js) and the inline hydration script in [index.html](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/index.html) to cache and switch texts reactively across all sections (Hero, Story, Signature Creations, and CTA) matching the customer's active language selection.

### [2026-06-13] Naming Attachment Identifiers Based on Original File Names
- **Changes**:
  - Implemented `sanitizeFileName` in [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js) to strip accents, spaces, and special characters from uploaded file names.
  - Updated the attachment ID generation to use the sanitized original file name (e.g. `ATTACHED_IMAGE_hero_bg_542` instead of timestamps like `ATTACHED_IMAGE_171828...`), giving the AI direct semantic context on what each attachment represents.

### [2026-06-13] Split Homepage Hero & Story Tools and Fixed Overwrite Behavior
- **Changes**:
  - Split the homepage editing tools to allow editing image and text elements independently:
    - Added `updateHomepageHeroImage(imageUrl)` & `updateHomepageHeroText(titleVi, descVi)`.
    - Added `updateHomepageStoryImage(imageUrl)` & `updateHomepageStoryText(labelVi, titleVi, p1Vi, p2Vi)`.
  - Refactored `updateHomepageHero` and `updateHomepageStory` to check for `undefined` arguments instead of forcing all fields to write `null`, preventing the AI from accidentally overwriting existing values when partial updates are executed.
  - Documented the new tools in the assistant's system prompt to allow target changes without requiring image uploads when editing text.

### [2026-06-13] Integrated Multi-Attachment UI and Prevented Base64 Token Bloat
- **Changes**: 
  - Enabled multi-file upload by adding the `multiple` attribute to `#admin-chat-file`.
  - Removed base64/text strings from polluting the user message textbox.
  - Implemented an attachments preview drawer (`#admin-chat-attachments-preview`) with thumbnails for images, file icons for documents, and remove buttons (`×`) to allow reviewing attachments before sending.
  - Modified `sendMessage` in [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js) so that:
    - Images only transmit short ID placeholders (e.g. `[Ảnh đính kèm: ATTACHED_IMAGE_...]`) in the chat history, keeping base64 tokens out of the LLM context. The base64 content is stored in `window.__uploadedImages` and resolved on-demand when tool execution fires.
    - Documents (Word/Excel/CSV) have their parsed text appended to the prompt behind the scenes when sending, keeping the input textbox clear.

### [2026-06-13] Fixed AI Admin Image Upload Resolution
- **Changes**: Refactored the image argument resolution logic in [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js) by using a regex (`/ATTACHED_IMAGE_\d+/`) to scan and extract the exact placeholder ID from any string value in `resolvedArgs`. This guarantees that image placeholders embedded inside brackets or with trailing punctuation (e.g., `[Ảnh đính kèm: ATTACHED_IMAGE_xxxx]`) are correctly resolved into their Base64 data URLs from `window.__uploadedImages` before executing homepage config tools like `updateHomepageHero`, `updateHomepageStory`, etc.

### [2026-06-12] Documented Homepage Story, Fixed sendSpins & Added sendEmail Tool
- **Changes**: Added detailed argument signatures to the system prompt of the admin AI assistant in [ai-chat.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js) for `updateHomepageStory` and other homepage config tools. Added argument fallbacks (`storyImg`, `image`, `imgUrl` -> `imageUrl`) and resolution mechanisms to translate attached chat file IDs into base64 strings so that the assistant can seamlessly handle and update homepage story images.
- **sendSpinsToUser Fix**: Corrected the mapping of spin types (handling Vietnamese/English inputs like "Thường", "Xịn", "VIP", "Normal", "Good"), resolved case sensitivity for email lookups, and properly initialized missing fields on the user document in Firestore to prevent updates from breaking.
- **sendEmail Tool & Resend Key**: Created the `sendEmail(to, subject, html)` tool function in the admin chat backend, registered it in the tool registry, and documented it in the system prompt. Updated the global Resend API key to `re_AmwxgrXs_217ywFo3uCjBc21UTt7QMBo9` and changed the sender email address ("from") to `noreply@phovietkhang.com` inside [worker.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/cloudflare-worker/worker.js) and [paytrail-worker.js](file:///c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/paytrail-worker.js), and synced changes to GitHub folder.

### [2026-06-11] Fixed Admin Area Not Loading Firestore Data
- **Root Cause**: A syntax error was introduced in `js/admin.js` where the `food-add-form` submit handler block header went missing due to an accidental text deletion/comment overwrite, leaving dangling closing brackets (`Uncaught SyntaxError: Unexpected token '}'` at line 1701). Additionally, the `window.deleteFood` function and `btn-clear-menu` handlers were deleted during previous cleanup commits, preventing the admin module script from loading/parsing entirely.
- **Fix in `js/admin.js`**:
  - Restored the wrapper header `const foodAddForm = document.getElementById('food-add-form'); if (foodAddForm) { foodAddForm.addEventListener('submit', async (e) => { ... }) }` around the food adding code block.
  - Re-implemented and restored `window.deleteFood(id)` and the `btn-clear-menu` click handlers inside the `foodTableBody` block.

### [2026-06-11] Fixed Cart Page Not Displaying Added Items
- **Root Cause**: `cart.js` initializes the in-memory cart array at script load time using `cartUid()`, which returns `'guest'` because Firebase Auth hasn't resolved yet. When the user is logged in, items are stored under `phoCart_<uid>` in localStorage, but the cart page loaded from `phoCart_guest` (empty). By the time `onAuthStateChanged` fires and sets `window.currentUserUid`, the cart page had already rendered with the wrong (empty) data.
- **Fix in `js/cart.js`**: Added `window.reloadCart()` function that re-reads cart data from localStorage using the now-correct `cartUid()` (which reflects the authenticated user's UID), updates the in-memory array, refreshes the badge, and re-renders the cart page.
- **Fix in `js/auth.js`**: Replaced the old manual cart migration/reload code with a call to `window.reloadCart()` after setting `window.currentUserUid`. This runs regardless of whether a guest-to-user cart merge occurred, ensuring the cart page always displays the correct items after auth resolves.

### [2026-06-07] Expanded White Container Layouts & Fixed Client AI Assistant
- **Expanded White Frames**: Widened the white containers on the homepage (`index.html`) by replacing `max-w-[1440px] px-4 md:px-12` with `max-w-[96%] px-2 md:px-4` for the Story (Heritage), Signature Creations, and Call to Action sections. This brings the sections closer to the left and right screen borders across all desktop and mobile viewport sizes.
- **Fixed HTML Syntax Errors**: Corrected malformed tags in both local and GitHub versions of `index.html` (the unclosed divider bar tag and the trailing `v>` syntax typo at the end of the CTA section).
- **Fixed Client-side AI Assistant Loader**: Fixed a path resolution bug in `js/client.js` where the dynamic import statement loaded `./firebase-config.js` instead of `./js/firebase-config.js`. This was causing a silent 404 crash on guest-facing HTML pages (which reside at the root level), preventing the floating Messenger-style customer virtual assistant bubble from rendering.

### [2026-06-06] Standardized Admin Headers & Export Excel Buttons
- **Standardized Admin Headers**: Aligned all administrative pages' headers (`admin/index.html`, `admin/food-list.html`, `admin/food-add.html`, `admin/user-manager.html`, `admin/order-manager.html`, `admin/reservations.html`, `admin/feedback.html`) to have a consistent design layout containing notifications icons, the avatar label "A", and aligned button styles.
- **Export to Excel Functionality**: Added an Export Excel button next to data list tables. Users can export raw spreadsheet files for the Recent Orders list (`admin/index.html`), Food Menu list (`admin/food-list.html`), User list (`admin/user-manager.html`), Order list (`admin/order-manager.html`), Reservations list (`admin/reservations.html`), and Messages log list (`admin/messages.html`).
- **Dynamic XLSX Lazy-loader & DOM Cleaner**: Added `window.exportTableToExcel` in `js/admin.js` that dynamically inserts the SheetJS library (`xlsx.full.min.js`) via CDN if not present, clones the target table, and cleans up elements like buttons, input fields, images, and action columns to produce tidy spreadsheet exports.

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

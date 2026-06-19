# Morning Topo UI Redesign — Implementation Plan

> **For agentic workers:** Implement phase by phase. Each phase produces independently testable, shippable UI. Phases 1 is critical path; Phases 2-4 depend on Phase 1 and can run in parallel; Phase 5 depends on Phase 3; Phase 6 is final polish.

**Goal:** Transform GoGear from admin console into warm, precise trip-planning hub with Morning Topo design system.

**Architecture:** CSS custom properties design system → unified shell → page-optimized layouts → mobile checklist. No state management changes. No backend changes.

**Tech Stack:** React 19, TypeScript 6, Vite 8, TanStack Query v5, Zustand v5, React Router v7, vanilla CSS with custom properties.

## Global Constraints

- No new npm dependencies unless explicitly approved
- All colors from Morning Topo palette (see spec section 2)
- No box-shadows — use surface color shifts for depth
- No hero images or decorative whitespace — every pixel functional
- Contour line SVG as repeating motif (data URI in CSS)
- No backend API changes
- All existing pages must remain functional during migration
- Responsive: desktop ≥1024px, tablet 640-1024px, mobile <640px

---

### Phase 1: Design Tokens + App Shell (Foundation)

**Files:**
- Modify: `src/styles/tokens.css` — new palette, typography, spacing, contour pattern
- Modify: `src/index.css` — updated global styles
- Create: `src/styles/contour.css` — contour line SVG pattern
- Modify: `src/ui/AppLayout.tsx` — new Rail + TopBar shell
- Create: `src/ui/Rail.tsx`, `src/ui/Rail.css`
- Create: `src/ui/TopBar.tsx`, `src/ui/TopBar.css`
- Create: `src/ui/AppShell.tsx`, `src/ui/AppShell.css`
- Delete/replace: `src/ui/AppLayout.css`
- Modify: `src/styles/gearCard.css` — update card tokens

**Deliverable:** New shell renders on all pages. Old layout removed. All pages functional with new palette and spacing.

---

### Phase 2: Basecamp + Gear Catalog

**Files:**
- Modify: `src/pages/DashboardPage.tsx`, `src/pages/DashboardPage.css` → BasecampPage
- Create/Modify: `src/components/BasecampTrips.tsx`, `src/components/BasecampStats.tsx`, `src/components/ActivityFeed.tsx`
- Modify: `src/pages/GearPage.tsx`, `src/pages/GearPage.css` → new card grid layout
- Create: `src/components/GearCard.tsx`, `src/components/GearCard.css`
- Create: `src/components/FilterBar.tsx`, `src/components/FilterBar.css` (update)
- Update: `src/router.tsx` — page title metadata

**Deliverable:** Basecamp with trip cards/stats/activity. Gear catalog with compact card grid and filter bar.

---

### Phase 3: Loadout Workspace

**Files:**
- Modify: `src/pages/LoadoutListPage.tsx`, `src/pages/LoadoutListPage.css` — card grid
- Modify: `src/pages/LoadoutDetailPage.tsx`, `src/pages/LoadoutDetailPage.css` → 3-panel workspace
- Create: `src/components/LoadoutWorkspace.tsx`, `src/components/LoadoutWorkspace.css`
- Create: `src/components/CatalogPanel.tsx`, `src/components/CatalogPanel.css`
- Create: `src/components/PackTree.tsx`, `src/components/PackTree.css`
- Create: `src/components/TreeNode.tsx`, `src/components/TreeNode.css`
- Create: `src/components/InspectorPanel.tsx`, `src/components/InspectorPanel.css`
- Create: `src/components/WeightChart.tsx`, `src/components/WeightChart.css`
- Create: `src/store/workspaceStore.ts` — Zustand store for panel state, selections, mode

**Deliverable:** Full 3-panel packing workspace with drag-to-add, recursive tree, weight display, three modes, "used on trip" placeholder.

---

### Phase 4: Admin Pages Refresh

**Files:**
- Create: `src/ui/AdminTable.tsx`, `src/ui/AdminTable.css` — reusable compact data table
- Modify: `src/pages/CategoriesPage.tsx`, `src/pages/CategoriesPage.css`
- Modify: `src/pages/ManufacturersPage.tsx`
- Modify: `src/pages/UsersPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Remove page-specific CSS files where replaced by shared AdminTable styles

**Deliverable:** All admin pages using compact table layout, consistent with Morning Topo look.

---

### Phase 5: Mobile Checklist

**Files:**
- Create: `src/pages/MobileChecklistPage.tsx`, `src/pages/MobileChecklistPage.css`
- Create: `src/components/ProgressBar.tsx`, `src/components/ProgressBar.css`
- Create: `src/components/ContainerAccordion.tsx`, `src/components/ContainerAccordion.css`
- Create: `src/components/ChecklistItemRow.tsx`, `src/components/ChecklistItemRow.css`
- Create: `src/components/AddGearSheet.tsx`, `src/components/AddGearSheet.css`
- Modify: `src/ui/AppShell.tsx` — mobile bottom nav link to active loadout

**Deliverable:** Dedicated mobile checklist page accessible from bottom nav, with progress bar, collapsible container groups, packed toggles, "used on trip" placeholder.

---

### Phase 6: Polish

**Files:**
- All remaining old CSS cleanup
- Responsive audit on all pages
- Contour motif pass (ensure it appears in dividers, backgrounds)
- Adjust spacing/typography inconsistencies
- Accessibility pass (focus outlines, ARIA labels, color contrast)

**Deliverable:** Finalized UI across all breakpoints and pages.

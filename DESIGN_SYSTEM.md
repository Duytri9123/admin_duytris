# Admin Panel — Design System

> File này là nguồn sự thật duy nhất cho toàn bộ UI Admin.
> Mọi component mới **phải** tuân theo các quy tắc dưới đây.

---

## 1. Color Tokens

```
Background:   #0f172a  (sidebar, dark areas)
Surface:      #1e293b  (sidebar hover, cards dark)
Border dark:  #334155  (dividers in dark areas)

Page bg:      #f8fafc  (main content area)
Card bg:      #ffffff
Border light: #e2e8f0

Primary:      #6366f1  (indigo-500) — active states, buttons
Primary hover:#4f46e5  (indigo-600)
Primary light:#eef2ff  (indigo-50)  — active bg in sidebar

Text primary: #0f172a  (slate-900)
Text secondary:#64748b (slate-500)
Text muted:   #94a3b8  (slate-400)
Text on dark: #f1f5f9  (slate-100)
Text muted dark:#94a3b8

Success:      #10b981  (emerald-500)
Warning:      #f59e0b  (amber-500)
Danger:       #ef4444  (red-500)
Info:         #3b82f6  (blue-500)
```

---

## 2. Typography

```
Font: system-ui / Inter (fallback)
Sizes:
  xs:   12px / text-xs
  sm:   13px / text-sm
  base: 14px / text-sm (default body)
  md:   16px / text-base
  lg:   18px / text-lg
  xl:   20px / text-xl
  2xl:  24px / text-2xl

Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
```

---

## 3. Spacing Scale

```
Sidebar width (expanded): 240px  → w-60
Sidebar width (collapsed): 64px  → w-16
Header height: 56px              → h-14
Content padding: 24px            → p-6
Card padding: 20px               → p-5
Gap between items: 16px          → gap-4
```

---

## 4. Component Patterns

### Button
```tsx
// Primary
<button className="btn-primary">...</button>
// → bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700

// Secondary
<button className="btn-secondary">...</button>
// → bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50

// Danger
<button className="btn-danger">...</button>
// → bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700

// Icon button (tooltip)
<button className="icon-btn">...</button>
// → p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors
```

### Input
```tsx
<input className="admin-input" />
// → w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
//   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
```

### Card
```tsx
<div className="admin-card">...</div>
// → bg-white rounded-xl border border-gray-200 shadow-sm p-5
```

### Badge
```tsx
<span className="badge-success">Active</span>
// → inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
//   success: bg-emerald-50 text-emerald-700
//   warning: bg-amber-50 text-amber-700
//   danger:  bg-red-50 text-red-700
//   info:    bg-blue-50 text-blue-700
//   default: bg-gray-100 text-gray-600
```

### Toggle
```tsx
<Toggle checked={val} onChange={fn} />
// → Dùng component Toggle từ @/components/ui/toggle
```

### Tooltip
```tsx
<Tooltip content="Nội dung tooltip">
  <button>...</button>
</Tooltip>
// → Dùng component Tooltip từ @/components/ui/tooltip
```

---

## 5. Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (w-60 | w-16 collapsed)                    │
│  ┌──────────────────────────────────────────────┐   │
│  │ Logo / Site name                             │   │
│  │ [Toggle collapse button]                     │   │
│  ├──────────────────────────────────────────────┤   │
│  │ Nav items (icon + label + tooltip collapsed) │   │
│  ├──────────────────────────────────────────────┤   │
│  │ User avatar + name (bottom)                  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  MAIN AREA                                          │
│  ┌──────────────────────────────────────────────┐   │
│  │ HEADER (h-14)                                │   │
│  │ [Hamburger] [Search] ... [Notif] [User menu] │   │
│  ├──────────────────────────────────────────────┤   │
│  │ CONTENT                                      │   │
│  │ Breadcrumb                                   │   │
│  │ Page content                                 │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 6. Sidebar Nav Item States

```
Default:  text-slate-400, transparent bg
Hover:    text-slate-100, bg-slate-800
Active:   text-white, bg-indigo-600, rounded-lg
Collapsed: show icon only + tooltip on hover
```

---

## 7. Notification / Toast

```
Position: top-right, fixed
Types: success (green), error (red), warning (amber), info (blue)
Duration: 3000ms auto-dismiss
Animation: slide-in from right
```

---

## 8. Responsive Breakpoints

```
Mobile  (<768px):  sidebar hidden, hamburger menu → drawer overlay
Tablet  (768-1024): sidebar collapsed (icons only)
Desktop (>1024px):  sidebar expanded (icons + labels)
```

---

## 9. File Structure Convention

```
Admin/
├── components/
│   ├── layout/
│   │   ├── admin-sidebar.tsx      ← Sidebar container
│   │   ├── sidebar-nav-item.tsx   ← Single nav item
│   │   ├── sidebar-logo.tsx       ← Logo area
│   │   ├── admin-header.tsx       ← Header container
│   │   ├── header-search.tsx      ← Search bar
│   │   ├── header-notifications.tsx ← Notification bell
│   │   ├── header-user-menu.tsx   ← User dropdown
│   │   └── breadcrumb.tsx         ← Breadcrumb
│   ├── ui/
│   │   ├── tooltip.tsx            ← Reusable tooltip
│   │   ├── toggle.tsx             ← Toggle switch
│   │   ├── badge.tsx              ← Status badge
│   │   ├── toast.tsx              ← Toast notification
│   │   └── modal.tsx              ← Modal dialog
│   └── settings/
│       ├── settings-client.tsx    ← Settings page shell
│       ├── tab-general.tsx        ← General settings tab
│       ├── tab-appearance.tsx     ← Appearance tab
│       ├── tab-admin.tsx          ← Admin config tab  ← NEW
│       ├── tab-social.tsx         ← Social tab
│       └── tab-seo.tsx            ← SEO tab
├── hooks/
│   ├── use-auth.ts
│   ├── use-sidebar.ts             ← Sidebar collapse state
│   └── use-toast.ts               ← Toast state
├── stores/
│   └── sidebar-store.ts           ← Zustand sidebar state
└── DESIGN_SYSTEM.md               ← This file
```

---

## 10. Naming Conventions

- Components: PascalCase, file = kebab-case
- Hooks: `use-` prefix, camelCase
- Stores: `*-store.ts`
- Types: PascalCase interfaces in `types/index.ts`
- CSS classes: Tailwind only, no custom CSS unless absolutely necessary
- Icons: Lucide React only

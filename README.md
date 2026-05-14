# User Dashboard

An Angular **user administration dashboard** with a responsive data table, **Chart.js** role analytics, and a **lazy-loaded** modal form for adding users. State is driven by **RxJS** so the table and chart stay in sync when the directory changes.

## Features

- **User directory** — sortable-style table with Name, Email, and Role (Admin, Editor, Viewer).
- **Role distribution** — pie chart for Admin / Editor / Viewer counts; updates when users are added.
- **Add User** — opens a validated modal; **UserForm** is loaded on demand (separate bundle) via an NgModule + dynamic `import()`.
- **Performance** — **Chart.js** is loaded lazily through a small loader service; the dashboard route is lazy-loaded from the app shell.
- **Table UX** — text filter (name, email, role), page size (5 / 10 / 20), and pagination.
- **Theming** — dark UI using `#383838` and `#1c4980`, with 48px-tall primary actions and inputs.

## Technology stack

| Area | Technology |
|------|----------------|
| Framework | [Angular](https://angular.io/) 17 (standalone shell, feature NgModule for the form) |
| Language | TypeScript |
| Styling | SCSS |
| Charts | [Chart.js](https://www.chartjs.org/) 4 (dynamic `import('chart.js/auto')`) |
| State & async | [RxJS](https://rxjs.dev/) (`BehaviorSubject`, `combineLatest`, `shareReplay`, etc.) |
| Forms | Angular Reactive Forms (validation, duplicate email guard) |
| Tooling | Angular CLI, Karma / Jasmine for unit tests |
| Hosting (optional) | [GitHub Pages](https://pages.github.com/) via GitHub Actions (see `.github/workflows/github-pages.yml`) |

## Project structure (high level)

- `src/app/features/user-dashboard/` — dashboard shell: table, chart host, modal host, filters.
- `src/app/features/user-form/` — lazy **UserFormModule** / **UserFormComponent** (add-user dialog).
- `src/app/core/services/user.service.ts` — user list, filtering, pagination, role counts.
- `src/app/core/services/chart-loader.service.ts` — single-flight lazy load of Chart.js.

## Getting started

### Prerequisites

- Node.js (LTS recommended; matches the version you use for Angular 17 locally)
- npm

### Install

```bash
npm install
```

### Development server

```bash
npm start
```

Then open `http://localhost:4200/`. The app reloads when you change source files.

### Production build

```bash
npm run build
```

Output is under `dist/user-dashboard/` (browser bundle under `dist/user-dashboard/browser`).

### GitHub Pages build (subpath)

If the site is served from `https://<user>.github.io/<repo>/`, use:

```bash
npm run build:github-pages
```

Ensure `angular.json` → `configurations.github-pages.baseHref` matches your repository name segment.

### Unit tests

```bash
npm test
```

## Code scaffolding

Generate new pieces with Angular CLI, for example:

```bash
ng generate component features/example/example-name
```

See `ng generate --help` for directives, pipes, services, and more.

## Further reading

- [Angular documentation](https://angular.dev/)
- [Angular CLI reference](https://angular.dev/tools/cli)

---

**Made by Syed Aman Rukhsar**

# Frontend Conventions

> Canonical rule set for the patient-tracker frontend.
> Every rule here is a **hard requirement**, not a suggestion.
> Update this file when a new rule is introduced; do not duplicate rules in code comments.

---

## 1. File Naming

- **All file names use kebab-case**: `se-card.tsx`, `use-router.ts`, `med-log-card.tsx`.
- React component files export a PascalCase component — the file name and the component name are intentionally different: `se-card.tsx` exports `const SECard`.
- Directories also use kebab-case: `routes/side-effects/`, `components/se-wizard/`.
- React Router URLs may still contain route parameters such as `/assessment/:patientScaleId`; the filesystem module path stays kebab-case.

---

## 2. Component Authoring

### 2.1 One component per file

Never define two functional components in the same file. If a sub-component is needed:

```
routes/side-effects/
  index.tsx                   ← route entry: SideEffectsPage
  components/
    se-card.tsx                ← sub-component: SECard
```

### 2.2 Arrow functions with React.FC

Components must be arrow functions typed with `React.FC<Props>`:

```ts
// ✅ correct
const SECard: React.FC<Props> = (props) => {
  return <div>{props.se.name_ru}</div>;
};

// ❌ forbidden
function SECard({ se }: Props) { ... }
```

### 2.3 Props type naming

- Use `type`, never `interface`.
- If the Props type is not re-exported outside the file, name it simply `Props` (no component-name prefix).
- If re-used across files, add a descriptive prefix and export it.

```ts
// ✅ local props
type Props = { se: PatientSideEffectOut };

// ✅ shared props (exported)
export type SECardProps = { se: PatientSideEffectOut };

// ❌ always forbidden
interface Props { ... }
```

### 2.4 No destructuring in components

Props must always be accessed via `props.<name>`, not destructured in the function signature or body.

```ts
// ✅ correct
const SECard: React.FC<Props> = (props) => {
  return <span>{props.se.name_ru}</span>;
};

// ❌ forbidden
const SECard: React.FC<Props> = ({ se }) => { ... }
```

### 2.5 No destructuring of hook return values

When a hook returns an object, assign to a single variable and access via dot notation:

```ts
// ✅ correct
const sideEffectsQuery = useMySideEffects();
const data = sideEffectsQuery.data ?? [];
const isLoading = sideEffectsQuery.isLoading;

// ❌ forbidden
const { data = [], isLoading } = useMySideEffects();
```

Array destructuring from `useState` is the one exception (standard React pattern):

```ts
// ✅ allowed — useState returns a tuple, not an object
const [step, setStep] = useState(0);
```

### 2.6 No inline JSX variable assignments

Don't create components by assigning JSX to a variable inside another component.
Extract them into standalone files:

```ts
// ❌ forbidden
const sidebar = <aside>...</aside>;

// ✅ correct — extract to components/sidebar.tsx
import { Sidebar } from './components/sidebar';
```

### 2.7 useEffect naming convention

Every `useEffect` callback must be a **named function** with the `Fx` postfix.
This makes call stacks readable and lets you identify the purpose at a glance.

```ts
// ✅ correct
useEffect(function redirectToLoginFx() {
  if (!token) navigate('/login', { replace: true });
}, [navigate, token]);

// ❌ forbidden
useEffect(() => {
  if (!token) navigate('/login', { replace: true });
}, [navigate, token]);
```

---

## 3. Module Structure

Organise each route / feature / page module as follows (create only the sub-directories that are needed):

```
routes/myRoute/
  index.tsx          ← route entry component
  myRoute.types.ts   ← namespace ModuleNameTypes { … } for shared module types
  api/               ← React Query hooks and fetchers used only in this module
  components/        ← sub-components (one per file, kebab-case)
  constants/         ← static configs, label maps, magic values
  context/           ← React context and providers
  hooks/             ← custom hooks grouped by domain
  utils/             ← pure helper functions
```

Types that are used **across multiple modules** belong in:
- `shared/types/` for global API/schema types
- `entities/<name>/` for domain entity types

### 3.1 Namespaced module types

Module-level types that are reused within the module but not exported go into `myRoute.types.ts`:

```ts
// routes/assessment/assessment.types.ts
export namespace AssessmentTypes {
  export type Answer = { question_id: number; value: number };
  export type WizardState = { step: number; answers: Answer[] };
}
```

Consume via dot notation: `AssessmentTypes.Answer`.

---

## 4. Custom Hooks

### 4.1 Location

- Hooks used only within one module: `<module>/hooks/use-xxx.ts`.
- Hooks used across multiple modules: `shared/hooks/use-xxx.ts`.

### 4.2 No destructuring in hook params

Hook parameters are accessed via `params.<name>`:

```ts
// ✅ correct
function useEmailForm(params: { currentEmail: string | null }) {
  const email = useState(params.currentEmail ?? '');
  ...
}

// ❌ forbidden
function useEmailForm({ currentEmail }: { currentEmail: string | null }) { ... }
```

---

## 5. Routing

### 5.1 useRouter — single routing entry point

**Never import `useParams`, `useNavigate`, `useLocation`, or `useMatches` directly.**
Always use the project's unified `useRouter` hook from `shared/hooks/use-router`:

```ts
import { useRouter } from '@shared/hooks/use-router';

const router = useRouter();
// access: router.params.patientScaleId
// navigate: router.navigate('/tests')
// location: router.location.pathname
```

The hook wraps all React Router routing primitives into a single type-safe object.

### 5.2 useTypedSearchParams — typed search params

**Never use the raw `useSearchParams` from `react-router` directly.**
Always use the project's `useTypedSearchParams` from `shared/hooks/use-typed-search-params`:

```ts
import { useTypedSearchParams } from '@shared/hooks/use-typed-search-params';
import { z } from 'zod';

const schema = z.object({ tab: z.enum(['overview', 'history']).default('overview') });

const searchParams = useTypedSearchParams(schema);
searchParams.get('tab');          // 'overview' | 'history'
searchParams.set('tab', 'history');
searchParams.remove('tab');
```

This enforces type safety and zod validation at the URL boundary.

---

## 6. Storage, JSON, and Env

### 6.1 Never access `window.localStorage` directly

Always use `safeLs` from `@shared/lib/safe-ls`:

```ts
// ✅ correct
import { safeLs } from '@shared/lib/safe-ls';
safeLs.get(MY_KEY);

// ❌ forbidden
window.localStorage.getItem('key');
localStorage.setItem('key', value);
```

**Why:** raw localStorage throws on SSR, hides deserialization errors, and lacks versioning.

### 6.2 Never use `JSON.parse` or `JSON.stringify` for storage

Use `safeJson` from `@shared/lib/safe-json`:

```ts
// ✅ correct
import { safeJson } from '@shared/lib/safe-json';
safeJson.parse(raw, isMyType);

// ❌ forbidden
JSON.parse(raw);
```

**Exceptions:** `JSON.stringify` in HTTP request bodies (e.g. `fetch` body serialization) is
permitted — it is not storage. Add a comment explaining the exception: `// HTTP body — not storage`.

### 6.3 Never read `import.meta.env` directly

Use the typed wrappers from `@shared/config/env` (client/server env) and `@shared/config/runtime`
(SSR/dev/prod flags):

```ts
// ✅ correct
import { env } from '@shared/config/env';
const url = env.client.apiBaseUrl;

// ❌ forbidden
const url = import.meta.env.VITE_API_BASE_URL;
```

`env.ts` and `runtime.ts` are the **only** files allowed to read `import.meta.env`.

---

## 7. Date Formatting

**Never inline `new Date(...)`, `Intl.DateTimeFormat(...)`, or `toLocaleDateString` calls in components.**
Use helpers from `@shared/lib/date`:

```ts
import { date } from '@shared/lib/date';

date.formatDateRu(new Date());          // "пятница, 23 мая 2025"
date.todayLabelRu();                    // "Пятница, 23 мая 2025"
date.formatMonthShortRu('2025-01-15'); // "15 янв."
date.todayIso();                        // "2025-05-23"
```

---

## 8. Types

- Use `type`, never `interface`, for all type aliases.
- Export only what is consumed outside the file.
- Generic API/schema types come from `@shared/types/schema` (generated by `pnpm generate:api`).
  Never hand-write types that duplicate generated schema types.

---

## 9. Testing

### 9.1 Tests are mandatory for all new functionality

Writing tests is **not optional** — it is a required step of the development workflow, on par with implementing the feature itself. Every new route, component, hook, or utility must ship with appropriate test coverage.

| What you build | Test type | Location | Command |
|----------------|-----------|----------|---------|
| Pure-logic utility (date, math, parse) | Vitest unit | `frontend/tests/*.test.ts` | `pnpm test` |
| Service / API client logic | Vitest unit | `frontend/tests/*.test.ts` | `pnpm test` |
| Custom hook with side-effects | Vitest unit | `frontend/tests/*.test.ts` | `pnpm test` |
| New route / page (browser behaviour) | Playwright e2e | `frontend/tests/e2e/phase-XX-smoke.spec.ts` | `pnpm test:e2e` |

Add the gate check `pnpm test` (Vitest) and `pnpm test:e2e` (Playwright) to every phase's Gate Checks. Both must be green before committing.

### 9.2 E2E tests run locally — not inside Docker

E2E tests use Playwright against the locally served stack (`http://localhost:3000` / `http://localhost:8000`). They are **not** run inside a Docker container. Playwright is executed on the host with the `chromium` project only; Firefox and WebKit are not part of the local gate and must not be added back without an explicit phase decision.

Start the full Docker app stack first, then run Playwright from the host:

```bash
docker compose up --build
cd frontend && pnpm test:e2e
```

Do not add E2E tests to Docker Compose services. The Playwright config (`playwright.config.ts`) reads `PLAYWRIGHT_BASE_URL` and `BACKEND_URL` env vars; the defaults point to localhost.

### 9.3 Unit test conventions

- Use **Vitest** (`vitest run`) for all unit tests.
- Test files live in `frontend/tests/` and follow the `*.test.ts` naming convention.
- Use `vi.stubGlobal` / `vi.unstubAllGlobals` in `beforeEach` / `afterEach` to isolate globals (`window`, `fetch`, etc.).
- Use `vi.useFakeTimers()` + `vi.setSystemTime()` for any code that calls `new Date()` — always restore with `vi.useRealTimers()` in `afterEach`.
- Avoid testing implementation details; test observable behaviour (return values, thrown errors, side-effects on stubs).

### 9.4 E2E test conventions

- One spec file per phase: `phase-XX-smoke.spec.ts`.
- Seed auth state via `page.addInitScript` (write the versioned localStorage envelope); do not drive the login UI.
- Create test data via direct API calls in `beforeAll`; use a unique email/timestamp per test run to avoid conflicts.
- Target user-visible text or ARIA roles (`getByRole`, `getByText`) rather than CSS selectors or `data-testid` attributes.

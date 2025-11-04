# Pragmatic Refactoring Proposal - Memberstack Legacy Adapter

## Executive Summary

This library is a **temporary migration shim** (~500 lines) that wraps Memberstack V1/V2 APIs. The current code is functional but could benefit from **targeted improvements** to increase testability and maintainability without over-engineering.

**Estimated effort:** 1-2 days
**Goal:** Make core logic testable, improve type safety, keep it simple

---

## Current State Analysis

### What Works Well ✅
- Clear entry point (`main.ts`)
- Separated concerns (loader, adapter, dom transformers)
- Already has some tests
- Simple, readable code

### Pain Points 🔴
- Version selection logic mixed with browser APIs (hard to test)
- Plan ID mapping logic coupled to DOM manipulation
- No type safety for plan IDs (strings everywhere)
- Main orchestration hard to follow
- Hard to test without full browser environment

---

## Proposed Changes

### Principle: **Extract, Don't Rebuild**

We'll extract testable pure functions and add minimal abstractions while keeping the current structure mostly intact.

---

## 1. Directory Structure

### Before:
```
src/
├── main.ts                    # 126 lines - orchestration + logic mixed
├── config.ts
├── loader/
│   └── detect-ms-version.ts   # Has browser deps
├── adapter/
│   ├── index.ts
│   ├── v1-api.ts
│   ├── build-v2-bridge.ts
│   ├── v2-object-map.ts
│   ├── version-flag.ts
│   └── dom/                   # 14 transformer files
├── types/
├── utils/
│   ├── logger.ts
│   ├── sessions.ts
│   └── enums.ts
└── vendor/
```

### After:
```
src/
├── core/                           # NEW: Pure logic (no browser deps)
│   ├── version-selection.ts        # Pure function
│   ├── plan-mapping.ts             # Pure function
│   ├── value-objects/              # NEW: Type safety
│   │   ├── PlanId.ts
│   │   ├── MemberstackVersion.ts
│   │   └── PlanMapping.ts
│   └── types.ts                    # Shared pure types
│
├── adapters/                       # Renamed from adapter/
│   ├── api/
│   │   ├── v1-proxy.ts            # Renamed from index.ts
│   │   ├── v1-api-surface.ts      # Renamed from v1-api.ts
│   │   └── v2-to-v1-bridge.ts     # Renamed from build-v2-bridge.ts
│   ├── dom/                        # Keep existing transformers
│   │   ├── plan-attributes.ts      # Refactored to use core/
│   │   ├── member-attributes.ts
│   │   └── [other transformers]
│   └── storage.ts                  # NEW: Wrapper for localStorage
│
├── infrastructure/
│   ├── script-loader.ts            # Loads V1/V2 vendor scripts
│   ├── logger.ts                   # Keep existing
│   └── config-loader.ts            # Extract from config.ts
│
├── orchestration/                  # NEW: Clear separation
│   └── initialize-adapter.ts       # Main flow extracted from main.ts
│
├── main.ts                         # Slim entry point (20 lines)
├── config.ts                       # Keep as-is
├── types/                          # Keep existing
└── vendor/                         # Keep as-is
```

---

## 2. Core Refactorings

### 2.1 Extract Version Selection (Pure Function)

**Current:** `src/loader/detect-ms-version.ts`
```typescript
// ❌ Tightly coupled to browser APIs
export function shouldUseAdapter(config: AdapterConfig): "v1" | "v2" {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAdapterParam = urlParams.get('adapter');
    const isAdapterEnabled = sessionStorage.getItem('ms2_enabled');
    // ... logic mixed with browser APIs
}
```

**Proposed:** `src/core/version-selection.ts`
```typescript
// ✅ Pure function - testable without browser
export type VersionSelectionCriteria = {
  forcedVersion?: MemberstackVersion;
  queryParam?: string | null;
  sessionFlag?: string | null;
};

export function selectVersion(criteria: VersionSelectionCriteria): MemberstackVersion {
  // Priority 1: Forced version from config
  if (criteria.forcedVersion) {
    return criteria.forcedVersion;
  }

  // Priority 2: Query parameter (?adapter=v2 or ?adapter=true)
  if (criteria.queryParam === 'v2' || criteria.queryParam === 'true') {
    return MemberstackVersion.V2;
  }

  // Priority 3: Session storage flag
  if (criteria.sessionFlag === 'true') {
    return MemberstackVersion.V2;
  }

  // Default: V1
  return MemberstackVersion.V1;
}
```

**Usage:**
```typescript
// In adapter code (browser-dependent layer)
import { selectVersion } from '@/core/version-selection';

const version = selectVersion({
  forcedVersion: config.adapter.forcedVersion,
  queryParam: new URLSearchParams(window.location.search).get('adapter'),
  sessionFlag: sessionStorage.getItem('ms2_enabled')
});
```

**Tests:**
```typescript
describe('selectVersion', () => {
  it('prioritizes forced version over all else', () => {
    const result = selectVersion({
      forcedVersion: MemberstackVersion.V1,
      queryParam: 'v2',
      sessionFlag: 'true'
    });
    expect(result).toBe(MemberstackVersion.V1);
  });

  it('uses query param when no forced version', () => {
    const result = selectVersion({
      queryParam: 'v2'
    });
    expect(result).toBe(MemberstackVersion.V2);
  });

  it('defaults to V1 when nothing provided', () => {
    const result = selectVersion({});
    expect(result).toBe(MemberstackVersion.V1);
  });
});
```

---

### 2.2 Extract Plan Mapping (Pure Function)

**Current:** Logic scattered across DOM transformers
```typescript
// ❌ Duplicated everywhere, no type safety
element.getAttribute('data-ms-plan');
const mapping = importedMemberships.find(m => m.oldId === oldId);
if (mapping.newId.startsWith('prc_')) {
  // ... attribute logic
}
```

**Proposed:** `src/core/plan-mapping.ts`
```typescript
import { PlanId } from './value-objects/PlanId';
import { PlanMapping } from './value-objects/PlanMapping';

export type PlanMappingResult = {
  v2Id: PlanId;
  attributeName: 'data-ms-plan:add' | 'data-ms-price:update';
  planName: string;
};

/**
 * Maps a V1 plan ID to V2 plan/price ID
 * Pure function - no side effects, fully testable
 */
export function mapV1ToV2(
  v1Id: string,
  mappings: PlanMapping[]
): PlanMappingResult | null {
  const mapping = mappings.find(m => m.oldId === v1Id);

  if (!mapping) {
    return null;
  }

  const v2Id = new PlanId(mapping.newId);

  return {
    v2Id,
    attributeName: v2Id.isPrice() ? 'data-ms-price:update' : 'data-ms-plan:add',
    planName: mapping.name
  };
}

/**
 * Maps a V2 plan ID back to V1 (for reverse lookups)
 */
export function mapV2ToV1(
  v2Id: string,
  mappings: PlanMapping[]
): string | null {
  const mapping = mappings.find(m => m.newId === v2Id);
  return mapping?.oldId ?? null;
}

/**
 * Get all plan mappings as a lookup table
 */
export function createPlanLookup(
  mappings: PlanMapping[]
): Map<string, PlanMappingResult> {
  const lookup = new Map<string, PlanMappingResult>();

  for (const mapping of mappings) {
    const result = mapV1ToV2(mapping.oldId, mappings);
    if (result) {
      lookup.set(mapping.oldId, result);
    }
  }

  return lookup;
}
```

**Tests:**
```typescript
describe('mapV1ToV2', () => {
  const mappings: PlanMapping[] = [
    { name: 'Free', oldId: 'mem_123', newId: 'pln_456' },
    { name: 'Pro', oldId: 'mem_789', newId: 'prc_999' }
  ];

  it('maps plan ID to plan attribute', () => {
    const result = mapV1ToV2('mem_123', mappings);
    expect(result?.v2Id.value).toBe('pln_456');
    expect(result?.attributeName).toBe('data-ms-plan:add');
    expect(result?.planName).toBe('Free');
  });

  it('maps price ID to price attribute', () => {
    const result = mapV1ToV2('mem_789', mappings);
    expect(result?.v2Id.value).toBe('prc_999');
    expect(result?.attributeName).toBe('data-ms-price:update');
  });

  it('returns null for unknown ID', () => {
    const result = mapV1ToV2('unknown', mappings);
    expect(result).toBeNull();
  });
});
```

---

### 2.3 Value Objects for Type Safety

#### **PlanId** - Encapsulate plan/price logic

**File:** `src/core/value-objects/PlanId.ts`
```typescript
/**
 * Value Object for Plan/Price IDs
 * Ensures valid IDs and provides type checking
 */
export class PlanId {
  private static readonly PRICE_PREFIX = 'prc_';
  private static readonly PLAN_PREFIX = 'pln_';
  private static readonly MEMBERSHIP_PREFIX = 'mem_';

  constructor(public readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('PlanId cannot be empty');
    }
  }

  /**
   * Check if this is a price ID (starts with 'prc_')
   */
  isPrice(): boolean {
    return this.value.startsWith(PlanId.PRICE_PREFIX);
  }

  /**
   * Check if this is a plan ID (starts with 'pln_')
   */
  isPlan(): boolean {
    return this.value.startsWith(PlanId.PLAN_PREFIX);
  }

  /**
   * Check if this is a legacy membership ID (starts with 'mem_')
   */
  isMembership(): boolean {
    return this.value.startsWith(PlanId.MEMBERSHIP_PREFIX);
  }

  /**
   * Get the appropriate DOM attribute name for this ID
   */
  getAttributeName(): 'data-ms-plan:add' | 'data-ms-price:update' {
    return this.isPrice() ? 'data-ms-price:update' : 'data-ms-plan:add';
  }

  equals(other: PlanId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

**Tests:**
```typescript
describe('PlanId', () => {
  it('identifies price IDs correctly', () => {
    const id = new PlanId('prc_123');
    expect(id.isPrice()).toBe(true);
    expect(id.isPlan()).toBe(false);
    expect(id.getAttributeName()).toBe('data-ms-price:update');
  });

  it('identifies plan IDs correctly', () => {
    const id = new PlanId('pln_456');
    expect(id.isPlan()).toBe(true);
    expect(id.isPrice()).toBe(false);
    expect(id.getAttributeName()).toBe('data-ms-plan:add');
  });

  it('throws error for empty ID', () => {
    expect(() => new PlanId('')).toThrow('PlanId cannot be empty');
  });

  it('checks equality correctly', () => {
    const id1 = new PlanId('pln_123');
    const id2 = new PlanId('pln_123');
    const id3 = new PlanId('pln_456');

    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });
});
```

---

#### **MemberstackVersion** - Type-safe version enum

**File:** `src/core/value-objects/MemberstackVersion.ts`
```typescript
/**
 * Value Object for Memberstack version
 * Replaces string literals 'v1' | 'v2' with type-safe enum
 */
export class MemberstackVersion {
  private static readonly V1_VALUE = 'v1' as const;
  private static readonly V2_VALUE = 'v2' as const;

  public static readonly V1 = new MemberstackVersion(MemberstackVersion.V1_VALUE);
  public static readonly V2 = new MemberstackVersion(MemberstackVersion.V2_VALUE);

  private constructor(private readonly value: 'v1' | 'v2') {
    Object.freeze(this);
  }

  static fromString(value: string): MemberstackVersion {
    if (value === 'v1') return MemberstackVersion.V1;
    if (value === 'v2') return MemberstackVersion.V2;
    throw new Error(`Invalid MemberstackVersion: ${value}`);
  }

  isV1(): boolean {
    return this === MemberstackVersion.V1;
  }

  isV2(): boolean {
    return this === MemberstackVersion.V2;
  }

  toString(): string {
    return this.value;
  }

  equals(other: MemberstackVersion): boolean {
    return this.value === other.value;
  }
}
```

**Usage:**
```typescript
// Before: string literals everywhere
const version: 'v1' | 'v2' = 'v2';
if (version === 'v2') { }

// After: type-safe enum
const version = MemberstackVersion.V2;
if (version.isV2()) { }
```

---

#### **PlanMapping** - Structured mapping type

**File:** `src/core/value-objects/PlanMapping.ts`
```typescript
/**
 * Value Object for plan ID mappings
 * Encapsulates V1→V2 mapping data
 */
export class PlanMapping {
  constructor(
    public readonly name: string,
    public readonly oldId: string,
    public readonly newId: string
  ) {
    if (!name || !oldId || !newId) {
      throw new Error('PlanMapping requires name, oldId, and newId');
    }
  }

  static fromConfig(config: { name: string; oldId: string; newId: string }): PlanMapping {
    return new PlanMapping(config.name, config.oldId, config.newId);
  }

  getV2Id(): PlanId {
    return new PlanId(this.newId);
  }

  getV1Id(): string {
    return this.oldId;
  }

  toString(): string {
    return `${this.name}: ${this.oldId} → ${this.newId}`;
  }
}
```

---

### 2.4 Refactor DOM Transformers to Use Core Logic

**Before:** `src/adapter/dom/replacePlanAttributes.ts`
```typescript
// ❌ Duplicated logic, no reusability
export const updateAllPlanAttributes = (importedMemberships: MembershipsMap[]) => {
    const elements = document.querySelectorAll('[data-ms-plan]');
    elements.forEach(element => {
        const oldId = element.getAttribute('data-ms-plan');
        const membership = importedMemberships.find(m => m.oldId === oldId);
        if (membership) {
            element.removeAttribute('data-ms-plan');
            if (membership.newId.startsWith('prc_')) {
                element.setAttribute('data-ms-price:update', membership.newId);
            } else {
                element.setAttribute('data-ms-plan:add', membership.newId);
            }
        }
    });
};
```

**After:** `src/adapters/dom/plan-attributes.ts`
```typescript
import { mapV1ToV2 } from '@/core/plan-mapping';
import { PlanMapping } from '@/core/value-objects/PlanMapping';
import { logger } from '@/infrastructure/logger';

/**
 * Transforms data-ms-plan attributes from V1 to V2 format
 * Uses core logic for mapping, handles DOM manipulation here
 */
export function transformPlanAttributes(
  document: Document,
  mappings: PlanMapping[]
): number {
  let transformCount = 0;

  // Handle data-ms-plan attributes
  const planElements = document.querySelectorAll('[data-ms-plan]');

  for (const element of Array.from(planElements)) {
    const v1Id = element.getAttribute('data-ms-plan');
    if (!v1Id) continue;

    // Use pure core logic
    const mapping = mapV1ToV2(v1Id, mappings);

    if (!mapping) {
      logger.warn(`No mapping found for plan ID: ${v1Id}`);
      continue;
    }

    // Apply DOM changes
    element.removeAttribute('data-ms-plan');
    element.setAttribute(mapping.attributeName, mapping.v2Id.value);

    transformCount++;
    logger.debug(`Transformed: ${v1Id} → ${mapping.v2Id.value}`);
  }

  // Handle data-ms-membership attributes (similar logic)
  const membershipElements = document.querySelectorAll('[data-ms-membership]');

  for (const element of Array.from(membershipElements)) {
    const v1Id = element.getAttribute('data-ms-membership');
    if (!v1Id) continue;

    const mapping = mapV1ToV2(v1Id, mappings);

    if (!mapping) {
      logger.warn(`No mapping found for membership ID: ${v1Id}`);
      continue;
    }

    element.removeAttribute('data-ms-membership');
    element.setAttribute(mapping.attributeName, mapping.v2Id.value);

    transformCount++;
  }

  logger.info(`Transformed ${transformCount} plan/membership attributes`);
  return transformCount;
}
```

**Benefits:**
- ✅ Core mapping logic is pure and testable
- ✅ DOM manipulation separated from business logic
- ✅ Type-safe with value objects
- ✅ Better error handling and logging
- ✅ Easy to test with jsdom

---

### 2.5 Extract Orchestration Logic

**Current:** `src/main.ts` (126 lines of mixed logic)

**Proposed:** `src/orchestration/initialize-adapter.ts`
```typescript
import { selectVersion } from '@/core/version-selection';
import { MemberstackVersion } from '@/core/value-objects/MemberstackVersion';
import { PlanMapping } from '@/core/value-objects/PlanMapping';
import { transformPlanAttributes } from '@/adapters/dom/plan-attributes';
import { transformMemberAttributes } from '@/adapters/dom/member-attributes';
import { transformHashUrls } from '@/adapters/dom/hash-urls';
import { createV1Proxy } from '@/adapters/api/v1-proxy';
import { loadScript } from '@/infrastructure/script-loader';
import { createVersionIndicator } from '@/adapters/version-indicator';
import { clearV1Session } from '@/adapters/storage';
import { logger } from '@/infrastructure/logger';
import type { AdapterConfig } from '@/config';

/**
 * Main orchestration logic for adapter initialization
 * Extracted from main.ts for better testability and readability
 */
export async function initializeAdapter(config: AdapterConfig): Promise<void> {
  logger.info('[Adapter] Starting initialization...');

  // Step 1: Version selection (pure logic)
  const version = selectVersion({
    forcedVersion: config.adapter.forcedVersion,
    queryParam: new URLSearchParams(window.location.search).get('adapter'),
    sessionFlag: sessionStorage.getItem('ms2_enabled')
  });

  logger.info(`[Adapter] Selected version: ${version.toString()}`);

  // Step 2: Show version indicator
  if (config.adapter.showVersion) {
    createVersionIndicator(document, version);
  }

  // Step 3: Handle V1 or V2 flow
  if (version.isV2()) {
    await initializeV2Flow(config);
  } else {
    await initializeV1Flow(config);
  }

  logger.info('[Adapter] Initialization complete');
}

/**
 * V2 initialization flow
 */
async function initializeV2Flow(config: AdapterConfig): Promise<void> {
  // Clear V1 session data
  clearV1Session();

  // Setup onReady promise before loading V2
  setupOnReadyPromise();

  // Convert plan mappings to value objects
  const planMappings = config.adapter.importedMemberships.map(
    m => PlanMapping.fromConfig(m)
  );

  // Pre-load DOM transformations
  await beforeV2Loads(planMappings);

  // Load Memberstack V2
  await loadScript(MemberstackVersion.V2, config);

  // Wait for V2 ready
  const v2Instance = window.$memberstackDom;
  if (!v2Instance) {
    throw new Error('Failed to load Memberstack V2');
  }

  // Post-load DOM transformations
  await afterV2Loads(planMappings, config);

  // Create V1 API proxy
  window.MemberStack = createV1Proxy(v2Instance);

  logger.info('[Adapter] V2 proxy created successfully');
}

/**
 * V1 initialization flow (simple passthrough)
 */
async function initializeV1Flow(config: AdapterConfig): Promise<void> {
  await loadScript(MemberstackVersion.V1, config);
  logger.info('[Adapter] V1 loaded (no proxy needed)');
}

/**
 * DOM transformations before V2 loads
 */
async function beforeV2Loads(mappings: PlanMapping[]): Promise<void> {
  logger.debug('[Adapter] Applying pre-load transformations...');

  return new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => {
      transformPlanAttributes(document, mappings);
      transformHashUrls(document, mappings);
      // ... other pre-load transformations
      resolve();
    });
  });
}

/**
 * DOM transformations after V2 loads
 */
async function afterV2Loads(
  mappings: PlanMapping[],
  config: AdapterConfig
): Promise<void> {
  logger.debug('[Adapter] Applying post-load transformations...');

  return new Promise((resolve) => {
    const handler = () => {
      transformMemberAttributes(document, mappings, config.adapter.loginUrl);
      // ... other post-load transformations
      resolve();
    };

    if (window.$memberstackReady) {
      handler();
    } else {
      document.addEventListener('memberstack.ready', handler);
    }
  });
}

/**
 * Setup MemberStack.onReady promise before V2 loads
 */
function setupOnReadyPromise(): void {
  if (window.MemberStack) return;

  let resolveOnReady: (val: any) => void;

  const onReady = new Promise((resolve) => {
    resolveOnReady = resolve;
  });

  window.MemberStack = {
    onReady,
    __resolveOnReady: resolveOnReady!,
  };
}
```

**New slim `main.ts`:**
```typescript
import { initializeAdapter } from '@/orchestration/initialize-adapter';
import { config } from '@/config';
import { logger } from '@/infrastructure/logger';

/**
 * Entry point - just loads config and starts initialization
 */
(async function() {
  if (!config.adapter.enabled) {
    logger.info('[Adapter] Adapter disabled via config');
    return;
  }

  try {
    await initializeAdapter(config);
  } catch (error) {
    logger.error('[Adapter] Initialization failed:', error);
  }
})();
```

---

### 2.6 Storage Abstraction

**New file:** `src/adapters/storage.ts`
```typescript
/**
 * Simple wrapper around browser storage APIs
 * Makes testing easier and centralizes storage logic
 */

const V1_SESSION_KEYS = [
  '__ms',
  '__stripe_mid',
  '__stripe_sid'
];

const V2_SESSION_KEYS = [
  '_ms-mid',
  '_ms-mem'
];

export function clearV1Session(): void {
  // Clear localStorage
  V1_SESSION_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear cookies
  V1_SESSION_KEYS.forEach(key => {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
}

export function isV2SessionActive(): boolean {
  return localStorage.getItem('_ms-mid') !== null;
}

export function setV2EnabledFlag(): void {
  sessionStorage.setItem('ms2_enabled', 'true');
}

export function clearV2EnabledFlag(): void {
  sessionStorage.removeItem('ms2_enabled');
}

export function getV2EnabledFlag(): string | null {
  return sessionStorage.getItem('ms2_enabled');
}
```

---

## 3. Implementation Plan

### Phase 1: Create Core Layer (4 hours)
- [ ] Create `src/core/` directory
- [ ] Create `PlanId` value object with tests
- [ ] Create `MemberstackVersion` value object with tests
- [ ] Create `PlanMapping` value object with tests
- [ ] Extract `selectVersion()` pure function with tests
- [ ] Extract `mapV1ToV2()` pure function with tests

### Phase 2: Refactor Adapters (3 hours)
- [ ] Create `src/adapters/storage.ts` with tests
- [ ] Refactor `plan-attributes.ts` to use core logic
- [ ] Refactor other DOM transformers similarly
- [ ] Update tests for refactored transformers

### Phase 3: Extract Orchestration (2 hours)
- [ ] Create `src/orchestration/initialize-adapter.ts`
- [ ] Extract flow logic from `main.ts`
- [ ] Update `main.ts` to be slim entry point
- [ ] Add integration tests

### Phase 4: Update Infrastructure (1 hour)
- [ ] Move script loading to `src/infrastructure/script-loader.ts`
- [ ] Clean up imports and path aliases
- [ ] Update tsconfig paths if needed

### Phase 5: Testing & Documentation (2 hours)
- [ ] Ensure 80%+ test coverage for core layer
- [ ] Update README with new structure
- [ ] Add JSDoc comments to public APIs
- [ ] Run full test suite

**Total: ~12 hours (1.5 days)**

---

## 4. Testing Strategy

### Unit Tests (Core Layer - 100% coverage target)
```typescript
// All pure functions - easy to test
describe('core/version-selection', () => { /* ... */ });
describe('core/plan-mapping', () => { /* ... */ });
describe('core/value-objects/PlanId', () => { /* ... */ });
describe('core/value-objects/MemberstackVersion', () => { /* ... */ });
```

### Integration Tests (Adapter Layer - 70% coverage target)
```typescript
// Test with jsdom
describe('adapters/dom/plan-attributes', () => {
  it('transforms plan attributes correctly', () => {
    const doc = new JSDOM(`
      <button data-ms-plan="mem_123">Subscribe</button>
    `).window.document;

    const mappings = [
      PlanMapping.fromConfig({ name: 'Pro', oldId: 'mem_123', newId: 'pln_456' })
    ];

    transformPlanAttributes(doc, mappings);

    const button = doc.querySelector('button');
    expect(button?.getAttribute('data-ms-plan:add')).toBe('pln_456');
    expect(button?.hasAttribute('data-ms-plan')).toBe(false);
  });
});
```

### E2E Tests (Keep existing)
- Test full initialization flow in browser environment

---

## 5. Migration Strategy

### Backward Compatibility
All changes are **internal refactoring** - no breaking changes to:
- Config format (`window.memberstackConfig`)
- Exposed API (`window.MemberStack`)
- Build output (`dist/memberstack-adapter.js`)

### Gradual Migration
We can migrate **one module at a time**:
1. Create core layer (new code, doesn't break anything)
2. Refactor one DOM transformer (isolated change)
3. Refactor remaining transformers one by one
4. Extract orchestration last (safest to do last)

### Rollback Plan
- Each phase is in separate commits
- Can revert any phase independently
- Keep old files until new versions proven in tests

---

## 6. Benefits

### Testability 🧪
- **Before:** Need full browser environment to test most logic
- **After:** Core logic testable with simple Jest tests

### Maintainability 🔧
- **Before:** Logic scattered across 14+ DOM transformer files
- **After:** Reusable core functions, DRY principle

### Type Safety 🛡️
- **Before:** String literals everywhere (`'v1' | 'v2'`, plain strings for IDs)
- **After:** Type-safe value objects with validation

### Readability 📖
- **Before:** 126-line `main.ts` with mixed concerns
- **After:** Clear separation: core → adapters → orchestration → entry point

### Performance ⚡
- **Before:** Re-computing mappings on every transform
- **After:** Can precompute lookup tables with `createPlanLookup()`

---

## 7. What We're NOT Doing

❌ **Entities/Aggregates** - Overkill for this wrapper
❌ **Domain Events** - Not needed for simple transformations
❌ **Repository Pattern** - Just wrapping localStorage
❌ **Complex DI Container** - Simple imports are fine
❌ **Use Case Classes** - Pure functions are simpler
❌ **4 Architecture Layers** - 3 is enough (core/adapters/infrastructure)

---

## 8. Before/After Comparison

### Version Selection

**Before:**
```typescript
// Coupled to browser APIs, hard to test
export function shouldUseAdapter(config: AdapterConfig): "v1" | "v2" {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAdapterParam = urlParams.get('adapter');
    // ... browser-dependent logic
}
```

**After:**
```typescript
// Pure function, trivial to test
export function selectVersion(criteria: VersionSelectionCriteria): MemberstackVersion {
  if (criteria.forcedVersion) return criteria.forcedVersion;
  if (criteria.queryParam === 'v2') return MemberstackVersion.V2;
  // ... pure logic
}

// Easy to test!
expect(selectVersion({ queryParam: 'v2' })).toBe(MemberstackVersion.V2);
```

### Plan Mapping

**Before:**
```typescript
// Duplicated in every transformer
const membership = importedMemberships.find(m => m.oldId === oldId);
if (membership.newId.startsWith('prc_')) {
  element.setAttribute('data-ms-price:update', membership.newId);
} else {
  element.setAttribute('data-ms-plan:add', membership.newId);
}
```

**After:**
```typescript
// Reusable, testable, type-safe
const mapping = mapV1ToV2(oldId, planMappings);
element.setAttribute(mapping.attributeName, mapping.v2Id.value);
```

### Main Entry Point

**Before:**
```typescript
// 126 lines of mixed orchestration + logic
(async function () {
    if (!config.adapter.enabled) { /* ... */ }
    const currentVersion = shouldUseAdapter(config);
    config.adapter.currentVersion = currentVersion;
    createVersionDiv(config);
    if (currentVersion === 'v2') {
        deleteV1Session();
        patchMemberStackOnReady();
        enableLegacyAdapter();
    } else {
        executeMemberstackV1(config);
    }
    // ... continues for 100+ lines
})();
```

**After:**
```typescript
// 15 lines - clear and simple
(async function() {
  if (!config.adapter.enabled) {
    logger.info('[Adapter] Adapter disabled via config');
    return;
  }

  try {
    await initializeAdapter(config);
  } catch (error) {
    logger.error('[Adapter] Initialization failed:', error);
  }
})();
```

---

## 9. File Size Impact

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total LOC | ~1,500 | ~1,800 | +300 (tests) |
| Core logic | Mixed | ~300 LOC | Extracted |
| Main.ts | 126 LOC | 15 LOC | -111 |
| Test coverage | ~40% | ~80% | +40% |
| Bundle size | No change | No change | Same |

**Note:** Line count increases slightly due to:
- Value object boilerplate
- More comprehensive tests
- Better separation (some duplication removed, but more structure added)

**But we gain:**
- Much better testability
- Clearer code organization
- Type safety

---

## 10. Success Metrics

### Must Have ✅
- [ ] All core functions have unit tests
- [ ] No breaking changes to public API
- [ ] Build still produces same output
- [ ] All existing tests still pass

### Nice to Have 🎯
- [ ] 80%+ test coverage on core layer
- [ ] 10-20% reduction in cyclomatic complexity
- [ ] Faster test execution (pure functions vs browser tests)

---

## 11. Next Steps

1. **Review this proposal** - Get team feedback
2. **Create spike branch** - Implement Phase 1 as proof of concept
3. **Review spike** - Validate approach works
4. **Implement remaining phases** - One phase per PR
5. **Update documentation** - README, architecture docs

---

## 12. Conclusion

This pragmatic refactoring strikes the right balance:

✅ **Testable** - Core logic is pure and easy to test
✅ **Simple** - No over-engineering, just clean code
✅ **Safe** - Gradual migration, backward compatible
✅ **Fast** - 1-2 days vs 6 weeks for full Clean Architecture
✅ **Practical** - Addresses real pain points without rebuilding everything

**This is the right level of architecture for a 500-line wrapper library.**

---

## Appendix: Example Test Coverage

### Before Refactoring
```
core/                 Coverage: N/A (no core layer)
adapter/              Coverage: 30% (hard to test with DOM deps)
loader/               Coverage: 20% (hard to test with browser APIs)
```

### After Refactoring
```
core/                 Coverage: 95% (pure functions, easy to test)
  version-selection   Coverage: 100%
  plan-mapping        Coverage: 100%
  value-objects/      Coverage: 90%
adapters/             Coverage: 70% (easier with extracted core logic)
infrastructure/       Coverage: 60% (still has some browser deps)
```

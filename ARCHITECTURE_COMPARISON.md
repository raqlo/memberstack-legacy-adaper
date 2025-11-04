# Architecture Comparison

## Overview

Two proposals for improving the Memberstack Legacy Adapter codebase:

1. **Full Clean Architecture + DDD** (`ARCHITECTURE_PROPOSAL.md`)
2. **Pragmatic Refactoring** (`PRAGMATIC_REFACTORING_PROPOSAL.md`) ⭐ **RECOMMENDED**

---

## Side-by-Side Comparison

| Aspect | Full Clean Architecture | Pragmatic Refactoring | Winner |
|--------|------------------------|----------------------|--------|
| **Effort** | 6 weeks | 1-2 days | 🏆 Pragmatic |
| **Complexity** | High (4 layers, DI, repositories) | Low (3 folders) | 🏆 Pragmatic |
| **Lines of Code** | ~3,500+ | ~1,800 | 🏆 Pragmatic |
| **Learning Curve** | Steep (DDD concepts) | Gentle (basic patterns) | 🏆 Pragmatic |
| **Testability** | 100% (everything mocked) | 80%+ (core pure functions) | 🏆 Clean Arch (but overkill) |
| **Maintainability** | Excellent (but complex) | Very Good (simple) | 🏆 Pragmatic |
| **Overkill Factor** | ⚠️ Very High | ✅ Just Right | 🏆 Pragmatic |
| **Appropriate For** | Enterprise core domain | Small wrapper library | 🏆 Pragmatic |

---

## What Each Proposes

### Full Clean Architecture

```
src/
├── domain/                    # Enterprise business rules
│   ├── entities/              # Member, Membership, Plan, Session
│   ├── value-objects/         # Email, MemberId, Money, Currency
│   └── services/              # PlanMappingService, VersionSelectionService
├── use-cases/                 # Application business rules
│   ├── InitializeAdapter.ts
│   ├── LoadMemberstack.ts
│   ├── TransformDOM.ts
│   ├── CreateLegacyAPI.ts
│   ├── AuthenticateMember.ts
│   └── interfaces/            # ISessionRepository, IMemberRepository
├── adapters/                  # Interface adapters
│   ├── controllers/
│   ├── presenters/
│   ├── repositories/
│   ├── gateways/
│   ├── mappers/
│   └── transformers/
├── infrastructure/            # Frameworks & drivers
│   ├── loaders/
│   ├── storage/
│   ├── logging/
│   └── di/                    # Dependency injection container
└── main.ts                    # Composition root
```

**Key Features:**
- Full entity/value object hierarchy
- Repository pattern for all data access
- Use case classes for all operations
- Dependency injection container
- Strict layer boundaries
- Domain events (optional)

**When to Use:**
- Long-lived core business applications
- Complex domain logic
- Multiple teams working on different bounded contexts
- Expected to scale significantly

---

### Pragmatic Refactoring ⭐

```
src/
├── core/                      # Pure logic (no browser deps)
│   ├── version-selection.ts   # Pure function: select version
│   ├── plan-mapping.ts        # Pure function: map V1→V2
│   └── value-objects/         # PlanId, MemberstackVersion, PlanMapping
├── adapters/                  # DOM & External dependencies
│   ├── api/                   # V1→V2 proxy
│   ├── dom/                   # DOM transformers (use core/ logic)
│   └── storage.ts             # localStorage wrapper
├── infrastructure/
│   ├── script-loader.ts       # Loads vendor scripts
│   └── logger.ts              # Consola wrapper
├── orchestration/
│   └── initialize-adapter.ts  # Main flow (extracted from main.ts)
└── main.ts                    # Slim entry point (~15 lines)
```

**Key Features:**
- Extract pure functions for testability
- Minimal value objects for type safety
- Simple folder structure
- No over-engineering
- Backward compatible

**When to Use:**
- Small-to-medium libraries (< 2,000 LOC)
- Temporary/transitional tools
- Simple domain logic
- Solo developer or small team

---

## Code Examples

### Version Selection

#### Full Clean Architecture
```typescript
// Domain Service
class VersionSelectionService implements IVersionSelectionService {
  selectVersion(criteria: VersionSelectionCriteria): MemberstackVersion {
    // Business logic
  }
}

// Use Case
class InitializeAdapter {
  constructor(
    private readonly versionSelector: IVersionSelectionService,
    private readonly sessionRepo: ISessionRepository,
    private readonly configValidator: IConfigurationValidator,
    private readonly logger: ILogger
  ) {}

  async execute(request: InitializeAdapterRequest): Promise<InitializeAdapterResponse> {
    const version = this.versionSelector.selectVersion(criteria);
    // ...
  }
}

// Controller
class AdapterController {
  constructor(private readonly initializeAdapter: InitializeAdapter) {}

  async initialize(): Promise<void> {
    await this.initializeAdapter.execute({ config });
  }
}

// Composition Root (DI Container)
container.register('IVersionSelectionService', () => new VersionSelectionService());
container.register('InitializeAdapter', (c) => new InitializeAdapter(
  c.resolve('IVersionSelectionService'),
  c.resolve('ISessionRepository'),
  c.resolve('IConfigurationValidator'),
  c.resolve('ILogger')
));
```

**Lines of code: ~150** for version selection

---

#### Pragmatic Refactoring
```typescript
// Pure function
export function selectVersion(criteria: VersionSelectionCriteria): MemberstackVersion {
  if (criteria.forcedVersion) return criteria.forcedVersion;
  if (criteria.queryParam === 'v2') return MemberstackVersion.V2;
  if (criteria.sessionFlag === 'true') return MemberstackVersion.V2;
  return MemberstackVersion.V1;
}

// Usage in orchestration
const version = selectVersion({
  forcedVersion: config.adapter.forcedVersion,
  queryParam: new URLSearchParams(window.location.search).get('adapter'),
  sessionFlag: sessionStorage.getItem('ms2_enabled')
});
```

**Lines of code: ~20** for version selection

---

## Testing Comparison

### Full Clean Architecture

```typescript
// Test domain service
describe('VersionSelectionService', () => {
  let service: VersionSelectionService;

  beforeEach(() => {
    service = new VersionSelectionService();
  });

  it('should select forced version', () => {
    const result = service.selectVersion({
      forcedVersion: MemberstackVersion.V2
    });
    expect(result).toBe(MemberstackVersion.V2);
  });
});

// Test use case (with mocks)
describe('InitializeAdapter', () => {
  let useCase: InitializeAdapter;
  let mockVersionSelector: jest.Mocked<IVersionSelectionService>;
  let mockSessionRepo: jest.Mocked<ISessionRepository>;
  let mockConfigValidator: jest.Mocked<IConfigurationValidator>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockVersionSelector = {
      selectVersion: jest.fn()
    };
    mockSessionRepo = {
      getCurrentSession: jest.fn(),
      saveSession: jest.fn(),
      clearSession: jest.fn()
    };
    mockConfigValidator = {
      validate: jest.fn()
    };
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    useCase = new InitializeAdapter(
      mockVersionSelector,
      mockSessionRepo,
      mockConfigValidator,
      mockLogger
    );
  });

  it('should initialize adapter with V2', async () => {
    mockVersionSelector.selectVersion.mockReturnValue(MemberstackVersion.V2);
    mockConfigValidator.validate.mockReturnValue({ isValid: () => true });
    mockSessionRepo.getCurrentSession.mockResolvedValue(null);

    const result = await useCase.execute({
      config: mockConfig
    });

    expect(result.version).toBe(MemberstackVersion.V2);
    expect(mockLogger.info).toHaveBeenCalledWith('Initializing Memberstack Adapter');
  });
});
```

**Setup complexity: High** (many mocks needed)

---

### Pragmatic Refactoring

```typescript
// Test pure function (no mocks needed!)
describe('selectVersion', () => {
  it('should select forced version', () => {
    const result = selectVersion({
      forcedVersion: MemberstackVersion.V2
    });
    expect(result).toBe(MemberstackVersion.V2);
  });

  it('should prioritize query param over session', () => {
    const result = selectVersion({
      queryParam: 'v2',
      sessionFlag: 'false'
    });
    expect(result).toBe(MemberstackVersion.V2);
  });

  it('should default to V1', () => {
    const result = selectVersion({});
    expect(result).toBe(MemberstackVersion.V1);
  });
});
```

**Setup complexity: None** (pure functions are trivial to test)

---

## File Count Comparison

| Metric | Full Clean Arch | Pragmatic | Notes |
|--------|----------------|-----------|-------|
| **Entities** | 4 files | 0 files | Member, Membership, Plan, Session |
| **Value Objects** | 8 files | 3 files | Email, Money, Currency vs PlanId, Version, Mapping |
| **Domain Services** | 3 files | 0 files | Replaced with pure functions |
| **Use Cases** | 6 files | 0 files | Replaced with simple orchestration |
| **Repositories** | 6 files (3 interfaces + 3 impls) | 1 file | Full pattern vs simple wrapper |
| **Gateways** | 2 files | 1 file | V1/V2 gateways vs single proxy |
| **Mappers** | 4 files | 0 files | Not needed with value objects |
| **Controllers** | 1 file | 0 files | Replaced with orchestration function |
| **DI Container** | 1 file | 0 files | Simple imports instead |
| **Total New Files** | ~35 files | ~8 files | |

---

## When to Choose Each

### Choose Full Clean Architecture If:

- ✅ This will become a **long-lived core product** (5+ years)
- ✅ You need to support **V3, V4, V5+** versions
- ✅ **Multiple teams** will work on different domains
- ✅ You have **complex business rules** beyond simple mapping
- ✅ You need to **swap implementations** frequently (different storage, APIs)
- ✅ Team is **experienced with DDD** and Clean Architecture
- ✅ You have **6 weeks** to invest in refactoring

### Choose Pragmatic Refactoring If:

- ✅ This is a **temporary migration tool** (1-2 years)
- ✅ It's a **thin wrapper** over third-party APIs
- ✅ **Solo developer or small team** (1-3 people)
- ✅ **Simple domain logic** (just mapping and proxying)
- ✅ Need to **ship improvements quickly** (days not weeks)
- ✅ Want **testability without complexity**
- ✅ Current codebase is **< 2,000 lines**

---

## Recommendation

**For this specific library: Pragmatic Refactoring** 🏆

### Why?

1. **It's a wrapper** - Not a core business application
2. **Temporary tool** - For V1→V2 migration (eventually all users on V2)
3. **Small codebase** - ~500 lines doesn't justify 4 architecture layers
4. **Time to value** - 1-2 days vs 6 weeks
5. **Maintainability** - Simpler code is easier to maintain
6. **Right-sized** - Solves the actual problems without over-engineering

### The Pragmatic Approach Gets You:

✅ **80%+ test coverage** on core logic (vs 0% now)
✅ **Type safety** with value objects
✅ **Testable pure functions** (no browser deps)
✅ **Better organization** (core/adapters/infrastructure)
✅ **Backward compatible** (internal refactoring only)

### Without:

❌ Over-engineering a simple wrapper
❌ 6 weeks of development time
❌ Steep learning curve for new contributors
❌ Unnecessary complexity

---

## Visual Comparison

### Dependency Graph Complexity

#### Full Clean Architecture
```
main.ts
  └─> DIContainer
       ├─> AdapterController
       │    ├─> InitializeAdapter (Use Case)
       │    │    ├─> IVersionSelectionService
       │    │    │    └─> VersionSelectionService (Domain Service)
       │    │    ├─> ISessionRepository
       │    │    │    └─> LocalStorageSessionRepository
       │    │    │         ├─> IStorage
       │    │    │         │    └─> LocalStorageAdapter
       │    │    │         └─> SessionMapper
       │    │    ├─> IConfigurationValidator
       │    │    │    └─> ConfigurationValidator
       │    │    └─> ILogger
       │    │         └─> ConsolaLogger
       │    ├─> LoadMemberstack (Use Case)
       │    ├─> TransformDOM (Use Case)
       │    │    └─> IDOMTransformer[]
       │    └─> CreateLegacyAPI (Use Case)
       └─> IPlanMappingService
            └─> PlanMappingService (Domain Service)
                 └─> Map<Plan>
```

**Depth: 6 levels** | **Abstractions: 15+**

---

#### Pragmatic Refactoring
```
main.ts
  └─> initializeAdapter()
       ├─> selectVersion() [pure function]
       ├─> transformPlanAttributes()
       │    └─> mapV1ToV2() [pure function]
       ├─> loadScript()
       └─> createV1Proxy()
```

**Depth: 2-3 levels** | **Abstractions: 5**

---

## Migration Path

Both proposals support gradual migration, but the pragmatic approach is much faster:

| Step | Full Clean Arch | Pragmatic | Time Saved |
|------|----------------|-----------|------------|
| 1. Create foundation | 1 week | 4 hours | 5.5 days |
| 2. Implement use cases | 1 week | 3 hours | 6.5 days |
| 3. Implement adapters | 1 week | 3 hours | 6.5 days |
| 4. Infrastructure | 1 week | 1 hour | 6.9 days |
| 5. Migration | 1 week | 2 hours | 6.75 days |
| 6. Cleanup | 1 week | 0 hours | 7 days |
| **TOTAL** | **6 weeks** | **1.5 days** | **~38 days saved** |

---

## Real-World Analogy

### Full Clean Architecture
Building a **skyscraper** foundation for a **food truck**
- Extremely solid foundation
- Can support 50 floors
- Takes 6 months to build
- Costs $1M
- **But you only needed a food truck** 🌮

### Pragmatic Refactoring
Building a **proper food truck** instead of a **cardboard box**
- Solid enough for your needs
- Clean, organized, health code compliant
- Takes 2 days to upgrade
- Costs $5K
- **Perfect for what you're actually doing** 🎯

---

## Conclusion

Both proposals are **technically sound**, but they target different problems:

- **Full Clean Architecture**: For enterprise applications with complex domains
- **Pragmatic Refactoring**: For small wrappers and utilities

Given that this is a **~500 line temporary migration wrapper**, the **Pragmatic Refactoring** proposal is the clear winner.

**It delivers 80% of the benefits with 5% of the effort.**

---

## Next Steps

1. **Review both proposals** thoroughly
2. **Choose pragmatic refactoring** (recommended)
3. **Start with Phase 1** (create core layer - 4 hours)
4. **Validate with tests** before proceeding
5. **Complete remaining phases** one at a time

---

## Questions?

- Want to see a **proof of concept** for the pragmatic approach?
- Need help deciding which approach fits your **specific context**?
- Have constraints I'm not aware of (team size, timeline, future plans)?

Let me know and I can provide more guidance!

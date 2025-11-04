# Domain Architecture Proposal - Clean Architecture

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architectural Principles](#architectural-principles)
3. [Layered Architecture Overview](#layered-architecture-overview)
4. [Domain Layer](#domain-layer)
5. [Use Case Layer](#use-case-layer)
6. [Interface Adapters Layer](#interface-adapters-layer)
7. [Frameworks & Drivers Layer](#frameworks--drivers-layer)
8. [Dependency Flow](#dependency-flow)
9. [Proposed Directory Structure](#proposed-directory-structure)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Benefits](#benefits)

---

## Executive Summary

This proposal restructures the Memberstack Legacy Adapter following **Clean Architecture** principles (Uncle Bob Martin). The current architecture is functional but lacks clear separation of concerns and dependency boundaries. The proposed architecture introduces four distinct layers with explicit dependency rules, making the codebase more maintainable, testable, and scalable.

**Key Objectives:**
- Separate business logic from infrastructure concerns
- Enable independent testing of domain logic
- Facilitate easier migration and feature additions
- Improve code readability and maintainability
- Establish clear architectural boundaries

---

## Architectural Principles

### 1. **Separation of Concerns**
Each module has a single, well-defined responsibility.

### 2. **Dependency Rule**
Dependencies point inward. Inner layers know nothing about outer layers.

```
Domain (innermost) ← Use Cases ← Interface Adapters ← Frameworks (outermost)
```

### 3. **Inversion of Control**
High-level modules don't depend on low-level modules. Both depend on abstractions.

### 4. **SOLID Principles**
- **S**ingle Responsibility
- **O**pen/Closed
- **L**iskov Substitution
- **I**nterface Segregation
- **D**ependency Inversion

### 5. **Testability First**
All business logic should be testable without browser/DOM dependencies.

---

## Layered Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Frameworks & Drivers Layer              │
│  (DOM, Browser APIs, External Libraries)        │
│  - Vite, Consola, Window APIs                   │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         Interface Adapters Layer                │
│  (Controllers, Presenters, Gateways)            │
│  - API Adapters, DOM Transformers               │
│  - Configuration Parsers, Loggers               │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           Use Case Layer                        │
│  (Application Business Rules)                   │
│  - Version Selection, Session Management        │
│  - API Bridging, Migration Orchestration        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           Domain Layer                          │
│  (Enterprise Business Rules)                    │
│  - Entities, Value Objects, Domain Services     │
│  - Member, Membership, Plan, Session            │
└─────────────────────────────────────────────────┘
```

---

## Domain Layer

The **innermost layer** containing core business entities and rules. No dependencies on outer layers.

### Entities

#### 1. **Member** (Domain Entity)
```typescript
// src/domain/entities/Member.ts
export class Member {
  constructor(
    private readonly id: MemberId,
    private readonly email: Email,
    private readonly memberships: Membership[],
    private readonly metadata: MemberMetadata
  ) {}

  getId(): string {
    return this.id.value;
  }

  getEmail(): string {
    return this.email.value;
  }

  getMemberships(): ReadonlyArray<Membership> {
    return this.memberships;
  }

  getActiveMembership(): Membership | null {
    return this.memberships.find(m => m.isActive()) ?? null;
  }

  hasActiveMembership(): boolean {
    return this.getActiveMembership() !== null;
  }

  isAuthenticated(): boolean {
    return this.id.isValid();
  }
}
```

#### 2. **Membership** (Domain Entity)
```typescript
// src/domain/entities/Membership.ts
export class Membership {
  constructor(
    private readonly id: MembershipId,
    private readonly planId: PlanId,
    private readonly status: MembershipStatus,
    private readonly pricing: PricingInfo,
    private readonly metadata: MembershipMetadata
  ) {}

  isActive(): boolean {
    return this.status.equals(MembershipStatus.ACTIVE);
  }

  getPlanName(): string {
    return this.metadata.planName;
  }

  getAmount(): Money {
    return this.pricing.amount;
  }

  getStatusString(): string {
    return this.status.toString();
  }
}
```

#### 3. **Plan** (Domain Entity)
```typescript
// src/domain/entities/Plan.ts
export class Plan {
  constructor(
    private readonly v1Id: PlanId,
    private readonly v2Id: PlanId,
    private readonly name: PlanName,
    private readonly type: PlanType // FREE, PREMIUM, etc.
  ) {}

  getV1Id(): string {
    return this.v1Id.value;
  }

  getV2Id(): string {
    return this.v2Id.value;
  }

  getName(): string {
    return this.name.value;
  }

  isPrice(): boolean {
    return this.v2Id.isPrice(); // Checks if starts with 'prc_'
  }

  isPlan(): boolean {
    return this.v2Id.isPlan(); // Checks if starts with 'pln_'
  }
}
```

#### 4. **Session** (Domain Entity)
```typescript
// src/domain/entities/Session.ts
export class Session {
  constructor(
    private readonly version: MemberstackVersion,
    private readonly memberId: MemberId | null,
    private readonly token: SessionToken | null,
    private readonly expiresAt: Date | null
  ) {}

  isV1(): boolean {
    return this.version.equals(MemberstackVersion.V1);
  }

  isV2(): boolean {
    return this.version.equals(MemberstackVersion.V2);
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return this.token !== null && !this.isExpired();
  }
}
```

### Value Objects

#### 1. **MemberstackVersion**
```typescript
// src/domain/value-objects/MemberstackVersion.ts
export class MemberstackVersion {
  private static readonly V1_STRING = 'v1';
  private static readonly V2_STRING = 'v2';

  public static readonly V1 = new MemberstackVersion(MemberstackVersion.V1_STRING);
  public static readonly V2 = new MemberstackVersion(MemberstackVersion.V2_STRING);

  private constructor(private readonly value: 'v1' | 'v2') {}

  static fromString(value: string): MemberstackVersion {
    if (value === MemberstackVersion.V1_STRING) return MemberstackVersion.V1;
    if (value === MemberstackVersion.V2_STRING) return MemberstackVersion.V2;
    throw new Error(`Invalid MemberstackVersion: ${value}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: MemberstackVersion): boolean {
    return this.value === other.value;
  }
}
```

#### 2. **PlanId**
```typescript
// src/domain/value-objects/PlanId.ts
export class PlanId {
  private static readonly PRICE_PREFIX = 'prc_';
  private static readonly PLAN_PREFIX = 'pln_';

  constructor(private readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('PlanId cannot be empty');
    }
  }

  getValue(): string {
    return this.value;
  }

  isPrice(): boolean {
    return this.value.startsWith(PlanId.PRICE_PREFIX);
  }

  isPlan(): boolean {
    return this.value.startsWith(PlanId.PLAN_PREFIX);
  }

  equals(other: PlanId): boolean {
    return this.value === other.value;
  }
}
```

#### 3. **Email**
```typescript
// src/domain/value-objects/Email.ts
export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(public readonly value: string) {
    if (!Email.EMAIL_REGEX.test(value)) {
      throw new Error(`Invalid email: ${value}`);
    }
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
```

#### 4. **Money**
```typescript
// src/domain/value-objects/Money.ts
export class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: Currency
  ) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency.code;
  }

  format(): string {
    return `${this.currency.symbol}${this.amount.toFixed(2)}`;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount &&
           this.currency.equals(other.currency);
  }
}
```

### Domain Services

#### 1. **PlanMappingService**
```typescript
// src/domain/services/PlanMappingService.ts
export interface IPlanMappingService {
  mapV1ToV2(v1Id: PlanId): Plan | null;
  mapV2ToV1(v2Id: PlanId): Plan | null;
  getAllPlans(): ReadonlyArray<Plan>;
}

export class PlanMappingService implements IPlanMappingService {
  constructor(private readonly planRegistry: Map<string, Plan>) {}

  mapV1ToV2(v1Id: PlanId): Plan | null {
    for (const plan of this.planRegistry.values()) {
      if (plan.getV1Id() === v1Id.getValue()) {
        return plan;
      }
    }
    return null;
  }

  mapV2ToV1(v2Id: PlanId): Plan | null {
    for (const plan of this.planRegistry.values()) {
      if (plan.getV2Id() === v2Id.getValue()) {
        return plan;
      }
    }
    return null;
  }

  getAllPlans(): ReadonlyArray<Plan> {
    return Array.from(this.planRegistry.values());
  }
}
```

#### 2. **VersionSelectionService**
```typescript
// src/domain/services/VersionSelectionService.ts
export interface IVersionSelectionService {
  selectVersion(criteria: VersionSelectionCriteria): MemberstackVersion;
}

export class VersionSelectionService implements IVersionSelectionService {
  selectVersion(criteria: VersionSelectionCriteria): MemberstackVersion {
    // Priority 1: Forced version from config
    if (criteria.forcedVersion) {
      return criteria.forcedVersion;
    }

    // Priority 2: Query parameter
    if (criteria.queryParameterVersion) {
      return criteria.queryParameterVersion;
    }

    // Priority 3: Session storage
    if (criteria.sessionStorageVersion) {
      return criteria.sessionStorageVersion;
    }

    // Priority 4: Default version
    return criteria.defaultVersion ?? MemberstackVersion.V1;
  }
}

export interface VersionSelectionCriteria {
  forcedVersion?: MemberstackVersion;
  queryParameterVersion?: MemberstackVersion;
  sessionStorageVersion?: MemberstackVersion;
  defaultVersion?: MemberstackVersion;
}
```

---

## Use Case Layer

Application-specific business rules. Orchestrates data flow between entities.

### Use Cases

#### 1. **InitializeAdapter**
```typescript
// src/use-cases/InitializeAdapter.ts
export interface InitializeAdapterRequest {
  config: AdapterConfiguration;
}

export interface InitializeAdapterResponse {
  version: MemberstackVersion;
  session: Session | null;
  success: boolean;
}

export class InitializeAdapter {
  constructor(
    private readonly versionSelector: IVersionSelectionService,
    private readonly sessionRepository: ISessionRepository,
    private readonly configValidator: IConfigurationValidator,
    private readonly logger: ILogger
  ) {}

  async execute(request: InitializeAdapterRequest): Promise<InitializeAdapterResponse> {
    this.logger.info('Initializing Memberstack Adapter');

    // Validate configuration
    const validationResult = this.configValidator.validate(request.config);
    if (!validationResult.isValid()) {
      throw new Error(`Invalid configuration: ${validationResult.getErrors()}`);
    }

    // Select version based on criteria
    const criteria = this.buildVersionCriteria(request.config);
    const version = this.versionSelector.selectVersion(criteria);

    this.logger.info(`Selected version: ${version.toString()}`);

    // Load existing session
    const session = await this.sessionRepository.getCurrentSession();

    // Clean up old session if switching versions
    if (session && !session.isV2() && version.isV2()) {
      await this.sessionRepository.clearSession();
      this.logger.info('Cleared V1 session for V2 migration');
    }

    return {
      version,
      session: version.isV2() ? null : session,
      success: true
    };
  }

  private buildVersionCriteria(config: AdapterConfiguration): VersionSelectionCriteria {
    return {
      forcedVersion: config.getForcedVersion(),
      defaultVersion: config.getCurrentVersion()
    };
  }
}
```

#### 2. **LoadMemberstack**
```typescript
// src/use-cases/LoadMemberstack.ts
export interface LoadMemberstackRequest {
  version: MemberstackVersion;
  config: AdapterConfiguration;
}

export interface LoadMemberstackResponse {
  api: IMemberstackAPI;
  success: boolean;
}

export class LoadMemberstack {
  constructor(
    private readonly scriptLoader: IScriptLoader,
    private readonly apiFactory: IMemberstackAPIFactory,
    private readonly logger: ILogger
  ) {}

  async execute(request: LoadMemberstackRequest): Promise<LoadMemberstackResponse> {
    this.logger.info(`Loading Memberstack ${request.version.toString()}`);

    // Load the appropriate script
    await this.scriptLoader.load(request.version);

    // Create the API instance
    const api = this.apiFactory.create(request.version, request.config);

    // Wait for initialization
    await api.ready();

    this.logger.info('Memberstack loaded successfully');

    return {
      api,
      success: true
    };
  }
}
```

#### 3. **TransformDOM**
```typescript
// src/use-cases/TransformDOM.ts
export interface TransformDOMRequest {
  version: MemberstackVersion;
  planMappings: Plan[];
  member: Member | null;
}

export interface TransformDOMResponse {
  transformationsApplied: number;
  success: boolean;
}

export class TransformDOM {
  constructor(
    private readonly transformers: IDOMTransformer[],
    private readonly logger: ILogger
  ) {}

  async execute(request: TransformDOMRequest): Promise<TransformDOMResponse> {
    if (request.version.isV1()) {
      this.logger.debug('Skipping DOM transformations for V1');
      return { transformationsApplied: 0, success: true };
    }

    let count = 0;

    for (const transformer of this.transformers) {
      if (transformer.shouldApply(request)) {
        const result = await transformer.transform(request);
        count += result.modificationsCount;
        this.logger.debug(`${transformer.getName()}: ${result.modificationsCount} changes`);
      }
    }

    this.logger.info(`Applied ${count} DOM transformations`);

    return {
      transformationsApplied: count,
      success: true
    };
  }
}
```

#### 4. **CreateLegacyAPI**
```typescript
// src/use-cases/CreateLegacyAPI.ts
export interface CreateLegacyAPIRequest {
  v2API: IMemberstackAPI;
  planMapper: IPlanMappingService;
}

export interface CreateLegacyAPIResponse {
  v1API: IMemberstackAPI;
  success: boolean;
}

export class CreateLegacyAPI {
  constructor(
    private readonly proxyBuilder: IAPIProxyBuilder,
    private readonly objectMapper: IObjectMapper,
    private readonly logger: ILogger
  ) {}

  execute(request: CreateLegacyAPIRequest): CreateLegacyAPIResponse {
    this.logger.info('Creating legacy V1 API proxy');

    const v1API = this.proxyBuilder.build({
      targetAPI: request.v2API,
      objectMapper: this.objectMapper,
      planMapper: request.planMapper
    });

    return {
      v1API,
      success: true
    };
  }
}
```

#### 5. **AuthenticateMember**
```typescript
// src/use-cases/AuthenticateMember.ts
export interface AuthenticateMemberRequest {
  email: Email;
  password: string;
}

export interface AuthenticateMemberResponse {
  member: Member;
  session: Session;
  success: boolean;
}

export class AuthenticateMember {
  constructor(
    private readonly api: IMemberstackAPI,
    private readonly sessionRepository: ISessionRepository,
    private readonly logger: ILogger
  ) {}

  async execute(request: AuthenticateMemberRequest): Promise<AuthenticateMemberResponse> {
    this.logger.info(`Authenticating member: ${request.email.value}`);

    // Call the API
    const authResult = await this.api.login(request.email.value, request.password);

    // Create domain entities
    const member = this.mapToMember(authResult.member);
    const session = this.mapToSession(authResult.session);

    // Store session
    await this.sessionRepository.saveSession(session);

    this.logger.info('Authentication successful');

    return {
      member,
      session,
      success: true
    };
  }

  private mapToMember(data: any): Member {
    // Mapping logic
  }

  private mapToSession(data: any): Session {
    // Mapping logic
  }
}
```

---

## Interface Adapters Layer

Converts data between use cases and external systems.

### Repositories (Interfaces)

```typescript
// src/use-cases/interfaces/ISessionRepository.ts
export interface ISessionRepository {
  getCurrentSession(): Promise<Session | null>;
  saveSession(session: Session): Promise<void>;
  clearSession(): Promise<void>;
}

// src/use-cases/interfaces/IMemberRepository.ts
export interface IMemberRepository {
  getCurrentMember(): Promise<Member | null>;
  saveMember(member: Member): Promise<void>;
  clearMember(): Promise<void>;
}

// src/use-cases/interfaces/IConfigurationRepository.ts
export interface IConfigurationRepository {
  getConfiguration(): Promise<AdapterConfiguration>;
}
```

### Repository Implementations

#### 1. **LocalStorageSessionRepository**
```typescript
// src/adapters/repositories/LocalStorageSessionRepository.ts
export class LocalStorageSessionRepository implements ISessionRepository {
  constructor(
    private readonly storage: IStorage,
    private readonly sessionMapper: ISessionMapper
  ) {}

  async getCurrentSession(): Promise<Session | null> {
    const data = this.storage.getItem('_ms-mid');
    if (!data) return null;

    return this.sessionMapper.toDomain(JSON.parse(data));
  }

  async saveSession(session: Session): Promise<void> {
    const data = this.sessionMapper.toStorage(session);
    this.storage.setItem('_ms-mid', JSON.stringify(data));
  }

  async clearSession(): Promise<void> {
    this.storage.removeItem('_ms-mid');
    this.storage.removeItem('_ms-mem');
    this.storage.removeItem('__ms');
    this.storage.removeItem('__stripe_mid');
    this.storage.removeItem('__stripe_sid');
  }
}
```

#### 2. **WindowConfigurationRepository**
```typescript
// src/adapters/repositories/WindowConfigurationRepository.ts
export class WindowConfigurationRepository implements IConfigurationRepository {
  constructor(
    private readonly window: Window,
    private readonly configMapper: IConfigurationMapper,
    private readonly validator: IConfigurationValidator
  ) {}

  async getConfiguration(): Promise<AdapterConfiguration> {
    const rawConfig = (this.window as any).memberstackConfig;

    if (!rawConfig) {
      throw new Error('memberstackConfig not found on window');
    }

    const config = this.configMapper.toDomain(rawConfig);

    const validation = this.validator.validate(config);
    if (!validation.isValid()) {
      throw new Error(`Invalid configuration: ${validation.getErrors()}`);
    }

    return config;
  }
}
```

### Gateways

#### 1. **MemberstackV2Gateway**
```typescript
// src/adapters/gateways/MemberstackV2Gateway.ts
export class MemberstackV2Gateway implements IMemberstackAPI {
  constructor(
    private readonly sdk: any, // @memberstack/dom
    private readonly memberMapper: IMemberMapper
  ) {}

  async ready(): Promise<void> {
    await this.sdk.ready;
  }

  async getCurrentMember(): Promise<Member | null> {
    const data = await this.sdk.getCurrentMember();
    if (!data) return null;

    return this.memberMapper.toDomain(data);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const result = await this.sdk.loginMemberEmailPassword({
      email,
      password
    });

    return {
      member: this.memberMapper.toDomain(result.data),
      session: this.createSession(result.data)
    };
  }

  async logout(): Promise<void> {
    await this.sdk.logout();
  }

  async getToken(): Promise<string | null> {
    const member = await this.sdk.getCurrentMember();
    return member?.auth?.token ?? null;
  }

  private createSession(data: any): Session {
    // Map to Session entity
  }
}
```

#### 2. **MemberstackV1Gateway**
```typescript
// src/adapters/gateways/MemberstackV1Gateway.ts
export class MemberstackV1Gateway implements IMemberstackAPI {
  constructor(
    private readonly memberstack: any, // V1 global
    private readonly memberMapper: IMemberMapper
  ) {}

  async ready(): Promise<void> {
    return new Promise((resolve) => {
      this.memberstack.onReady.then(resolve);
    });
  }

  async getCurrentMember(): Promise<Member | null> {
    const data = await this.getV1Member();
    if (!data) return null;

    return this.memberMapper.toDomain(data);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    // V1 doesn't have login method, throw error
    throw new Error('Login not supported in V1');
  }

  async logout(): Promise<void> {
    await this.memberstack.logout();
  }

  async getToken(): Promise<string | null> {
    return this.memberstack.getToken();
  }

  private async getV1Member(): Promise<any> {
    return new Promise((resolve) => {
      this.memberstack.onReady.then((member: any) => resolve(member));
    });
  }
}
```

### Controllers

#### 1. **AdapterController**
```typescript
// src/adapters/controllers/AdapterController.ts
export class AdapterController {
  constructor(
    private readonly initializeAdapter: InitializeAdapter,
    private readonly loadMemberstack: LoadMemberstack,
    private readonly transformDOM: TransformDOM,
    private readonly createLegacyAPI: CreateLegacyAPI,
    private readonly planMappingService: IPlanMappingService,
    private readonly logger: ILogger
  ) {}

  async initialize(): Promise<void> {
    try {
      // Step 1: Initialize and select version
      const config = await this.getConfiguration();
      const initResult = await this.initializeAdapter.execute({ config });

      // Step 2: Load Memberstack library
      const loadResult = await this.loadMemberstack.execute({
        version: initResult.version,
        config
      });

      // Step 3: Transform DOM (pre-load transformations done earlier)
      const member = await loadResult.api.getCurrentMember();
      await this.transformDOM.execute({
        version: initResult.version,
        planMappings: this.planMappingService.getAllPlans(),
        member
      });

      // Step 4: Create V1 API proxy if using V2
      if (initResult.version.isV2()) {
        const apiResult = this.createLegacyAPI.execute({
          v2API: loadResult.api,
          planMapper: this.planMappingService
        });

        this.exposeAPI(apiResult.v1API);
      } else {
        this.exposeAPI(loadResult.api);
      }

      this.logger.info('Adapter initialization complete');
    } catch (error) {
      this.logger.error('Adapter initialization failed', error);
      throw error;
    }
  }

  private async getConfiguration(): Promise<AdapterConfiguration> {
    // Get from repository
  }

  private exposeAPI(api: IMemberstackAPI): void {
    (window as any).MemberStack = api;
  }
}
```

### Presenters

#### 1. **VersionIndicatorPresenter**
```typescript
// src/adapters/presenters/VersionIndicatorPresenter.ts
export interface VersionIndicatorViewModel {
  text: string;
  backgroundColor: string;
  visible: boolean;
}

export class VersionIndicatorPresenter {
  present(version: MemberstackVersion, showVersion: boolean): VersionIndicatorViewModel {
    if (!showVersion) {
      return {
        text: '',
        backgroundColor: '',
        visible: false
      };
    }

    return {
      text: version.isV2() ? 'MS V2' : 'MS V1',
      backgroundColor: version.isV2() ? '#10b981' : '#6366f1',
      visible: true
    };
  }
}
```

### Mappers

#### 1. **MemberMapper**
```typescript
// src/adapters/mappers/MemberMapper.ts
export class MemberMapper implements IMemberMapper {
  toDomain(data: any): Member {
    const memberId = new MemberId(data.id);
    const email = new Email(data.auth?.email ?? '');
    const memberships = (data.planConnections ?? []).map((pc: any) =>
      this.mapMembership(pc)
    );
    const metadata = new MemberMetadata({
      createdAt: new Date(data.createdAt),
      customFields: data.customFields ?? {}
    });

    return new Member(memberId, email, memberships, metadata);
  }

  toDTO(member: Member): any {
    return {
      id: member.getId(),
      auth: {
        email: member.getEmail()
      },
      planConnections: member.getMemberships().map(m => this.mapMembershipToDTO(m)),
      customFields: member.getMetadata().customFields
    };
  }

  private mapMembership(data: any): Membership {
    // Mapping logic
  }

  private mapMembershipToDTO(membership: Membership): any {
    // Reverse mapping logic
  }
}
```

### DOM Transformers

```typescript
// src/adapters/transformers/IDOMTransformer.ts
export interface IDOMTransformer {
  getName(): string;
  shouldApply(request: TransformDOMRequest): boolean;
  transform(request: TransformDOMRequest): Promise<TransformResult>;
}

export interface TransformResult {
  modificationsCount: number;
  errors: Error[];
}
```

#### 1. **PlanAttributeTransformer**
```typescript
// src/adapters/transformers/PlanAttributeTransformer.ts
export class PlanAttributeTransformer implements IDOMTransformer {
  constructor(
    private readonly document: Document,
    private readonly planMapper: IPlanMappingService
  ) {}

  getName(): string {
    return 'PlanAttributeTransformer';
  }

  shouldApply(request: TransformDOMRequest): boolean {
    return request.version.isV2();
  }

  async transform(request: TransformDOMRequest): Promise<TransformResult> {
    let count = 0;
    const errors: Error[] = [];

    // Transform data-ms-plan attributes
    const planElements = this.document.querySelectorAll('[data-ms-plan]');

    for (const element of Array.from(planElements)) {
      try {
        const v1Id = element.getAttribute('data-ms-plan');
        if (!v1Id) continue;

        const plan = this.planMapper.mapV1ToV2(new PlanId(v1Id));
        if (!plan) {
          errors.push(new Error(`No mapping found for plan ID: ${v1Id}`));
          continue;
        }

        // Remove old attribute
        element.removeAttribute('data-ms-plan');

        // Add new attribute based on type
        if (plan.isPrice()) {
          element.setAttribute('data-ms-price:update', plan.getV2Id());
        } else {
          element.setAttribute('data-ms-plan:add', plan.getV2Id());
        }

        count++;
      } catch (error) {
        errors.push(error as Error);
      }
    }

    return { modificationsCount: count, errors };
  }
}
```

#### 2. **MemberDataAttributeTransformer**
```typescript
// src/adapters/transformers/MemberDataAttributeTransformer.ts
export class MemberDataAttributeTransformer implements IDOMTransformer {
  constructor(private readonly document: Document) {}

  getName(): string {
    return 'MemberDataAttributeTransformer';
  }

  shouldApply(request: TransformDOMRequest): boolean {
    return request.version.isV2() && request.member !== null;
  }

  async transform(request: TransformDOMRequest): Promise<TransformResult> {
    if (!request.member) {
      return { modificationsCount: 0, errors: [] };
    }

    let count = 0;
    const elements = this.document.querySelectorAll('[data-ms-member]');

    for (const element of Array.from(elements)) {
      const attribute = element.getAttribute('data-ms-member');
      if (!attribute) continue;

      const value = this.extractValue(request.member, attribute);
      if (value !== null) {
        element.textContent = value;
        count++;
      }
    }

    return { modificationsCount: count, errors: [] };
  }

  private extractValue(member: Member, path: string): string | null {
    switch (path) {
      case 'membership.name':
        return member.getActiveMembership()?.getPlanName() ?? null;
      case 'membership.amount':
        return member.getActiveMembership()?.getAmount().format() ?? null;
      case 'membership.status':
        return member.getActiveMembership()?.getStatusString() ?? null;
      default:
        return null;
    }
  }
}
```

---

## Frameworks & Drivers Layer

External dependencies and infrastructure.

### Script Loader

```typescript
// src/infrastructure/loaders/ScriptLoader.ts
export class ScriptLoader implements IScriptLoader {
  constructor(
    private readonly document: Document,
    private readonly scripts: Map<MemberstackVersion, string>
  ) {}

  async load(version: MemberstackVersion): Promise<void> {
    const scriptContent = this.scripts.get(version);
    if (!scriptContent) {
      throw new Error(`No script found for version: ${version.toString()}`);
    }

    return new Promise((resolve, reject) => {
      try {
        const script = this.document.createElement('script');
        script.textContent = scriptContent;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Script loading failed'));
        this.document.head.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  }
}
```

### Storage Abstraction

```typescript
// src/infrastructure/storage/IStorage.ts
export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// src/infrastructure/storage/LocalStorageAdapter.ts
export class LocalStorageAdapter implements IStorage {
  constructor(private readonly localStorage: Storage) {}

  getItem(key: string): string | null {
    return this.localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    this.localStorage.removeItem(key);
  }

  clear(): void {
    this.localStorage.clear();
  }
}
```

### Logger

```typescript
// src/infrastructure/logging/ConsolaLogger.ts
import { createConsola } from 'consola';

export class ConsolaLogger implements ILogger {
  private readonly consola: ReturnType<typeof createConsola>;

  constructor(level: LogLevel) {
    this.consola = createConsola({ level });
  }

  info(message: string, ...args: any[]): void {
    this.consola.info(message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.consola.debug(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.consola.error(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.consola.warn(message, ...args);
  }
}
```

---

## Dependency Flow

```
┌──────────────────────────────────────────────────────────┐
│                      main.ts                             │
│                 (Composition Root)                       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ creates & injects
                     ▼
┌──────────────────────────────────────────────────────────┐
│              AdapterController                           │
│  (Interface Adapter - orchestrates use cases)            │
└─────┬──────────┬──────────┬──────────┬────────────────────┘
      │          │          │          │
      │ uses     │ uses     │ uses     │ uses
      ▼          ▼          ▼          ▼
   ┌─────┐   ┌──────┐  ┌────────┐  ┌──────────┐
   │Init │   │Load  │  │Transform│ │CreateAPI │
   │Adapt│   │MS    │  │DOM     │  │          │
   └──┬──┘   └──┬───┘  └───┬────┘  └────┬─────┘
      │         │          │             │
      │ uses    │ uses     │ uses        │ uses
      ▼         ▼          ▼             ▼
   ┌──────────────────────────────────────────┐
   │         Domain Services                  │
   │  - VersionSelectionService               │
   │  - PlanMappingService                    │
   └───────────────┬──────────────────────────┘
                   │
                   │ operates on
                   ▼
   ┌──────────────────────────────────────────┐
   │         Domain Entities                  │
   │  - Member, Membership, Plan, Session     │
   │  - Value Objects (Email, PlanId, etc.)   │
   └──────────────────────────────────────────┘
```

### Dependency Injection Container

```typescript
// src/main.ts (Composition Root)
export class CompositionRoot {
  private container: DIContainer;

  constructor() {
    this.container = this.buildContainer();
  }

  private buildContainer(): DIContainer {
    const container = new DIContainer();

    // Infrastructure
    container.register('IStorage', () =>
      new LocalStorageAdapter(window.localStorage)
    );
    container.register('ILogger', () =>
      new ConsolaLogger(this.getLogLevel())
    );
    container.register('Document', () => document);
    container.register('Window', () => window);

    // Repositories
    container.register('ISessionRepository', (c) =>
      new LocalStorageSessionRepository(
        c.resolve('IStorage'),
        c.resolve('SessionMapper')
      )
    );
    container.register('IConfigurationRepository', (c) =>
      new WindowConfigurationRepository(
        c.resolve('Window'),
        c.resolve('ConfigurationMapper'),
        c.resolve('IConfigurationValidator')
      )
    );

    // Domain Services
    container.register('IVersionSelectionService', () =>
      new VersionSelectionService()
    );
    container.register('IPlanMappingService', (c) => {
      const config = c.resolve('AdapterConfiguration');
      const plans = this.buildPlanRegistry(config);
      return new PlanMappingService(plans);
    });

    // Use Cases
    container.register('InitializeAdapter', (c) =>
      new InitializeAdapter(
        c.resolve('IVersionSelectionService'),
        c.resolve('ISessionRepository'),
        c.resolve('IConfigurationValidator'),
        c.resolve('ILogger')
      )
    );
    container.register('LoadMemberstack', (c) =>
      new LoadMemberstack(
        c.resolve('IScriptLoader'),
        c.resolve('IMemberstackAPIFactory'),
        c.resolve('ILogger')
      )
    );
    container.register('TransformDOM', (c) =>
      new TransformDOM(
        this.buildTransformers(c),
        c.resolve('ILogger')
      )
    );
    container.register('CreateLegacyAPI', (c) =>
      new CreateLegacyAPI(
        c.resolve('IAPIProxyBuilder'),
        c.resolve('IObjectMapper'),
        c.resolve('ILogger')
      )
    );

    // Controller
    container.register('AdapterController', (c) =>
      new AdapterController(
        c.resolve('InitializeAdapter'),
        c.resolve('LoadMemberstack'),
        c.resolve('TransformDOM'),
        c.resolve('CreateLegacyAPI'),
        c.resolve('IPlanMappingService'),
        c.resolve('ILogger')
      )
    );

    return container;
  }

  private buildTransformers(container: DIContainer): IDOMTransformer[] {
    return [
      new PlanAttributeTransformer(
        container.resolve('Document'),
        container.resolve('IPlanMappingService')
      ),
      new MemberDataAttributeTransformer(
        container.resolve('Document')
      ),
      new HashUrlTransformer(
        container.resolve('Document'),
        container.resolve('IPlanMappingService')
      ),
      // ... other transformers
    ];
  }

  getController(): AdapterController {
    return this.container.resolve('AdapterController');
  }
}

// Entry point
(async () => {
  const root = new CompositionRoot();
  const controller = root.getController();
  await controller.initialize();
})();
```

---

## Proposed Directory Structure

```
src/
├── domain/                                 # Enterprise Business Rules
│   ├── entities/
│   │   ├── Member.ts
│   │   ├── Membership.ts
│   │   ├── Plan.ts
│   │   └── Session.ts
│   ├── value-objects/
│   │   ├── MemberstackVersion.ts
│   │   ├── PlanId.ts
│   │   ├── MemberId.ts
│   │   ├── Email.ts
│   │   ├── Money.ts
│   │   ├── Currency.ts
│   │   ├── SessionToken.ts
│   │   └── PlanName.ts
│   └── services/
│       ├── PlanMappingService.ts
│       ├── VersionSelectionService.ts
│       └── MembershipValidationService.ts
│
├── use-cases/                              # Application Business Rules
│   ├── InitializeAdapter.ts
│   ├── LoadMemberstack.ts
│   ├── TransformDOM.ts
│   ├── CreateLegacyAPI.ts
│   ├── AuthenticateMember.ts
│   ├── LogoutMember.ts
│   ├── GetCurrentMember.ts
│   └── interfaces/                         # Abstractions (Dependency Inversion)
│       ├── ISessionRepository.ts
│       ├── IMemberRepository.ts
│       ├── IConfigurationRepository.ts
│       ├── IMemberstackAPI.ts
│       ├── IScriptLoader.ts
│       ├── ILogger.ts
│       ├── IStorage.ts
│       └── IDOMTransformer.ts
│
├── adapters/                               # Interface Adapters
│   ├── controllers/
│   │   └── AdapterController.ts
│   ├── presenters/
│   │   └── VersionIndicatorPresenter.ts
│   ├── repositories/
│   │   ├── LocalStorageSessionRepository.ts
│   │   ├── LocalStorageMemberRepository.ts
│   │   └── WindowConfigurationRepository.ts
│   ├── gateways/
│   │   ├── MemberstackV1Gateway.ts
│   │   └── MemberstackV2Gateway.ts
│   ├── mappers/
│   │   ├── MemberMapper.ts
│   │   ├── SessionMapper.ts
│   │   ├── ConfigurationMapper.ts
│   │   └── PlanMapper.ts
│   ├── transformers/                       # DOM Transformers
│   │   ├── PlanAttributeTransformer.ts
│   │   ├── MemberDataAttributeTransformer.ts
│   │   ├── HashUrlTransformer.ts
│   │   ├── FormAttributeTransformer.ts
│   │   ├── AuthenticationVisibilityTransformer.ts
│   │   └── UtilityAttributeTransformer.ts
│   ├── validators/
│   │   └── ConfigurationValidator.ts
│   └── builders/
│       ├── APIProxyBuilder.ts
│       └── PlanRegistryBuilder.ts
│
├── infrastructure/                         # Frameworks & Drivers
│   ├── loaders/
│   │   └── ScriptLoader.ts
│   ├── storage/
│   │   ├── IStorage.ts
│   │   └── LocalStorageAdapter.ts
│   ├── logging/
│   │   ├── ILogger.ts
│   │   └── ConsolaLogger.ts
│   └── di/
│       └── DIContainer.ts
│
├── shared/                                 # Shared utilities (can be used by any layer)
│   ├── Result.ts                           # Result monad for error handling
│   ├── Either.ts                           # Either monad
│   └── ValidationResult.ts
│
├── vendor/                                 # External libraries (unchanged)
│   └── memberstack/
│       ├── memberstack-v1.js
│       ├── memberstack-v2.js
│       └── index.ts
│
├── types/                                  # TypeScript definitions (unchanged)
│   ├── globals.d.ts
│   ├── v1-entities.ts
│   └── v2-entities.ts
│
└── main.ts                                 # Composition Root & Entry Point
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create domain entities (Member, Membership, Plan, Session)
- [ ] Create value objects (MemberstackVersion, PlanId, Email, Money)
- [ ] Create domain services (PlanMappingService, VersionSelectionService)
- [ ] Write unit tests for domain layer (100% coverage)

### Phase 2: Use Cases (Week 2)
- [ ] Define use case interfaces (repositories, gateways, etc.)
- [ ] Implement InitializeAdapter use case
- [ ] Implement LoadMemberstack use case
- [ ] Implement TransformDOM use case
- [ ] Implement CreateLegacyAPI use case
- [ ] Write unit tests for use cases

### Phase 3: Interface Adapters (Week 3)
- [ ] Implement repositories (LocalStorage, Window)
- [ ] Implement gateways (V1, V2)
- [ ] Implement mappers (Member, Session, Configuration)
- [ ] Implement transformers (Plan attributes, Member data, etc.)
- [ ] Implement validators
- [ ] Write integration tests

### Phase 4: Infrastructure (Week 4)
- [ ] Implement ScriptLoader
- [ ] Implement Storage abstraction
- [ ] Implement Logger abstraction
- [ ] Implement DI Container
- [ ] Create composition root

### Phase 5: Migration & Testing (Week 5)
- [ ] Gradually migrate existing code to new architecture
- [ ] Maintain backward compatibility during migration
- [ ] Write end-to-end tests
- [ ] Performance testing
- [ ] Documentation updates

### Phase 6: Cleanup (Week 6)
- [ ] Remove old code
- [ ] Final testing
- [ ] Code review
- [ ] Deployment

---

## Benefits

### 1. **Testability**
- Domain logic can be tested without browser/DOM dependencies
- Use cases can be tested with mock repositories
- Each layer can be tested independently

### 2. **Maintainability**
- Clear separation of concerns
- Easy to locate and modify code
- Self-documenting architecture

### 3. **Scalability**
- Easy to add new features (new use cases, transformers, etc.)
- Easy to swap implementations (e.g., different storage mechanisms)
- Easy to extend without modifying existing code (Open/Closed Principle)

### 4. **Flexibility**
- Infrastructure dependencies can be swapped without affecting business logic
- Easy to add support for V3, V4, etc.
- Easy to support different platforms (Node.js, React Native, etc.)

### 5. **Team Collaboration**
- Clear boundaries enable parallel development
- New developers can understand the system quickly
- Consistent patterns across the codebase

### 6. **Error Handling**
- Centralized error handling in use cases
- Type-safe error propagation with Result/Either monads
- Clear error boundaries

### 7. **Performance**
- Lazy loading of dependencies
- Easy to implement caching at repository level
- Easy to optimize specific use cases

---

## Comparison: Current vs Proposed

| Aspect | Current Architecture | Proposed Architecture |
|--------|---------------------|----------------------|
| **Layers** | Informal separation | 4 explicit layers with dependency rules |
| **Testing** | Requires browser environment | Domain/use cases testable without browser |
| **Dependencies** | Mixed throughout codebase | Clear dependency direction (inward) |
| **Reusability** | Tightly coupled to DOM | Business logic reusable across platforms |
| **Extensibility** | Requires modifying existing code | Add new use cases/transformers without changing existing |
| **Readability** | Procedural flow | Use case driven, self-documenting |
| **Type Safety** | TypeScript types | Domain-driven value objects |
| **Error Handling** | Try/catch scattered | Centralized in use cases, Result monads |

---

## Next Steps

1. **Review & Feedback**: Gather feedback from team on this proposal
2. **Spike**: Create a proof-of-concept for one use case (e.g., InitializeAdapter)
3. **Approval**: Get approval to proceed with full implementation
4. **Implementation**: Follow the roadmap above
5. **Continuous Improvement**: Iterate and refine based on learnings

---

## Conclusion

This clean architecture proposal provides a solid foundation for the Memberstack Legacy Adapter that will:
- Improve code quality and maintainability
- Enable easier testing and debugging
- Facilitate future enhancements
- Follow industry best practices

The investment in this refactoring will pay dividends in reduced maintenance costs, faster feature development, and improved developer experience.

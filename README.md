# Memberstack Legacy Adapter
![Version](https://img.shields.io/badge/version-v0.0.5-blue)


The **Memberstack Legacy Adapter** is a small compatibility layer (also known as a **shim**) that helps safely transition from **Memberstack 1.0** to **2.0**.

> A *shim* is a piece of code that sits between two systems to make them compatible. In this case, the adapter lets custom code written for Memberstack 1.0 keep working, even if the underlying library has been upgraded to 2.0.
## 🚀 Overview

Many existing projects rely on Memberstack 1.0 with custom code that’s challenging to upgrade. This shim allows us to:
- Load Memberstack 2.0 for selected users.
- Automatically translate 2.0’s methods and member object into the 1.0 format.
- Run real-world tests in production while maintaining stability.
- Gradually transition users with minimal disruption.

## 🧩 How It Works

- **Default Behavior:** Memberstack 1.0 continues to run for all users.
- **Shim Activation:** A config (via cookie, query param, or flag) enables the shim for specific users.
- **Version Adapter:** If enabled, the adapter disables 1.0, loads 2.0, and adapts the interface so existing custom code still works.
- **Testing Flexibility:** Can also be tested in cloned or staging sites with complex customizations.
- **Monitoring:** Logs or tracking can be added to monitor errors or API usage for early issue detection.

## ⚙️ Config Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `adapter.enabled` | `boolean` | No | `true` | Enable/disable the adapter functionality |
| `adapter.currentVersion` | `"v1"` or `"v2"` | No | `"v1"` | Memberstack API version to use |
| `adapter.importedMemberships` | `Record<string, string>` | No | `{}` | Mapping of membership IDs for migration |
| `appIdV1` | `string` | Yes | - | Your Memberstack V1 App ID |
| `publicKey` | `string` | Yes | - | Your Memberstack V2 Public Key |
| `appId` | `string` | Yes | - | Your Memberstack V2 App ID |
| `debug` | `boolean` | No | `true` | Enable debug logging |


## ✅ Benefits
- Zero downtime
- Legacy code compatibility
- Easy rollback if issues arise
- Faster iteration and debugging
- Option to keep the adapter after full rollout for long-term stability

## 📦 Project Structure
WIP

```markdown
main.js (entry point)
│
├──→ loader/detect-env.ts
│     └── decides whether to enable the adapter
│
├──→ if enabled:
│     ├── dynamically import $memberstackDom (2.0)
│     ├── adapter/v2-wrapper.ts
│     │     └── wraps 2.0 API into a unified interface
│     │
│     ├── adapter/compatibility-map.ts
│     │     └── maps method/field names from v1 to v2
│     │
│     └── adapter/v1-api.ts
│           └── mimics MemberStack 1.0 API
│               and exposes it globally via:
│
└──→ window.MemberStack = Proxy(adapter)

Your legacy custom code
└── continues calling window.MemberStack like before
    but it's routed to 2.0 behavior via the shim

```

## 🧪 Get started

### Install

```html
<script src="https://cdn.jsdelivr.net/gh/raqlo/memberstack-legacy-adaper@v0.0.5/dist/memberstack-adapter.js"></script>
```


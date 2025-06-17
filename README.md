# Memberstack Legacy Adapter

![Version](https://img.shields.io/badge/version-v0.0.2-blue)

The **Memberstack Legacy Adapter** is a small compatibility layer (also known as a **shim**) that helps safely
transition from **Memberstack 1.0** to **2.0**.

> A *shim* is a piece of code that sits between two systems to make them compatible. In this case, the adapter lets
> custom code written for Memberstack 1.0 keep working, even if the underlying library has been upgraded to 2.0.

## 🚀 Overview

Many existing projects rely on Memberstack 1.0 with custom code that’s challenging to upgrade. This shim allows us to:

- Load Memberstack 2.0 for selected users.
- Automatically translate 2.0’s methods and member object into the 1.0 format.
- Run real-world tests in production while maintaining stability.
- Gradually transition users with minimal disruption.

## 🧩 How It Works

- **Default Behavior:** Memberstack 1.0 continues to run for all users.
- **Shim Activation:** A config (via cookie, query param, or flag) enables the shim for specific users.
- **Version Adapter:** If enabled, the adapter disables 1.0, loads 2.0, and adapts the interface so existing custom code
  still works.
- **Testing Flexibility:** Can also be tested in cloned or staging sites with complex customizations.
- **Monitoring:** Logs or tracking can be added to monitor errors or API usage for early issue detection.

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
│ └── decides whether to enable the adapter
│
├──→ if enabled:
│ ├── dynamically import $memberstackDom (2.0)
│ ├── adapter/v2-wrapper.ts
│ │ └── wraps 2.0 API into a unified interface
│ │
│ ├── adapter/compatibility-map.ts
│ │ └── maps method/field names from v1 to v2
│ │
│ └── adapter/v1-api.ts
│ └── mimics MemberStack 1.0 API
│ and exposes it globally via:
│
└──→ window.MemberStack = Proxy(adapter)

Your legacy custom code
└── continues calling window.MemberStack like before
but it's routed to 2.0 behavior via the shim

```

## 🧪 Get started

### Install

```html
<script>
    window.memberstackConfig = {
        adapter: {
            enabled: true,
            importedMemberships: {"V1_MEMBERSHIP_ID": "pln_V2_MEMBERSHIP_ID", 'V1_PAID_MEMBERSHIP_ID': 'prc_V2_MEMBERSHIP_ID'},
        },
        appIdV1: 'YOUR_V1_APP_ID',
        publicKey: 'YOUR_V2_PUBLIC_KEY',
        appId: 'YOUR_V1_APP_ID',
        debug: true
    }
</script>
<script src="https://cdn.jsdelivr.net/gh/raqlo/memberstack-legacy-adaper@v0.0.5/dist/memberstack-adapter.js"></script>
```
## ⚙️ Config Options

## Configuration Properties

| Property                      | Type                     | Required | Default     | Description                                                   |
|-------------------------------|--------------------------|----------|-------------|---------------------------------------------------------------|
| `appIdV1`                     | `string`                 | **Yes**  | -           | Your Memberstack V1 App ID                                    |
| `publicKey`                   | `string`                 | No       | -           | Your Memberstack V2 Public Key (starts with `pk_` or `pk_sb`) |
| `appId`                       | `string`                 | **Yes**  | -           | Your Memberstack V2 App ID (starts with `app_cl`)             |
| `debug`                       | `boolean`                | No       | `true`      | Enable debug logging in console                               |
| `adapter.enabled`             | `boolean`                | No       | `true`      | Enable/disable the adapter functionality                      |
| `adapter.forcedVersion`       | `"v1"` or `"v2"`         | No       | `undefined` | Force a specific version regardless of other settings         |
| `adapter.importedMemberships` | `Record<string, string>` | No       | `{}`        | Maps V1 membership IDs to V2 membership IDs for migration     |


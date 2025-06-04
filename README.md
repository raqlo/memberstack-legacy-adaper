# Memberstack Legacy Adapter

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
WIP
```js
window.__MS_ADAPTER_CONFIG__ = {
  enabled: true, // or false to disable
  mode: "auto", // options: "cookie", "query", "manual"
  debug: true, // logs to console for development
};

```

## ✅ Benefits
- Zero downtime
- Legacy code compatibility
- Easy rollback if issues arise
- Faster iteration and debugging
- Option to keep the adapter after full rollout for long-term stability

## 📦 Project Structure
WIP

## 🧪 Get started
WIP

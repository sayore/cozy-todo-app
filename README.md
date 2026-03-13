# Cozy Todo Demo App

This is a reference implementation showing how to build a service using the `@cozy/server` Next-Gen Framework.

## 🌟 What this demo uses:

1.  **Modular Routing:** Using `app.route()` with Radix-tree speed.
2.  **SSO Authentication:** Demonstrates how the framework automatically handles JWTs and populates `req.user`.
3.  **Global Role Checks:** Uses `globalRoles: ['superadmin']` to secure administrative actions.
4.  **Cluster Discovery:** Shows how the app negotiates its port and domain with C3.
5.  **Telemetry:** Exposes the automatically generated `/__meta/endpoints` registry.
6.  **Global Middlewares:** A custom logger and header injector.

## 🚀 How to Run

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Start the app:**
    ```bash
    pnpm dev
    ```

3.  **Interact:**
    -   `GET /`: Welcome message.
    -   `GET /login`: Get a demo JWT token.
    -   `GET /todos`: Get todos (Requires the JWT in Header).
    -   `GET /__meta/endpoints`: See how the framework views the app.

## 🛡 Security Logic Breakdown

-   **Public:** Anyone can see the root.
-   **SSO + Role:** `/todos` checks that you are a user OR an admin.
-   **SSO + Global Role:** `/admin/purge` checks if you are a `superadmin` across the entire cluster.
-   **mTLS (Internal):** The `/__meta` routes are reserved for Control Center interaction (mTLS).

---
Built to test and verify `@cozy/server` v1.1.0.

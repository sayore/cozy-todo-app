import { CozyServer } from '@cozy/server';
import { getSsoConfig } from '@cozy/sso-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 🛠 CONFIGURATION
const PORT = 4005;

const app = new CozyServer({
    name: 'todo-service',
    description: 'A Next-Gen Zero-Trust Todo Application',
    icon: '✅',
    roles: ['admin', 'user'],
    port: PORT,
    // Note: auth.jwtSecrets will be auto-fetched from Hub by framework on start()
    discovery: {
        controllerUrl: process.env.CONTROLLER_URL || 'http://localhost:3090',
        preferredDomain: 'todo.cozy.suite'
    }
});

app.use((req, res) => {
    res.setHeader('X-Cozy-Version', '2.0.0-ZeroTrust');
});

/**
 * 1. VISUAL INTERFACE (Brutalist UI)
 */
app.route({
    path: '/',
    method: 'GET',
    auth: { type: 'public' },
    handler: () => {
        const htmlPath = path.join(__dirname, '../public/index.html');
        if (fs.existsSync(htmlPath)) {
            return { __raw: fs.readFileSync(htmlPath, 'utf8'), __type: 'text/html' };
        }
        return { status: 'online', message: 'Welcome! (Frontend file missing)' };
    }
});

/**
 * 2. AUTHENTICATION (Real SSO Redirect)
 */
app.route({
    path: '/api/login',
    method: 'GET',
    auth: { type: 'public' },
    handler: async (req) => {
        const config = await getSsoConfig();
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const returnUrl = req.url.searchParams.get('returnUrl') || `${protocol}://${req.headers.host}/`;
        const redirectUrl = `${config.authServerUrl}/login?returnUrl=${encodeURIComponent(returnUrl)}`;
        
        return { 
            __raw: `<html><head><meta http-equiv="refresh" content="0; url=${redirectUrl}"></head><body style="font-family:monospace; padding:20px;">Redirecting to SSO Hub...</body></html>`, 
            __type: 'text/html' 
        };
    }
});

app.route({
    path: '/api/whoami',
    method: 'GET',
    auth: { type: 'sso' },
    handler: (req) => {
        return {
            user: req.user
        };
    }
});

/**
 * 3. TODO API (Secure)
 * Framework handles JWT verification and role extraction automatically.
 */
const todos = [
    { id: 1, text: 'Build a next-gen framework', completed: true, owner: 'admin@cozy.suite' },
    { id: 2, text: 'Deploy Todo App', completed: false, owner: 'user@cozy.suite' }
];

app.route({
    path: '/api/todos',
    method: 'GET',
    auth: { type: 'sso', roles: ['admin', 'user'] },
    handler: (req) => {
        // req.user is now a full UserPayload with resolved roles
        return todos.filter(t => t.owner === req.user.email || req.user.globalRoles?.includes('superadmin') || req.user.role === 'admin');
    }
});

app.route({
    path: '/api/todos',
    method: 'POST',
    auth: { type: 'sso' },
    handler: (req) => {
        const newTodo = {
            id: Date.now(),
            text: req.body.text,
            completed: false,
            owner: req.user.email
        };
        todos.push(newTodo);
        return newTodo;
    }
});

/**
 * 4. ADMIN PURGE (Global Role / SuperAdmin God-Mode)
 */
app.route({
    path: '/api/admin/purge',
    method: 'POST',
    auth: { type: 'sso', globalRoles: ['superadmin'] },
    handler: () => {
        todos.length = 0;
        return { message: 'Cluster-wide purge complete. (Executed with SuperAdmin privileges)' };
    }
});

async function boot() {
    try {
        await app.start();
        const info = (app as any).lease || { port: PORT, domain: 'localhost' };
        console.log(`\n✅ TODO APP LIVE (Zero-Trust) at http://${info.domain}:${info.port}`);
    } catch (e) {
        console.error('Failed to boot app:', e);
    }
}

boot();

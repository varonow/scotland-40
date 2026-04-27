/* ============================================
   SCOTLAND 40 — Shared Auth & Supabase Setup
   js/supabase.js
   ============================================ */

const SUPABASE_URL = 'https://uzdefjgipyrhqucjwpmj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_eYKUMrnIV3UeqN60KFH-tQ_yr47YF8M';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================================
   AUTH HELPERS
   ============================================ */

async function requireAuth() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  injectSignOutButton();
  return user;
}

function injectSignOutButton() {
  // Don't add it twice
  if (document.getElementById('floating-signout')) return;

  const btn = document.createElement('button');
  btn.id = 'floating-signout';
  btn.textContent = 'Sign Out';
  btn.onclick = signOut;
  document.body.appendChild(btn);
}

// Call this on login/register pages — redirects home if already signed in
async function redirectIfLoggedIn() {
  const { data: { session } } = await db.auth.getSession();
  if (session) window.location.href = '/index.html';
}

// Get the current logged in user
async function getCurrentUser() {
  const { data: { session } } = await db.auth.getSession();
  return session ? session.user : null;
}

// Get the current user's profile from allowed_users table
async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data } = await db
    .from('allowed_users')
    .select('name, email, is_admin')
    .eq('email', user.email)
    .single();

  return data;
}

// Check if current user is admin
async function isAdmin() {
  const profile = await getUserProfile();
  return profile ? profile.is_admin : false;
}

// Guest email — read-only observer account
const GUEST_EMAIL = 'varonow@yahoo.com';

// Check if current user is the guest/observer account
async function isGuest() {
  const user = await getCurrentUser();
  return user ? user.email.toLowerCase() === GUEST_EMAIL.toLowerCase() : false;
}

// Sign out
async function signOut() {
  await db.auth.signOut();
  window.location.href = '/login.html';
}
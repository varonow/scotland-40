/* ============================================
   SCOTLAND 40 — Shared Auth & Supabase Setup
   js/supabase.js
   ============================================ */

const SUPABASE_URL = 'https://uzdefjgipyrhqucjwpmj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_eYKUMrnIV3UeqN60KFH-tQ_yr47YF8M';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================================
   SHARED NAVIGATION
   Single source of truth for the menu.
   To add/remove/rename a menu item, just edit
   the NAV_ITEMS array below.
   ============================================ */

const NAV_ITEMS = [
  { href: 'index.html',           emoji: '🏰', label: 'Home' },
  { href: 'index.html#flights',   emoji: '✈️', label: 'Flights' },
  { href: 'index.html#hotels',    emoji: '🏨', label: 'Hotels' },
  { href: 'index.html#itinerary', emoji: '📅', label: 'Itinerary' },
  { href: 'guide.html',           emoji: '📍', label: 'Local Guide' },
  { href: 'tips.html',            emoji: '💡', label: 'Travel Tips' },
  { href: 'group.html',           emoji: '👭', label: 'The Girls' },
  { href: 'rooms.html',           emoji: '🛏️', label: 'Room Draw' },
  { href: 'messages.html',        emoji: '💬', label: 'Birthday Messages' },
  { href: 'journal.html',         emoji: '📖', label: 'Journal' },
  { href: 'photos.html',          emoji: '📸', label: 'Photos' },
  { href: 'hunt.html',            emoji: '🔍', label: 'Scavenger Hunt' },
  { href: 'packing.html',         emoji: '🧳', label: 'Packing List' }
];

function injectNav() {
  // Don't inject twice
  if (document.getElementById('shared-nav')) return;

  const linksHTML = NAV_ITEMS.map(item =>
  `<a href="${item.href}" onclick="setTimeout(closeMenu,50)">${item.emoji} ${item.label}</a>`
).join('');

  const navHTML = `
    <div id="shared-nav">
      <div class="nav-bar">
        <button class="hamburger" id="hamburger" onclick="toggleMenu()" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="nav-dropdown" id="navDropdown">
        <div class="nav-dropdown-inner">
          ${linksHTML}
        </div>
      </div>
      <div class="nav-overlay" id="navOverlay" onclick="closeMenu()"></div>
    </div>
  `;

  document.body.insertAdjacentHTML('afterbegin', navHTML);
}

function toggleMenu() {
  document.getElementById('hamburger').classList.toggle('open');
  document.getElementById('navDropdown').classList.toggle('open');
  document.getElementById('navOverlay').classList.toggle('open');
}

function closeMenu() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('navDropdown').classList.remove('open');
  document.getElementById('navOverlay').classList.remove('open');
}

/* ============================================
   AUTH HELPERS
   ============================================ */

async function requireAuth() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  injectNav();
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

/* ============================================
   SERVICE WORKER REGISTRATION
   Enables offline support & "Add to Home Screen"
   ============================================ */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service worker registered:', reg.scope))
      .catch(err => console.log('Service worker registration failed:', err));
  });
}
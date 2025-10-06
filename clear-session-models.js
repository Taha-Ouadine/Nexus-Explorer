// Simple script to clear session models from localStorage
// This will be run in the browser console to clear existing session models

console.log("🧹 Clearing all session models from localStorage...");

// Clear the session models key
localStorage.removeItem('nexus_explorers_session_models');

// Also clear any other related keys that might exist
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.includes('nexus') || key && key.includes('model')) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`🗑️ Removed: ${key}`);
});

console.log("✅ Session models cleared! Refresh the page to see the changes.");

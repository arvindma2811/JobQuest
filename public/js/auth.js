// =========================
// AUTH.JS – SIMPLE FRONTEND AUTH
// =========================

function loginUser(userData) {
  // userData should already include imageData if present
  localStorage.setItem('user', JSON.stringify(userData));
  window.location.href = 'index.html';
}


function registerUser(userData) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const exists = users.find(u => u.email === userData.email);
  if (exists) {
    alert("User already exists! Please log in.");
    window.location.href = 'login.html';
    return;
  }
  users.push(userData);
  localStorage.setItem('users', JSON.stringify(users));
  alert("Registration successful! Please log in.");
  window.location.href = 'login.html';
}


// Check login state
function checkAuth() {
  const user = JSON.parse(localStorage.getItem('user'));
  // Redirect protection for protected pages
  const protectedPages = ['profile.html', 'analysis.html']; // adjust list
  const currentPage = location.pathname.split('/').pop();

  if (!user) {
    if (protectedPages.includes(currentPage)) {
      window.location.href = 'login.html';
      return;
    }
    // if not logged in, you might want to show 'Login' text. But leave navbar as-is.
    return;
  }

  // if logged in, update profile li
  const profileLi = document.querySelector('.profile');
  if (profileLi) {
    const imageSrc = user.imageData && user.imageData.length ? user.imageData : 'images/Pfp.jpeg';
    // Keep .dropdown class so hover works
    profileLi.classList.add('dropdown');
    profileLi.innerHTML = `
      <a href="#profile">
        <img class="profile-pic" src="${imageSrc}" alt="Profile picture" onerror="this.onerror=null; this.src='images/Pfp.jpeg'">
        <span class="profile-text">${escapeHtml(user.name)}</span>
      </a>
      <ul class="dropdown-content">
        <li><a href="profile.html">View Profile</a></li>
        <li><a href="#" onclick="logout()">Logout</a></li>
      </ul>
    `;
  }
}

// small helper to avoid XSS-ish display via names (very basic)
function escapeHtml(unsafe) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


// Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
document.addEventListener('DOMContentLoaded', checkAuth);

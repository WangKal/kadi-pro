// ===== Utility: Show Loader Overlay =====
function showLoader() {
  let loader = document.getElementById("loaderOverlay");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "loaderOverlay";
    loader.style.position = "fixed";
    loader.style.top = 0;
    loader.style.left = 0;
    loader.style.width = "100vw";
    loader.style.height = "100vh";
    loader.style.background = "rgba(0, 0, 0, 0.5)";
    loader.style.zIndex = 9999;
    loader.innerHTML = `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                  color: white; font-size: 1.5em;">
        <div class="spinner-border text-light" role="status"></div><br>Processing...
      </div>`;
    document.body.appendChild(loader);
  }
  loader.style.display = "block";
}

function hideLoader() {
  const loader = document.getElementById("loaderOverlay");
  if (loader) loader.style.display = "none";
}



// ===== Utility: Validate Email =====
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===== Login Function =====
async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const btn = document.getElementById("loginBtn");

  if (!email || !password) return showToast("Email and password are required.");
  if (!isValidEmail(email)) return showToast("Enter a valid email.");

  btn.disabled = true;
  showLoader();

  try {
    const userCred = await auth.signInWithEmailAndPassword(email, password);
    playerID = userCred.user.uid;

    const snapshot = await db.ref("players/" + playerID).once("value");
    const playerData = snapshot.val();

    if (playerData) {
      playerName = playerData.name;
      playerPhoto = playerData.photo || "./img/friend.jpg";
       // You can now use playerID, playerName, playerPhoto globally or store in session/local storage
      localStorage.setItem("playerID", playerID);
      localStorage.setItem("playerName", playerName);
      localStorage.setItem("playerPhoto", playerPhoto);

      $('#player-pic').attr('src',playerPhoto);
      $('.player-name').text(playerName);
      showToast(`Welcome back, ${playerName}!`);
      $('#authModal').modal('hide');
      checkForInvitedGame(playerID);
    } else {
      showToast("Player data not found.");
    }
  } catch (err) {
    showToast(err.message);
  } finally {
    hideLoader();
    btn.disabled = false;
  }
}

// ===== Register Function =====
async function register() {
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const btn = document.getElementById("registerBtn");

  if (!email || !password || !name || !phone)
    return showToast("All fields are required.");
  if (!isValidEmail(email))
    return showToast("Enter a valid email.");

  btn.disabled = true;
  showLoader();

  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    await userCred.user.updateProfile({ displayName: name });

    const playerIDValue = userCred.user.uid;
    const playerPhotoValue = "";


    await db.ref("players/" + playerIDValue).set({
      name: name,
      phone: phone,
      email: email,
      photo: playerPhotoValue,
      wins: 0,
      losses: 0,
      ranking: 1000
    });

    playerID = playerIDValue;
    playerName = name;
    playerPhoto = playerPhotoValue || "./img/friend.jpg";
    localStorage.setItem("playerID", playerID);
      localStorage.setItem("playerName", playerName);
      localStorage.setItem("playerPhoto", playerPhoto);
   $('#player-pic').attr('src',playerPhoto);
    $('.player-name').text(playerName);

    showToast(`Great, you are registered, ${playerName}`);
    $('#authModal').modal('hide');
    checkForInvitedGame(playerID);
  } catch (err) {
    showToast(err.message);
  } finally {
    hideLoader();
    btn.disabled = false;
  }
}

// ===== Reset Password =====
async function resetPassword() {
  const email = document.getElementById("forgotEmail").value.trim();
  const btn = document.getElementById("resetBtn");

  if (!email) return showToast("Email is required.");
  if (!isValidEmail(email)) return showToast("Enter a valid email.");

  btn.disabled = true;
  showLoader();

  try {
    await auth.sendPasswordResetEmail(email);
    alert("Reset email sent!");
    showForm("loginForm");
  } catch (err) {
    showToast(err.message);
  } finally {
    hideLoader();
    btn.disabled = false;
  }
}

// ===== Guest Login =====
async function guestLogin() {
  const name = document.getElementById("Nickname").value.trim();
  const btn = document.getElementById("guestBtn");

  if (!name) return showToast("Please enter your nickname.");

  btn.disabled = true;
  showLoader();

  try {
    playerID = generateUniqueId();
    playerName = name;
    playerPhoto = "./img/friend.jpg";
    localStorage.setItem("playerID", playerID);
      localStorage.setItem("playerName", playerName);
      localStorage.setItem("playerPhoto", playerPhoto);
    $('#player-pic').attr('src',playerPhoto);
    $('.player-name').text(playerName);
    showToast(`Welcome our guest ${playerName}`);
    $('#authModal').modal('hide');
    checkForInvitedGame(playerID);
  } catch (err) {
    showToast(err.message);
  } finally {
    hideLoader();
    btn.disabled = false;
  }
}

// ===== Enter Key Submit Triggers =====
document.addEventListener("DOMContentLoaded", () => {
  // Login form
  document.getElementById("loginPassword").addEventListener("keypress", e => {
    if (e.key === "Enter") login();
  });

  // Register form
  document.getElementById("regPhone").addEventListener("keypress", e => {
    if (e.key === "Enter") register();
  });

  // Forgot form
  document.getElementById("forgotEmail").addEventListener("keypress", e => {
    if (e.key === "Enter") resetPassword();
  });

  // Guest form
  document.getElementById("Nickname").addEventListener("keypress", e => {
    if (e.key === "Enter") guestLogin();
  });
});

function logout() {
  // Show the confirmation modal instead of immediate logout
  $('#logoutModal').modal('show');
}

document.getElementById("confirmLogoutBtn").addEventListener("click", async () => {
  try {
    await auth.signOut();

    // Clear player-related data
    localStorage.removeItem("playerID");
    localStorage.removeItem("playerName");
    localStorage.removeItem("playerPhoto");

    showToast("You've been logged out.");
    $('#logoutModal').modal('hide');
    $('#authModal').modal({
      backdrop: 'static',
      keyboard: false
    });
  } catch (error) {
    showToast("Logout failed: " + error.message);
  }
});

document.getElementById("cancelLogoutBtn").addEventListener("click", () => {
  $('#logoutModal').modal('hide');
  // Optionally, show a toast or reset UI
  showToast("Logout cancelled.");
});

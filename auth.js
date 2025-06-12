
async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const userCred = await auth.signInWithEmailAndPassword(email, password);
    playerID = userCred.user.uid;

    // Retrieve player data from the database
    const snapshot = await db.ref("players/" + playerID).once("value");
    const playerData = snapshot.val();

    if (playerData) {
      playerName = playerData.name;
      playerPhoto = playerData.photo;

      showToast(`Welcome back, ${playerName}!`);
     
      // You can now use playerID, playerName, playerPhoto globally or store in session/local storage
      // localStorage.setItem("playerID", playerID);
      // localStorage.setItem("playerName", playerName);
      // localStorage.setItem("playerPhoto", playerPhoto);

      $('#authModal').modal('hide')
      checkForInvitedGame(playerID);
    } else {
      showToast("Player data not found.");
    }
  } catch (err) {
    showToast(err.message);
  }
}


  async function register() {
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const name = document.getElementById("regName").value;
  const phone = document.getElementById("regPhone").value;

  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    await userCred.user.updateProfile({ displayName: name });

    const playerIDValue = userCred.user.uid;
    const playerPhotoValue = ""; // Default photo or assign one

    // Wait for DB write to complete
    await db.ref("players/" + playerIDValue).set({
      name: name,
      phone: phone,
      email: email,
      photo: playerPhotoValue,
      wins: 0,
      losses: 0,
      ranking: 1000
    });

    // Safe to assign values after DB write completes
    playerID = playerIDValue;
    playerName = name;
    playerPhoto = playerPhotoValue || "https://via.placeholder.com/150";

    showToast(`Great you are registered:, ${playerName}`);
    $('#authModal').modal('hide')
     checkForInvitedGame(playerID);
  } catch (err) {
    alert(err.message);
  }
}


  async function resetPassword() {
    const email = document.getElementById("forgotEmail").value;
    try {
      await auth.sendPasswordResetEmail(email);
      alert("Reset email sent!");
      showForm('loginForm');
    } catch (err) {
      alert(err.message);
    }
  }

  async function guestLogin() {
    try {
      const userCred = await auth.signInAnonymously();
      console.log("Guest UID:", userCred.user.uid);
      hideAuthModal();
    } catch (err) {
      alert(err.message);
    }
  }

  function hideAuthModal() {
    document.getElementById("authModal").style.display = "none";
  }
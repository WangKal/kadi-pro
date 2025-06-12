










// Function to setup Kadi game
function kadi_play_setup() {
  // Retrieve duel_id from URL or other source
 
  // Check if game data already exists in localStorage
  if(play_type == 'single_player'){
  let gameData = JSON.parse(localStorage.getItem('kadi_plays')) || {};
let duelData = JSON.parse(localStorage.getItem('duel'));

  // If no data for the current duel, initialize it
  if (gameData.duel_id === undefined) {
  
    
let duelData = JSON.parse(localStorage.getItem('duel'));

    // Assuming these variables are pulled from some initial setup or configuration
    const duelPlayers =[duelData.player_one,duelData.player_two]  //getDuelPlayers(duelId); Replace this with logic to get duel players
    const playType = gameData[play_type]; // Default play type or retrieve from some source
    const allPlayingCards = Array.from({ length: 54 }, (_, i) => i); // Array [0, 1, ..., 53]



    gameData = {
      duel_id:duel_id,
      players: duelPlayers,
      playing: duelPlayers[duelPlayers.length - 1],
      play_direction: 'forward',
      play_status: 'starting',
      kadi_status: [],
      cardless_status: [],
      play_type: playType,
      ready_cards: allPlayingCards,
      play_state: [],
      my_cards: [],
      last_play: null,
      plays: [],
      to_fine: null,
      kadi: null,
      cardless: null,
      number_of_plays: null,
    };

    // Save initial data to localStorage
    localStorage.setItem('kadi_plays', JSON.stringify(gameData));
 //console.log(localStorage);
 p_status = 'starting';
 play_state = 'starting';
 current_player = duelPlayers[duelPlayers.length - 1];
  }
else{
  // Fetch the current game data
  let currentGameData = gameData;

  // Update game state based on current play status
  if (currentGameData.play_status === 'playing') {
    const lastPlay = currentGameData.last_play || [];

    if (lastPlay.length > 1) {
      // Process last play to determine playable card and other status flags
      let playableCard = lastPlay[0].play;
      for (let i = lastPlay.length - 1; i > 0; i--) {
        if (lastPlay[i].play !== 'null' && lastPlay[i].play[lastPlay[i].play.length - 1] !== 'picked_card' && lastPlay[i].playerFined !== 1) {
          playableCard = lastPlay[i].play[lastPlay[i].play.length - 1];
          break;
        }
      }

      plays = playableCard;
      to_pick = lastPlay[lastPlay.length - 1].player === 'start' ? 'none' : lastPlay[lastPlay.length - 1].to_fine;
      kadi = lastPlay[lastPlay.length - 1].player === 'start' ? 'none' : lastPlay[lastPlay.length - 1].kadi;
      cardless = lastPlay[lastPlay.length - 1].player === 'start' ? 'none' : lastPlay[lastPlay.length - 1].cardless;
      number_of_plays = lastPlay.length;
       p_status = 'playing';
 play_state = 'playing';
    }

    // Save updated game state to localStorage
  //  localStorage.setItem('gameData', JSON.stringify(gameData));

  } else if (currentGameData.playStatus === 'starting') {
    // Game is in starting phase; reset relevant fields
    my_cards = [];
    plays = [];
    to_pick = null;
    kadi = null;
    cardless = null;
    numberOfPlays = null;
       p_status = 'starting';
        play_state = 'starting';
    // Save updated starting state to localStorage
    //localStorage.setItem('gameData', JSON.stringify(gameData));
  }else if (currentGameData.playStatus === 'game_ended') {
     // Handle play ended case
    play_status = 'game_ended';
   my_cards = null;
    play_state = null;

   
  }
 
}
}
else{
    let duelData;
    let gameData;
   db.ref("games/" + duel_id + "/duel").once("value", function(snapshot) {
    if (snapshot.exists()) {
        duelData = snapshot.val();
        console.log("Duel Data Loaded:", duelData);

        // Fetch Kadi Plays AFTER duelData is available
        db.ref("games/" + duel_id + "/kadi_plays").once("value", function(snapshot) {
            if (snapshot.exists()) {
                gameData = snapshot.val();
                console.log("Kadi Plays Loaded:", gameData);

                // Now that both duelData and gameData are ready, process them
                
            processGameData(duelData, gameData);
            check_readiness();
            }else{

            processGameData(duelData, gameData);
            check_readiness();
            }
        });
    }


});

}  



  // Render or use data as needed on the frontend
  
}


function processGameData(duelData, gameData) {
  
// Function to process game data after both Firebase calls are complete
console.log(gameData);

  // If no data for the current duel, initialize it
  if (gameData === undefined) {
  
 
    // Assuming these variables are pulled from some initial setup or configuration
    const duelPlayers =[duelData.player_one,duelData.player_two]  //getDuelPlayers(duelId); Replace this with logic to get duel players
    const playType = duelData[play_type]; // Default play type or retrieve from some source
    const allPlayingCards = Array.from({ length: 54 }, (_, i) => i); // Array [0, 1, ..., 53]

console.log(duelPlayers)

    gameData = {
      duel_id:duel_id,
      players: duelPlayers,
      playing: duelPlayers[duelPlayers.length - 1],
      play_direction: 'forward',
      play_status: 'starting',
      kadi_status: [],
      cardless_status: [],
      play_type: "multi_player",
      ready_cards: allPlayingCards,
      play_state: [],
      my_cards: [],
      last_play: [],
      plays: [],
      to_fine: "",
      kadi: false,
      cardless: false,
      number_of_plays: 0,
    };

    // Save initial data to localStorage
    db.ref("games/" + duel_id + "/kadi_plays").set(gameData);

 //console.log(localStorage);
 p_status = 'starting';
 play_state = 'starting';
 current_player = duelPlayers[duelPlayers.length - 1];
 console.log(current_player);
  }
else{
  // Fetch the current game data
  let currentGameData = gameData;

  // Update game state based on current play status
  if (currentGameData.play_status === 'playing') {
    const lastPlay = currentGameData.last_play || [];

    if (lastPlay.length > 1) {
      // Process last play to determine playable card and other status flags
      let playableCard = lastPlay[0].play;
      for (let i = lastPlay.length - 1; i > 0; i--) {
        if (lastPlay[i].play !== 'null' && lastPlay[i].play[lastPlay[i].play.length - 1] !== 'picked_card' && lastPlay[i].playerFined !== 1) {
          playableCard = lastPlay[i].play[lastPlay[i].play.length - 1];
          break;
        }
      }

      plays = playableCard;
      to_pick = lastPlay[lastPlay.length - 1].player === 'start' ? 'none' : lastPlay[lastPlay.length - 1].to_fine;
      kadi = lastPlay[lastPlay.length - 1].player === 'start' ? 'none' : lastPlay[lastPlay.length - 1].kadi;
      cardless = lastPlay[lastPlay.length - 1].player === 'start' ? 'none' : lastPlay[lastPlay.length - 1].cardless;
      number_of_plays = lastPlay.length;
       p_status = 'playing';
 play_state = 'playing';
    }

    // Save updated game state to localStorage
  //  localStorage.setItem('gameData', JSON.stringify(gameData));

  } else if (currentGameData.play_status === 'starting') {
    // Game is in starting phase; reset relevant fields
     const duelPlayers =[duelData.player_one,duelData.player_two]  //
    my_cards = [];
    plays = [];
    to_pick = null;
    kadi = null;
    cardless = null;
    numberOfPlays = null;
       p_status = 'starting';
        play_state = 'starting';
        alert("hello why")
        current_player = user;
 db.ref("games/" + duel_id+ "/kadi_plays").update({
    players: duelPlayers,
    playing: user
 })
    // Save updated starting state to localStorage
    //localStorage.setItem('gameData', JSON.stringify(gameData));
  }else if (currentGameData.play_status === 'game_ended') {
     // Handle play ended case
    play_status = 'game_ended';
   my_cards = null;
    play_state = null;

   
  }
 
}


}




async function getKadiPlays(duel) {
   // console.log(play_type)
    if (play_type == "single_player") {
      //  console.log(localStorage.getItem('kadi_plays'))
        return JSON.parse(localStorage.getItem('kadi_plays'));
    } else {
        try {
            const snapshot = await db.ref("games/" + duel_id + "/kadi_plays").once("value");
            return snapshot.exists() ? snapshot.val() : null; // ✅ Now it waits for Firebase
        } catch (error) {
            console.error("Error fetching Firebase data:", error);
            return null;
        }
    }
}


function cards_set(duelData,kadiPlays,reg2 =null){




    var player_cards=[];
$('.card').each(function() {
    var a = $(this).attr('id');
    var b = a.split('_');
    player_cards.push(b[1]);
   });
   // console.log((kadiPlays).duel_id);
    //learn how to go over objects more so if the key is empty ""
    const duel = kadiPlays;
  prev_play =[begin_card_index];
  const lastPlay = JSON.stringify([{
        player: 'start',
        player_fined: 0,
        play_allowed: true,
        to_fine: 'none',
        card_request: false,
        card_requested: '',
        game_end: false,
        kadi: false,
        cardless: false,
        play: [begin_card_index]
    }]);
console.log(duel);
    // Check if the current player is the one who should start
    if (duel.playing === user) {
        const updatedDuel = {
            ...duel,
            my_cards: JSON.stringify(my_cards),
            last_play: lastPlay,
            players: duel.players, // Keep player logic as it is
            play_status: 'starting_others',//duel.play_status,
            game_end: false
            //players_ready: duel.players_ready + 1 Future for more than 2 players
        };

    // const updatedKadiPlays = kadiPlays.map(play => play.duel_id === duelId ? updatedDuel : play);
 if(duelData.play_type === 'single_player'){
           localStorage.setItem('kadi_plays', JSON.stringify(updatedDuel));
 
 const updatedReg2 = {
            ...reg2,
            my_cards: JSON.stringify(my_cards),
            
}
       localStorage.setItem('registrationData2', JSON.stringify(updatedReg2));
aiStart(duel.ready_cards);
}
else{

db.ref("games/" + duel_id + "/kadi_plays").set(updatedDuel);

const regRef = db.ref(`games/${duel_id}/registrationData`);

regRef.once("value", function(snapshot) {
    if (snapshot.exists()) {
        const regData = snapshot.val();
        let playerKey = null;

        // Find the correct player (player1 or player2) based on userID
        if (regData.player1 && regData.player1.userID === user) {
            playerKey = "player1";
        } else if (regData.player2 && regData.player2.userID === user) {
            playerKey = "player2";
        }

        if (playerKey) {
            db.ref(`games/${duel_id}/registrationData/${playerKey}/my_cards`)
                .set(JSON.stringify(my_cards))  
                .then(() => console.log(`Updated cards for ${user}:`, my_cards))
                .catch(err => console.error("Error updating cards:", err)); 
        } else {
            console.error("User ID not found in registrationData.");
        }
    } else {
        console.error("Game not found or missing registrationData.");
    }
});




                }
}






}

let currentView = 'login'; // Default
function flipTo(view) {
  const card = document.getElementById('authCardInner');
  const login = document.getElementById('loginFace');
  const register = document.getElementById('registerFace');
  const guest = document.getElementById('guestFace');
  const forgot = document.getElementById('forgotFace');

  // Hide all views
  [login, register, guest, forgot].forEach(el => el.style.display = 'none');

  // Default rotation (login)
  let rotation = 0;

  switch (view) {
    case 'register':
      register.style.display = 'block';
      rotation = 180;
      break;
    case 'guest':
      guest.style.display = 'block';
      rotation = -180;
      break;
    case 'forgot':
      forgot.style.display = 'block';
      rotation = 0; // No rotation — overlays on top
      break;
    default:
      login.style.display = 'block';
      rotation = 0;
      break;
  }

  // Apply rotation (if needed)
  card.style.transform = `rotateY(${rotation}deg)`;
}


// Push state for login modal
history.pushState({ screen: "login" }, "", "#login");

// When user flips to register:
history.pushState({ screen: "register" }, "", "#register");

// Handle back button
window.onpopstate = function(event) {
  if (event.state?.screen === "register") {
    showRegisterForm();
  } else if (event.state?.screen === "login") {
    showLoginForm();
  }
  // etc.
};


function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  document.getElementById('toast-container').appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 100);

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300); // Wait for transition
  }, duration);
}


function checkForInvitedGame(playerID) {
console.log(playerID);

    /*** Look at the url if its the duel id as this player may be anonymous you can include a quick sign in ***/

    const storedGame = JSON.parse(localStorage.getItem("activeGame"));

    if (storedGame && storedGame.status === "on" && storedGame.host == playerID) {
        console.log("Resuming stored game:", storedGame.gameID);
        if(storedGame.play_type == 'single_player'){
        duel_id = storedGame.gameID;
        play_type = "single_player";
        user = playerID;
$('#continueGame').modal({backdrop: 'static',
  keyboard: false  });
        

        }
        else{
        duel_id = storedGame.gameID;
        play_type = "multi_player";
        opponent = storedGame.opponent;
        user = playerID;
        if(storedGame.friendSetup == false){
            $('#continueGame').modal({backdrop: 'static',
  keyboard: false  });
        }
        else{
            storedGame.friendSetup = false;
            localStorage.setItem("activeGame", JSON.stringify(storedGame));
        }
         check_readiness();    
        }
       
        return;
    }
if(storedGame?.gameID){
    db.ref("games")
        .orderByChild("duel/gameID")
        .equalTo(storedGame.gameID)
        .limitToFirst(1)
        .once("value", function(snapshot) {
            if (snapshot.exists()) {
                const gameID = Object.keys(snapshot.val())[0];
                const gameData = snapshot.val()[gameID];

                // Check if the game is finished
                if (gameData.status === "finished") {
                    console.log("Previous game is complete. Creating a new game...");
                    createNewGameWithFriend(playerID);
                    return false;
                }
console.log('whats happening')
                // If the game is still active, join it
                joinFriendGame(gameID, playerID);
                return true;
            }
            else{
                $('#game_selection').modal({backdrop: 'static',
  keyboard: false  });
            }

            return false;
        });
    }
    else{
$('#game_selection').modal({backdrop: 'static',
  keyboard: false  });
    }
}



function kadiSetup() {
    console.log(playerID);
    // Get userID from localStorage
    const userID = playerID;//localStorage.getItem('userID');

    if (!userID) {
        console.error("User is not authenticated.");
        return;
    }

    // Get player name and play type from the form
    const playType = play_type;
alert(playType)
   /* const playerName = document.getElementById('player_name').value;
    
    // Update player name via API
    if (playerName && playerName.length > 0) {
        //await updatePlayerName(userID, playerName);
    }*/

    if (playType === 'single_player') {
        const challengeID = 10; // Static challenge ID
        duel_id = generateUniqueId();
        user = userID;
        const data = {
            challenge_id: challengeID,
            players: `19,${userID}`,
            player_one: '19',
            player_one_ready: true,
            player_one_topic: '',
            player_two: playerID,
            player_two_name:playerName,
            player_two_pic:playerPhoto,
            player_two_ready: true,
            player_two_time: 0,
            start_date: new Date().toISOString(),
            status: 'playing',
            play_type: 'single_player',
            duel_id:duel_id
        };
const registrationData = {
      userID: 19,
      challengeID: challengeID,
      status: 'pending',
      play_amount: 0,
      win_status: 'pending',
      reg_day: new Date().toISOString().replace('T', ' ').split('.')[0],
      duel_id: duel_id
    };
    const registrationData2 = {
      userID: userID,
      challengeID: challengeID,
      status: 'pending',
      play_amount: 0,
      win_status: 'pending',
      reg_day: new Date().toISOString().replace('T', ' ').split('.')[0],
      duel_id: duel_id
    };
        // Create a new duel via API
        createDuel(data);

        // Register challenges for both players
        registerChallenge('registrationData1',registrationData);
        registerChallenge('registrationData2',registrationData2);
const gameData = {
        gameID: duel_id,
        host: playerID,
        invitee: null,
        play_type:play_type,
        status: "on",
        friendSetup:true,
        createdAt: Date.now()
    };
    localStorage.setItem("activeGame", JSON.stringify(gameData));
        console.log(localStorage);
    } else {
        const challengeID = 11; // Another static challenge ID

if (opponent == 'random'){



    console.log("Running on Localhost - Using Test Player");

    // Simulated test player for local testing
    /*const playerID = generateUniqueId();
    const playerName = "Test User";
    const playerPhoto = "https://example.com/default-avatar.png";*/
    user = playerID;
    console.log("Simulating Local Player:", playerID);

    // Use test player in Firebase
  /*  db.ref("players/" + playerID).set({
        name: playerName,
        photo: playerPhoto,
        wins: 0,
        losses: 0,
        ranking: 1000
    });*/

    // Create a test game
    findOrCreateGame(playerID, playerName);

}
else{

    console.log("Running on Localhost - Using Test Player");

    // Simulated test player for local testing
    
    user = playerID;
    /*console.log("Simulating Local Player:", playerID);

    // Use test player in Firebase
    db.ref("players/" + playerID).set({
        name: playerName,
        photo: playerPhoto,
        wins: 0,
        losses: 0,
        ranking: 1000
    });*/

    // Create a test game
    findOrCreateGameWithFriend(playerID) 



}
/*
        // Check for existing challenges
        const existingChallenge = await getExistingChallenge(challengeID, userID);
        if (existingChallenge) {
            await updateChallenge(existingChallenge, userID);
            await deleteChallengeRegis tration(challengeID, userID);
        }

        const challengeData = await getChallengeData(challengeID);
        const newRegistrationID = await registerChallenge(userID, challengeID, challengeData.amount);

        const serial = generateRandomString(8);
        const challengeLink = `/${serial}/${newRegistrationID}`;

        // Update the challenge registration with the link
        await updateChallengeLink(newRegistrationID, challengeLink);

        console.log(JSON.stringify({ link: `challenge/kadi_waiting_bay/${newRegistrationID}` }));
 */   }
}

function findOrCreateGame(playerID, playerName) {
    db.ref("games").orderByChild("status").equalTo("starting").limitToFirst(1).once("value", function(snapshot) {
        if (snapshot.exists()) {
            // Join the first available game
            const gameID = Object.keys(snapshot.val())[0];
            joinGame(gameID, playerID,playerName);
        } else {
            // No open game, create a new one
            createNewGame(playerID, playerName);
        }
    });
}

  function joinGame(gameID, playerID,playerName) {
    duel_id = gameID;
    db.ref("games/" + gameID).once("value", function(snapshot) {
        if (snapshot.exists()) {
            const gameData = snapshot.val();
            const player1 = gameData.duel.player_one;
            const player2 = gameData.duel.player_two;

            if (player1 === playerID) {
                console.log("Player is already Player 1, rejoining game...");
                kadi_play_setup();
                return; // Do nothing, player is already assigned
            }

            if (!player2) {
                // Assign player as Player 2 if slot is empty
                db.ref("games/" + gameID).update({
                    "duel/player_two": playerID,
                    "status": "starting"
                });
                db.ref("games/" + gameID + "/registrationData/player2").set({
                    userID: playerID,
                    challengeID: 10,
                    status: "pending",
                    my_cards: []
                }).then(() => {
                console.log("Player 2 added successfully:", playerID);
                }).catch(err => {
                console.error("Error updating registrationData for player 2:", err);
                });
                console.log("Joined game as Player 2:", gameID);
                kadi_play_setup();
            } else {
                createNewGame(playerID, playerName);
            }
        }
    });
}





function createNewGame(playerID, playerName) {
    const gameID = db.ref("games").push().key;

    db.ref("games/" + gameID).set({
        duel_id: gameID,
        status: "starting",
        duel: {
            player_one: playerID,
            player_two: "",
            player_one_ready: true,
            player_two_ready: false,
            play_type: play_type
        },
        registrationData: {
            player1: {
                userID: playerID,
                challengeID: 10,
                status: "pending",
                my_cards: []
            }
        },
        
    });
        
    duel_id = gameID;
    console.log("New game created:", gameID);
    const gameData = {
        gameID: gameID,
        host: playerID,
        invitee: null,
        play_type:play_type,
        status: "on",
        opponent:'random',
        friendSetup:false,
        createdAt: Date.now()
    };
    localStorage.setItem("activeGame", JSON.stringify(gameData));
    console.log("Created a new random game:", duel_id);
    kadi_play_setup();
}
/*
async function inviteFriendToGame() {
    try {
        // Open Facebook's friend selector
        await FBInstant.context.chooseAsync();

        // Get the selected friend's context ID
        const contextID = FBInstant.context.getID();
        console.log("Friend selected. Context ID:", contextID);



        // Create or find a game for the two players
        findOrCreateGameWithFriend(FBInstant.player.getID(), contextID);
    } catch (error) {
        console.error("Error inviting friend:", error);
    }
}*/

function findOrCreateGameWithFriend(playerID, gameID) {

const gamesRef = db.ref("games");


    db.ref("games")
        .orderByChild("duel/gameID")
        .equalTo(gameID)
        .limitToFirst(1)
        .once("value", function(snapshot) {
            if (snapshot.exists()) {
                const gameID = Object.keys(snapshot.val())[0];
                const gameData = snapshot.val()[gameID];

                // Check if the existing game is completed
                if (gameData.status === "finished") {
                    console.log("Game already completed. Creating a new one...");
                    createNewGameWithFriend(playerID);
                } else {
                    console.log("Found an active game, joining...");
                    joinFriendGame(gameID, playerID);
                }
            } else {
                // No open game found, create a new one
                createNewGameWithFriend(playerID);
            }
        });




}

function createNewGameWithFriend(playerID) {
    
const gameID = db.ref("games").push().key;

    db.ref("games/" + gameID).set({
        duel_id: gameID,
        status: "starting",
        duel: {
            player_one: playerID,
            player_two: "",
            player_one_ready: true,
            player_two_ready: false,
            play_type: play_type
        },
        registrationData: {
            player1: {
                userID: playerID,
                challengeID: 10,
                status: "pending",
                my_cards: []
            }
        },
       
    });
    duel_id = gameID;
    /*** InviteFriendToGame ***/
    console.log("New game created with friend:", gameID);
    const gameData = {
        gameID: gameID,
        host: playerID,
        invitee: null,
        play_type:play_type,
        status: "on",
        opponent:'friend',
        contextID: contextID,
        friendSetup:true,
        createdAt: Date.now()
    };
    localStorage.setItem("activeGame", JSON.stringify(gameData));
    kadi_play_setup();
}
function joinFriendGame(gameID, playerID) {
    duel_id = gameID;
    db.ref("games/" + gameID).once("value", function(snapshot) {
        if (snapshot.exists()) {
            const gameData = snapshot.val();
            const player1 = gameData.duel.player_one;
            const player2 = gameData.duel.player_two;

            if (player1 === playerID) {
                console.log("Player is already Player 1, rejoining game...");
                kadi_play_setup();
                return; // Do nothing, player is already assigned
            }

            if (!player2) {
                // Assign player as Player 2 if slot is empty
                db.ref("games/" + gameID).update({
                    "duel/player_two": playerID,
                    "status": "starting"
                });
                db.ref("games/" + gameID + "/registrationData/player2").set({
                    userID: playerID,
                    challengeID: 10,
                    status: "pending",
                    my_cards: []
                }).then(() => {
                console.log("Player 2 added successfully:", playerID);
                }).catch(err => {
                console.error("Error updating registrationData for player 2:", err);
                });
                console.log("Joined game as Player 2:", gameID);
                kadi_play_setup();
            } else {
                 console.log("Joined game as Player 2:", gameID);
                //createNewGame(playerID, playerName);
            }
        }
    });


}


function createDuel(data) {
try {


localStorage.setItem('duel', JSON.stringify(data));

} catch (error) {
    console.error("Error adding document: ", error);
  }

}



// Usage





async function registerChallenge(player, registrationData) {
 try {


localStorage.setItem(player, JSON.stringify(registrationData));;

} catch (error) {
    console.error("Error adding document: ", error);
  }


}








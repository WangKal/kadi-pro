async function getKadiStatus(duel) {
    if (play_type === "single_player") {

        return JSON.parse(localStorage.getItem('kadi_plays')).kadi_status;
    } else {
        try {
            const snapshot = await db.ref("games/" + duel_id + "/kadi_status").once("value");
            return snapshot.exists() ? snapshot.val() : null; // ✅ Now it waits for Firebase
        } catch (error) {
            console.error("Error fetching Firebase data:", error);
            return null;
        }
    }
}



async function getCardlessStatus(duel) {
    if (play_type === "single_player") {
        return JSON.parse(localStorage.getItem('kadi_plays')).cardless_status;
    } else {
        try {
            const snapshot = await db.ref("games/" + duel_id + "/cardless_status").once("value");
            return snapshot.exists() ? snapshot.val() : []; // ✅ Now it waits for Firebase
        } catch (error) {
            console.error("Error fetching Firebase data:", error);
            return null;
        }
    }
}




async function updateKadiPlays(o_plays) {
    try {
        await db.ref(`games/${duel_id}/kadi_plays`).set(o_plays);
        /*console.log("Updated kadi_plays in Firebase:", o_plays);*/
    } catch (error) {
        console.error("Error updating kadi_plays:", error);
    }
}


async function updatePlayerCards(  player_cards) {
    const user_id = user;
    try {
        const regRef = db.ref(`games/${duel_id}/registrationData`);

        // Fetch registration data
        const snapshot = await regRef.once("value");
        if (!snapshot.exists()) {
            console.error("Error: registrationData not found for duel_id:", duel_id);
            return;
        }

        const regData = snapshot.val();
        let playerKey = null;

        // Determine if the user is player1 or player2
        if (regData.player1 && regData.player1.userID == user_id) {
            playerKey = "player1";
        } else if (regData.player2 && regData.player2.userID == user_id) {
            playerKey = "player2";
        } else {
            console.error("Error: user_id not found in registrationData.");
            return;
        }

        // Update Firebase with new cards
        await db.ref(`games/${duel_id}/registrationData/${playerKey}/my_cards`).set(player_cards);
        /*console.log(`Updated cards for ${user_id} in ${playerKey}:`, player_cards);*/
    } catch (error) {
        console.error("Error updating player cards:", error);
    }
}
async function getAllPlayerCards( play_type) {
    let all_cards = [];

    if (play_type === "single_player") {
        /*console.log("Fetching from Local Storage...");*/

        let playerCards1 = JSON.parse(localStorage.getItem('registrationData1'))?.my_cards || [];
        let playerCards2 = JSON.parse(localStorage.getItem('registrationData2'))?.my_cards || [];

        all_cards = all_cards.concat(
            Array.isArray(playerCards1) ? playerCards1 : JSON.parse(playerCards1)
        );
        all_cards = all_cards.concat(
            Array.isArray(playerCards2) ? playerCards2 : JSON.parse(playerCards2)
        );

    } else {
        /*console.log("Fetching from Firebase...");*/

        try {
            const regRef = db.ref(`games/${duel_id}/registrationData`);
            const snapshot = await regRef.once("value");

            if (!snapshot.exists()) {
                console.error("Error: registrationData not found for duel_id:", duel_id);
                return [];
            }

            const regData = snapshot.val();

            if (regData.player1 && regData.player1.my_cards) {
                let playerCards1 = Array.isArray(regData.player1.my_cards)
                    ? regData.player1.my_cards
                    : JSON.parse(regData.player1.my_cards);
                all_cards = all_cards.concat(playerCards1);
            }

            if (regData.player2 && regData.player2.my_cards) {
                let playerCards2 = Array.isArray(regData.player2.my_cards)
                    ? regData.player2.my_cards
                    : JSON.parse(regData.player2.my_cards);
                all_cards = all_cards.concat(playerCards2);
            }
        } catch (error) {
            console.error("Error fetching player cards from Firebase:", error);
            return [];
        }
    }

    /*console.log("All collected cards:", all_cards);*/
    return all_cards;
}





//backend game engine 
async function kadiPlay(
  player = null,
  player_cards = null,
  cardless = null,
  kadi = null,
  player_play = null,
  ready_cards = null,
  card_request = null,
  card_requested = null,
  lastPlay = null,
  duelId = null,
) {
/*console.log(cardless);*/
let cr = card_request;
let crd = card_requested;

/*console.log(card_request)
console.log(crd)*/
let user_id = player; // kadi_ai
let duel_id = localStorage.getItem('duel_id');
let hearts = [0, 4, 8, 12, 16, 20, 24, 30, 34, 38, 42, 46, 50];
let diamonds = [1, 5, 9, 13, 17, 21, 25, 31, 35, 39, 43, 47, 51];
let flowers = [2, 6, 10, 14, 18, 22, 26, 32, 36, 40, 44, 48, 52];
let spades = [3, 7, 11, 15, 19, 23, 27, 33, 37, 41, 45, 49, 53];

let allowed_q_hearts = [16, 30, 34, 38, 42, 46, 50];
let allowed_q_diamonds = [17, 31, 35, 39, 43, 47, 51];
let allowed_q_flowers = [18, 32, 36, 40, 44, 48, 52];
let allowed_q_spades = [19, 33, 37, 41, 45, 49, 53];

let allowed_8_hearts = [12, 30, 34, 38, 42, 46, 50];
let allowed_8_diamonds = [13, 31, 35, 39, 43, 47, 51];
let allowed_8_flowers = [14, 32, 36, 40, 44, 48, 52];
let allowed_8_spades = [15, 33, 37, 41, 45, 49, 53];

let allowed_2_hearts = [24, 28, 29];
let allowed_2_diamonds = [25, 28, 29];
let allowed_2_flowers = [26, 28, 29];
let allowed_2_spades = [27, 28, 29];

let allowed_3_hearts = [20, 28, 29];
let allowed_3_diamonds = [21, 28, 29];
let allowed_3_flowers = [22, 28, 29];
let allowed_3_spades = [23, 28, 29];
let allowed_jk = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29];

// Load 'kadi_plays' data from localStorage and parse players
let q = await getKadiPlays(duel_id);
let players = q?.players || [];
let pl = players.length;
let lp = players[pl - 1];
let current_player = players[pl - 1];

players.pop();
players.unshift(lp);






let to_play = players[pl - 1];
let direction = 'forward';
let active_player = '';
let player_ask_card = false;
let action = [];

/*if (!localStorage.getItem('player')) {
    user_id = localStorage.getItem('userID');
    //let card_request = localStorage.getItem('card_requests');
    let player_cards = JSON.parse(localStorage.getItem('player_cards') || '[]');
    let to_pick = localStorage.getItem('to_pick');
    let kadi = localStorage.getItem('kadi');
    let ready_cards = JSON.parse(localStorage.getItem('ready_cards') || '[]');
    let cardless = localStorage.getItem('cardless');
    let player_play = JSON.parse(localStorage.getItem('my_play') || '[]');

    let last_play_data = JSON.parse(localStorage.getItem('kadi_plays') || '{}');
    let last_play = last_play_data.last_play || [];
    let lpl = last_play.length;
    let plays = last_play[lpl - 1]?.play || [];
    let plays_no = last_play.length;
   // let card_requested = last_play[lpl - 1]?.card_requested || '';*/









   const kpp1 = await getKadiPlays(duel_id);
const kpp =kpp1 ;
/*console.log(kpp1.last_play);*/
const kppo = (kpp.last_play[0]) == '[' ?JSON.parse(kpp.last_play):kpp.last_play;;
let last_play = kppo || [];
let lpl = last_play.length;
    let playable_card = last_play[0]?.play;
let plays_no = last_play.length;
    if (plays_no >= 2) {
        for (let i = lpl - 1; i > 0; i--) {
            let lpla = last_play[i]?.play || [];
            if (lpla[lpla.length - 1] !== 'picked_card' && last_play[i]?.to_fine !== 'self') {
                playable_card = lpla[lpla.length - 1];
                break;
            }
        }
    }
    last_play = playable_card;
    card_request = (kppo[0]) == '['?cr:kppo[plays_no-1].card_request;
 card_requested = (kppo[0]) == '['?crd:kppo[plays_no-1].card_requested;

card_request = (card_request) == null ||card_request== undefined?(kppo[plays_no-1]).card_request:card_request;
/*console.log(card_request)

console.log(kppo[plays_no-1])*/
if (player_play[0] === 'picked_card') {


    // Retrieve data
    const duelId = localStorage.getItem('duel_id');
    const oPlaysF = await getKadiPlays(duel_id) ;
    const oPlays = oPlaysF.last_play;
  
    let cardlessStatusF = await getCardlessStatus(duel_id) ;
    /*console.log(cardlessStatusF)*/
    let cardlessStatus = cardlessStatusF;
    let kadiStatusF = await getKadiStatus(duel_id) ;
    /*console.log(kadiStatusF);*/
    let kadiStatus = kadiStatusF;



    // Prepare new play data
    const playData = {
        player: user_id,
        play: JSON.stringify(player_play),
        player_fined: 'none',
        play_allowed: true,
        to_fine: 'none',
        next_player: to_play,
        card_request: card_request,
        card_requested: card_requested,
        kadi: kadi,
        cardless: cardless
    };

 
    // Define action object
    const action = {
        fine: 'none',
        play_allowed: 'true',
        to_fine: 'none',
        next_player: to_play,
        card_request: card_request,
        card_requested: card_requested,
        last_play_cards: player_cards,
        kadi: kadi,
        cardless: cardless,
        line: 1402
    };
   cardlessStatus = cardlessStatus == null?[]:cardlessStatus;
    kadiStatus = kadiStatus == null?[]:kadiStatus;      
    // Update cardless status
    if (player_cards.length === 0) {
        if (!cardlessStatus.includes(userId)) {
           cardlessStatus.push(userId);
        }
    } else if (cardlessStatus.includes(user_id)) {
        
        cardlessStatus = cardlessStatus.filter(id => id !== user_id);
        cardlessStatus = cardlessStatus.length ? [cardlessStatus[0]] : [];
    }

    // Update kadi status
    if (action.kadi === 'true' && action.cardless === 'false') {
        if (!kadiStatus.includes(user_id)) {
            
            kadiStatus.push(userId);
        }
    } else if (kadiStatus.includes(user_id)) {
        kadiStatus = kadiStatus.filter(id => id !== user_id);
        kadiStatus = kadiStatus.length ? [kadiStatus[0]] : [];
    }

o_plays = oPlaysF;
/*console.log(o_plays);*/
cardless_status =  o_plays.cardless_status || [];
kadi_status = o_plays.kadi_status || [];//JSON.parse(o_plays.kadi_status || '[]');

    let o_plays2 =Array.isArray(o_plays.last_play)?o_plays.last_play:JSON.parse( o_plays.last_play);
    let o_plays2L = o_plays2.length;
    
    o_plays2[o_plays2L] = {
        player: user_id,
        play: JSON.stringify(player_play),
        player_fined: action.fine,
        play_allowed: action.play_allowed,
        to_fine: action.to_fine,
        next_player: action.next_player,
        card_request: action.card_request,
        card_requested: action.card_requested,
        game_end: false,
        kadi: action.kadi,
        cardless: action.cardless
    };

   
    // Update LocalStorage
    o_plays.last_play = JSON.stringify(o_plays2);
   
    o_plays.ready_cards = ready_cards;
    o_plays.players = players;
    o_plays.playing = action.next_player;
    
    // Save updated states
    o_plays.cardless_status =cardlessStatus;
    o_plays.kadi_status = kadiStatus;

let actionData = { ...action, ready_cards: ready_cards };

    if(play_type == 'single_player'){
        localStorage.setItem('kadi_plays', JSON.stringify(o_plays));
       if(user_id == 19 || user_id =='19'){
        /*console.log((JSON.parse(localStorage.getItem('registrationData1'))).my_cards)*/
    localStorage.setItem('registrationData1', JSON.stringify({
        ...JSON.parse(localStorage.getItem('registrationData1')),
        my_cards: JSON.stringify(player_cards) // Clear cards for user
    }));}
    else{
       /* console.log(player_cards);*/
        localStorage.setItem('registrationData2', JSON.stringify({
        ...JSON.parse(localStorage.getItem('registrationData2')),
        my_cards: JSON.stringify(player_cards) // Clear cards for user
    }));
    }
}
else{
  await updateKadiPlays(o_plays);

await updatePlayerCards( player_cards);
return (JSON.stringify(actionData));
}
    // Determine action for AI or next player


    
    if (action.next_player == '19' || action.next_player == '19') { // AI turn
        
        actionData.play_type = 'single_player';
        
  return (JSON.stringify(actionData)); 
    } /*else {
        // Output action data
        if (user_id !== 19) {
           
        }
    }*/


}
else{

 //card played not picked

let pll = player_play.length;

for (let k = 0; k < pll; k++) {
  let current_card = parseInt(player_play[k]);
  
  if (k === 0) {
if (card_request === true) {
      let fine = 'none';
      let to_fine = 'none';

      if ([0, 1, 2, 3].includes(current_card)) {
        let play_allowed = true;
        if (k === pll - 1) {
          action = {
            fine: 'none',
            play_allowed: 'true',
            to_fine: 'none',
            next_player: to_play,
            card_requests: cr,
            card_requested: crd,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 1450,
          };
          break;
        }
      } else if (card_requested === 'hearts') {
        if (hearts.includes(current_card)) {
          let play_allowed = true;
          card_request = false;
          card_requested = '';

          if ([20, 21, 22, 23].includes(current_card)) {
            fine = 2;
            to_fine = to_play;
          } else if ([24, 25, 26, 27].includes(current_card)) {
            fine = 3;
            to_fine = to_play;
          }

          if (k === pll - 1) {
            action = {
              fine: fine,
              play_allowed: 'true',
              to_fine: to_fine,
              next_player: to_play,
              card_requests: card_request,
              card_requested: card_requested,
              last_play_cards: player_cards,
              kadi: kadi,
              cardless: cardless,
              line: 1474,
            };
            break;
          } else {
            let action_b = process_card_request(player_play, players, current_player, to_play);
            action = Object.assign({}, action_b, {
              card_requests: card_request,
              card_requested: card_requested,
              last_play_cards: player_cards,
              kadi: kadi,
              cardless: cardless,
              line: 1486,
            });
            break;
          }
        } else {
          action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 1502,
          };
          break;
        }
      } else if (card_requested === 'diamonds') {
        if (diamonds.includes(current_card)) {
          let play_allowed = true;
          card_request = false;
          card_requested = '';

          if ([20, 21, 22, 23].includes(current_card)) {
            fine = 2;
            to_fine = to_play;
          } else if ([24, 25, 26, 27].includes(current_card)) {
            fine = 3;
            to_fine = to_play;
          }

          if (k === pll - 1) {
            action = {
              fine: fine,
              play_allowed: 'true',
              to_fine: to_fine,
              next_player: to_play,
              card_requests: card_request,
              card_requested: card_requested,
              last_play_cards: player_cards,
              kadi: kadi,
              cardless: cardless,
              line: 1524,
            };
            break;
          } else {
            let action_b = process_card_request(player_play, players, current_player, to_play);
            action = Object.assign({}, action_b, {
              card_requests: card_request,
              card_requested: card_requested,
              last_play_cards: player_cards,
              kadi: kadi,
              cardless: cardless,
              line: 1536,
            });
            break;
          }
        } else {
          action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 1551,
          };
          break;
        }
      } else if (card_requested === 'flowers') {
        if (flowers.includes(current_card)) {
          let play_allowed = true;
          card_request = false;
          card_requested = '';

          if ([20, 21, 22, 23].includes(current_card)) {
            fine = 2;
            to_fine = to_play;
          } else if ([24, 25, 26, 27].includes(current_card)) {
            fine = 3;
            to_fine = to_play;
          }

          if (k === pll - 1) {
            action = {
              fine: fine,
              play_allowed: 'true',
              to_fine: to_fine,
              next_player: to_play,
              card_requests: card_request,
              card_requested: card_requested,
              last_play_cards: player_cards,
              kadi: kadi,
              cardless: cardless,
              line: 1574,
            };
            break;
          } else {
            let action_b = process_card_request(player_play, players, current_player, to_play);
            action = Object.assign({}, action_b, {
              card_requests: card_request,
              card_requested: card_requested,
              last_play_cards: player_cards,
              kadi: kadi,
              cardless: cardless,
              line: 1585,
            });
            break;
          }
        } else {
          action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 1599,
          };
          break;
        }
      } else if (card_requested === 'spades') {
        if (spades.includes(current_card)) {
          let play_allowed = true;
          card_request = false;
          card_requested = '';

          if ([20, 21, 22, 23].includes(current_card)) {
            fine = 2;
            to_fine = to_play;
          } else if ([24, 25, 26, 27].includes(current_card)) {
            fine = 3;
            to_fine = to_play;
          }

          if (k === pll - 1) {
            action = {
              fine: fine,
              play_allowed: 'true',
              to_fine: to_fine,
              next_player: to_play,
              card_requests: card_request,
              card_requested: card_requested,
              last_play_cards: player_cards,
              kadi: kadi,
              cardless: cardless,
              line: 1620,
            };
            break;
          } else {
            let action_b = process_card_request(player_play, players, current_player, to_play);
            action = Object.assign({}, action_b, {
              card_requests: card_request,
              card_requested: card_requested,
              last_play_cards: player_cards,
              kadi: kadi,
              cardless: cardless,
              line: 1632,
            });
            break;
          }
        } else {
          action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 1648,
          };
          break;
        }
      }
    }//end o card request
    else{
//normal card playing
card_request = cr;
card_requested = crd;
let kadiPlays = await getKadiPlays(duel_id);
 const kpp = kadiPlays;
 /*console.log(cr);
 console.log(crd);*/
const kppo = (kpp.last_play[0]) == '[' ?JSON.parse(kpp.last_play):kpp.last_play;//Comment we check for [ because on second play we cannot parse the json an we need to differentiate when to parse on second play the [0] is an array instead of [
/*console.log(kppo);
console.log((kpp.last_play).length);*/
let last_play = kppo || []

let lpl = last_play.length;
let prev_card = last_play[0]?.play[0];

// Loop through last plays to find the previous valid card
for (let i = lpl - 1; i >= 1; i--) {
    let lpla = Array.isArray(last_play[i].play)?last_play[i].play:JSON.parse(last_play[i].play);

    if (
        lpla[lpla.length - 1] !== 'picked_card' &&
        last_play[i].to_fine !== 'self' &&
        ![0, 1, 2, 3].includes(lpla[lpla.length - 1])
    ) {
        let s = lpla.length - 1;
        prev_card = parseInt(lpla[s]);
        break;
    }
}

// Ensure prev_card is properly set
prev_card = Array.isArray(prev_card) ? prev_card[0] : prev_card;

if ([0, 1, 2, 3].includes(current_card)) {
  play_allowed = true;
  card_ask_perm = true;

  if (k === pll - 1) {
    action = {
      fine: 'none',
      play_allowed: 'true',
      to_fine: 'none',
      next_player: to_play,
      card_requests: card_request,
      card_requested: card_requested,
      last_play_cards: player_cards,
      kadi: kadi,
      cardless: cardless,
      line: 1765,
      prev_card: prev_card
    };
  }
}

if ([4, 5, 6, 7].includes(current_card)) {
    if ([4, 5, 6, 7, 28, 29].includes(prev_card)) {
        play_allowed = true;
        card_ask_perm = true;

        let ps = players.length - 1;

        let op = players.shift();
        players.push(op);
        players.reverse();

        to_play = players[ps];

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2015,
                prev_card: prev_card
            };
        }
    } else {
        if (hearts.includes(current_card)) {
            if (hearts.includes(prev_card)) {
                let ps = players.length - 1;

                let op = players.shift();
                players.push(op);
                players.reverse();

                let ps2 = players.length - 1;

                to_play = players[ps2];

                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 2054,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 2070,
                    prev_card: prev_card
                };
                break;
            }



        } else if (diamonds.includes(current_card)) {
            if (diamonds.includes(prev_card)) {
                let ps = players.length - 1;

                let op = players.shift();
                players.push(op);
                players.reverse();

                to_play = players[ps];

                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 2109,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 2125,
                    prev_card: prev_card
                };
                break;
            }
        } else if (flowers.includes(current_card)) {
            if (flowers.includes(prev_card)) {
                let ps = players.length - 1;

                let op = players.shift();
                players.push(op);
                players.reverse();

                to_play = players[ps];

                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 2166,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 2182,
                    prev_card: prev_card
                };
                break;
            }
        } else if (spades.includes(current_card)) {
            if (spades.includes(prev_card)) {
                let ps = players.length - 1;

                let op = players.shift();
                players.push(op);
                players.reverse();

                to_play = players[ps];

                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 2221,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 2237,
                    prev_card: prev_card
                };
                break;
            }
        }
    }
}


if ([8, 9, 10, 11].includes(current_card)) {
    if ([8, 9, 10, 11, 28, 29].includes(prev_card)) {
        play_allowed = true;
        card_ask_perm = true;
        const pl = players.length;
        const last_player = players[pl - 1];
        current_player = players[pl - 1];
        players.pop();
        players.unshift(last_player);

        const to_play = players[pl - 1];

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2287,
                prev_card: prev_card
            };
        }
    }
 else{ 
    if (hearts.includes(current_card)) {
    if (hearts.includes(prev_card)) {
        const pl = players.length;
        const last_player = players[pl - 1];
        current_player = players[pl - 1];
        players.pop();
        players.unshift(last_player);

        const to_play = players[pl - 1];
        play_allowed = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2334,
                prev_card: prev_card
            };
        }
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 2351,
            prev_card: prev_card
        };
        break;
    }
} else if (diamonds.includes(current_card)) {
    if (diamonds.includes(prev_card)) {
        const pl = players.length;
        const last_player = players[pl - 1];
        current_player = players[pl - 1];
        players.pop();
        players.unshift(last_player);

        const to_play = players[pl - 1];
        play_allowed = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2384,
                prev_card: prev_card
            };
        }
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 2400,
            prev_card: prev_card
        };
        break;
    }
} else if (flowers.includes(current_card)) {
    if (flowers.includes(prev_card)) {
        const pl = players.length;
        const last_player = players[pl - 1];
        current_player = players[pl - 1];
        players.pop();
        players.unshift(last_player);

        const to_play = players[pl - 1];
        play_allowed = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2434,
                prev_card: prev_card
            };
        }
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 2451,
            prev_card: prev_card
        };
        break;
    }
} else if (spades.includes(current_card)) {
    if (spades.includes(prev_card)) {
        const pl = players.length;
        const last_player = players[pl - 1];
        current_player = players[pl - 1];
        players.pop();
        players.unshift(last_player);

        const to_play = players[pl - 1];
        play_allowed = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2486,
                prev_card: prev_card
            };
        }
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 2503,
            prev_card: prev_card
        };
        break;
    }
}
}
}


if ([12, 13, 14, 15].includes(current_card)) {
    if ([12, 13, 14, 15, 28, 29].includes(prev_card)) {
        play_allowed = true;
        card_ask_perm = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2549,
                prev_card: prev_card
            };
        }
    } 
 else if (hearts.includes(current_card)) {
    if (hearts.includes(prev_card)) {
        play_allowed = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2587,
                prev_card: prev_card
            };
        }
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 2604,
            prev_card: prev_card
        };
        break;
    }
} else if (diamonds.includes(current_card)) {
    if (diamonds.includes(prev_card)) {
        play_allowed = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2628,
                prev_card: prev_card
            };
        }
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 2645,
            prev_card: prev_card
        };
        break;
    }
} else if (flowers.includes(current_card)) {
    if (flowers.includes(prev_card)) {
        play_allowed = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2669,
                prev_card: prev_card
            };
        }
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 2686,
            prev_card: prev_card
        };
        break;
    }
} else if (spades.includes(current_card)) {
    if (spades.includes(prev_card)) {
        play_allowed = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2710,
                prev_card: prev_card
            };
        }
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 2727,
            prev_card: prev_card
        };
        break;
    }
}
}


if ([16, 17, 18, 19].includes(current_card)) {
    if ([16, 17, 18, 19, 28, 29].includes(prev_card)) {
        play_allowed = true;
        card_ask_perm = true;
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2763,
                prev_card: prev_card
            };
        }
    } else if (hearts.includes(current_card)) {
        if (hearts.includes(prev_card)) {
            play_allowed = true;
            if (k === pll - 1) {
                action = {
                    fine: 'none',
                    play_allowed: 'true',
                    to_fine: 'none',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 2785,
                    prev_card: prev_card
                };
            }
        } else {
            action = {
                fine: '1',
                play_allowed: 'false',
                to_fine: 'self',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2802,
                prev_card: prev_card
            };
            break;
        }
    } else if (diamonds.includes(current_card)) {
        if (diamonds.includes(prev_card)) {
            play_allowed = true;
            if (k === pll - 1) {
                action = {
                    fine: 'none',
                    play_allowed: 'true',
                    to_fine: 'none',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 2827,
                    prev_card: prev_card
                };
            }
        } else {
            action = {
                fine: '1',
                play_allowed: 'false',
                to_fine: 'self',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2843,
                prev_card: prev_card
            };
            break;
        }
    } else if (flowers.includes(current_card)) {
        if (flowers.includes(prev_card)) {
            play_allowed = true;
            if (k === pll - 1) {
                action = {
                    fine: 'none',
                    play_allowed: 'true',
                    to_fine: 'none',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 2868,
                    prev_card: prev_card
                };
            }
        } else {
            action = {
                fine: '1',
                play_allowed: 'false',
                to_fine: 'self',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2884,
                prev_card: prev_card
            };
            break;
        }
    } else if (spades.includes(current_card)) {
        if (spades.includes(prev_card)) {
            play_allowed = true;
            if (k === pll - 1) {
                action = {
                    fine: 'none',
                    play_allowed: 'true',
                    to_fine: 'none',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 2909,
                    prev_card: prev_card
                };
            }
        } else {
            action = {
                fine: '1',
                play_allowed: 'false',
                to_fine: 'self',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2926,
                prev_card: prev_card
            };
            break;
        }
    }
}


if ([20, 21, 22, 23].includes(current_card)) {
    to_pick = true;
    if ([20, 21, 22, 23, 28, 29].includes(prev_card)) {
        play_allowed = true;
        card_ask_perm = true;
        if (k === pll - 1) {
            fine = 2;
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 2965,
                prev_card: prev_card
            };
        }
    } else {
        if (hearts.includes(current_card)) {
            if (hearts.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3012,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3028,
                    prev_card: prev_card
                };
                break;
            }
        } else if (diamonds.includes(current_card)) {
            if (diamonds.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3052,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3068,
                    prev_card: prev_card
                };
                break;
            }
        } else if (flowers.includes(current_card)) {
            if (flowers.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3089,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3105,
                    prev_card: prev_card
                };
                break;
            }
        } else if (spades.includes(current_card)) {
            if (spades.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3125,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3143,
                    prev_card: prev_card
                };
                break;
            }
        }
    }
}

if ([24, 25, 26, 27].includes(current_card)) {
    to_pick = true;
    if ([24, 25, 26, 27, 28, 29].includes(prev_card)) {
        play_allowed = true;
        card_ask_perm = true;
        fine = 3;
        if (k === pll - 1) {
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 3177,
                prev_card: prev_card
            };
        }
    } else {
        if (hearts.includes(current_card)) {
            if (hearts.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 3;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3205,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3221,
                    prev_card: prev_card
                };
                break;
            }
        } else if (diamonds.includes(current_card)) {
            if (diamonds.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 3;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3242,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3259,
                    prev_card: prev_card
                };
                break;
            }
        } else if (flowers.includes(current_card)) {
            if (flowers.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 3;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3280,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3296,
                    prev_card: prev_card
                };
                break;
            }
        } else if (spades.includes(current_card)) {
            if (spades.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 3;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3316,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3332,
                    prev_card: prev_card
                };
                break;
            }
        }
    }
}


if ([28, 29].includes(current_card)) {
    play_allowed = true;

    if (k === pll - 1) {
        action = {
            fine: '5',
            play_allowed: 'true',
            to_fine: to_play,
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 3366,
            prev_card: prev_card
        };
    }
}

if ([30, 31, 32, 33].includes(current_card)) {
    if ([30, 31, 32, 33, 28, 29].includes(prev_card)) {
        play_allowed = true;
        card_ask_perm = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 3389,
                prev_card: prev_card
            };
        }
    } else {
        if (hearts.includes(prev_card)) {
            if (hearts.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3414,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3429,
                    prev_card: prev_card
                };
                break;
            }
        } else if (diamonds.includes(prev_card)) {
            if (diamonds.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3456,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3470,
                    prev_card: prev_card
                };
                break;
            }
        } else if (flowers.includes(current_card)) {
            if (flowers.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3492,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3506,
                    prev_card: prev_card
                };
                break;
            }
        } else if (spades.includes(current_card)) {
            if (spades.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3527,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3541,
                    prev_card: prev_card
                };
                break;
            }
        }
    }
}


if ([34, 35, 36, 37].includes(current_card)) {
    if ([34, 35, 36, 37, 28, 29].includes(prev_card)) {
        playAllowed = true;
        cardAskPerm = true;
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 3577,
                 // prev_card: prevCard
            };
        }
    } else {
        if (hearts.includes(current_card)) {
            if (hearts.includes(prev_card)) {
                playAllowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3599,
                         // prev_card: prevCard
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'none',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3615,
                     // prev_card: prevCard
                };
                break;
            }
        } else if (diamonds.includes(current_card)) {
            if (diamonds.includes(prev_card)) {
                playAllowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3636,
                         // prev_card: prevCard
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'none',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3653,
                     // prev_card: prevCard
                };
                break;
            }
        } else if (flowers.includes(current_card)) {
            if (flowers.includes(prev_card)) {
                playAllowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3674,
                         // prev_card: prevCard
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'none',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3690,
                     // prev_card: prevCard
                };
                break;
            }
        } else if (spades.includes(current_card)) {
            if (spades.includes(prev_card)) {
                playAllowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3710,
                         // prev_card: prevCard
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'none',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3726,
                     // prev_card: prevCard
                };
                break;
            }
        }
    }
}

if ([38, 39, 40, 41].includes(current_card)) {
    if ([38, 39, 40, 41, 28, 29].includes(prev_card)) {
        playAllowed = true;
        cardAskPerm = true;
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 3758,
                 // prev_card: prevCard
            };
        }
    } else {
        if (hearts.includes(current_card)) {
            if (hearts.includes(prev_card)) {
                playAllowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3780,
                         // prev_card: prevCard
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3795,
                     // prev_card: prevCard
                };
                break;
            }
        } else if (diamonds.includes(current_card)) {
            if (diamonds.includes(prev_card)) {
                playAllowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3815,
                         // prev_card: prevCard
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3830,
                     // prev_card: prevCard
                };
                break;
            }
        } else if (flowers.includes(current_card)) {
            if (flowers.includes(prev_card)) {
                playAllowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3851,
                         // prev_card: prevCard





                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3866,
                     // prev_card: prevCard
                };
                break;
            }
        } else if (spades.includes(current_card)) {
            if (spades.includes(prev_card)) {
                playAllowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3886,
                         // prev_card: prevCard
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3902,
                     // prev_card: prevCard
                };
                break;
            }
        }
    }
}


if ([42, 43, 44, 45].includes(current_card)) {
    if ([42, 43, 44, 45, 28, 29].includes(prev_card)) {
        play_allowed = true;
        card_ask_perm = true;
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 3935,
                prev_card: prev_card
            };
        }
    } else {
        if (hearts.includes(current_card)) {
            if (hearts.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3957,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 3972,
                    prev_card: prev_card
                };
                break;
            }
        } else if (diamonds.includes(current_card)) {
            if (diamonds.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 3996,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4011,
                    prev_card: prev_card
                };
                break;
            }
        } else if (flowers.includes(current_card)) {
            if (flowers.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4032,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4047,
                    prev_card: prev_card
                };
                break;
            }
        } else if (spades.includes(current_card)) {
            if (spades.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4067,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4083,
                    prev_card: prev_card
                };
                break;
            }
        }
    }
}

if ([46, 47, 48, 49].includes(current_card)) {
    if ([46, 47, 48, 49, 28, 29].includes(prev_card)) {
        play_allowed = true;
        card_ask_perm = true;
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 4117,
                prev_card: prev_card
            };
        }
    } else {
        if (hearts.includes(current_card)) {
            if (hearts.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4139,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4154,
                    prev_card: prev_card
                };
                break;
            }
        } else if (diamonds.includes(current_card)) {
            if (diamonds.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4174,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4189,
                    prev_card: prev_card
                };
                break;
            }
        } else if (flowers.includes(current_card)) {
            if (flowers.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4210,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4225,
                    prev_card: prev_card
                };
                break;
            }
        } else if (spades.includes(current_card)) {
            if (spades.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4245,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4260,
                    prev_card: prev_card
                };
                break;
            }
        }
    }
}


if ([50, 51, 52, 53].includes(current_card)) {
    if ([50, 51, 52, 53, 28, 29].includes(prev_card)) {
        play_allowed = true;
        card_ask_perm = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 4298,
                prev_card: prev_card
            };
        }
    } else {
        if (hearts.includes(current_card)) {
            if (hearts.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4321,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4336,
                    prev_card: prev_card
                };
                break;
            }
        } else if (diamonds.includes(current_card)) {
            if (diamonds.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4356,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4371,
                    prev_card: prev_card
                };
                break;
            }
        } else if (flowers.includes(current_card)) {
            if (flowers.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4392,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4407,
                    prev_card: prev_card
                };
                break;
            }
        } else if (spades.includes(current_card)) {
            if (spades.includes(prev_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4427,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4442,
                    prev_card: prev_card
                };
                break;
            }
        }
    }
}






    }

  }
else{
//second card

let prev_card = parseInt(player_play[k - 1]);

if ([0, 1, 2, 3].includes(prev_card)) {
    if ([0, 1, 2, 3].includes(current_card)) {
        play_allowed = false;

        action = {
            fine: 'none',
            play_allowed: 'true',
            to_fine: 'none',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 4495,
            prev_card: prev_card,
        };
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 4509,
            prev_card: prev_card,
        };
        break;
    }
}

if ([4, 5, 6, 7].includes(prev_card)) {
    if ([4, 5, 6, 7].includes(current_card)) {
        play_allowed = true;
        card_ask_perm = true;
        let ps = players.length - 1;

        let op = players[0];
        players.shift(); // Removes the first player
        players.reverse(); // Reverses the array
        players.push(op); // Adds the original first player back

        to_play = players[ps];
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 4544,
                prev_card: prev_card,
            };
        }
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 4562,
            prev_card: prev_card,
        };
        break;
    }
}

if ([8, 9, 10, 11].includes(prev_card)) {
    if ([8, 9, 10, 11].includes(current_card)) {
        let pl = players.length;
        let lp = players[pl - 1];
        let current_player = players[pl - 1];
        players.pop(); // Removes the last player
        players.unshift(lp); // Adds the last player to the front

        to_play = players[pl - 1];

        play_allowed = true;
        card_ask_perm = true;
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 4602,
                prev_card: prev_card,
            };
        }
    } else {
        play_allowed = false;

        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 4626,
            prev_card: prev_card,
        };
        break;
    }
}

if ([12, 13, 14, 15].includes(prev_card)) {
    if ([12, 13, 14, 15].includes(current_card)) {
        play_allowed = true;
        card_ask_perm = true;
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 4655,
                prev_card: prev_card,
            };
        }
    } else {
        if (hearts.includes(prev_card)) {
            if (allowed_q_hearts.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4679,
                        prev_card: prev_card,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4698,
                    prev_card: prev_card,
                };
                break;
            }
        } else if (diamonds.includes(prev_card)) {
            if (allowed_q_diamonds.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4720,
                        prev_card: prev_card,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4739,
                    prev_card: prev_card,
                };
                break;
            }
        } else if (flowers.includes(prev_card)) {
            if (allowed_q_flowers.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4761,
                        prev_card: prev_card,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4779,
                    prev_card: prev_card,
                };
                break;
            }
        } else if (spades.includes(prev_card)) {
            if (allowed_q_spades.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4802,
                        prev_card: prev_card,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4823,
                    prev_card: prev_card,
                };
                break;
            }
        }
    }
}



if ([16, 17, 18, 19].includes(prev_card)) {
    if ([16, 17, 18, 19].includes(current_card)) {
        play_allowed = true;
        card_ask_perm = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 4856,
                prev_card: prev_card
            };
        }
    } else {
        if (hearts.includes(prev_card)) {
            if (allowed_8_hearts.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4882,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4899,
                    prev_card: prev_card
                };
                break;
            }
        } else if (diamonds.includes(prev_card)) {
            if (allowed_8_diamonds.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4924,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4942,
                    prev_card: prev_card
                };
                break;
            }
        } else if (flowers.includes(prev_card)) {
            if (allowed_8_flowers.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 4967,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 4984,
                    prev_card: prev_card
                };
                break;
            }
        } else if (spades.includes(prev_card)) {
            if (allowed_8_spades.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 5008,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 5027,
                    prev_card: prev_card
                };
                break;
            }
        }
    }
}

if ([20, 21, 22, 23].includes(prev_card)) {
    if ([20, 21, 22, 23, 28, 29].includes(current_card)) {
        play_allowed = true;
        card_ask_perm = true;

        if (k === pll - 1) {
            let fine = 2;
            if (current_card === 28 || current_card === 29) {
                fine = 5;
            }
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 5068,
                prev_card: prev_card
            };
        }
    } else {
        if (hearts.includes(prev_card)) {
            if (allowed_2_hearts.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 3;

                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 5100,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 5117,
                    prev_card: prev_card
                };
                break;
            }
        } else if (diamonds.includes(prev_card)) {
            if (allowed_2_diamonds.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 3;

                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 5141,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 5157,
                    prev_card: prev_card
                };
                break;
            }
        } else if (flowers.includes(prev_card)) {
            if (allowed_2_flowers.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 3;

                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 5182,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 5198,
                    prev_card: prev_card
                };
                break;
            }
        } else if (spades.includes(prev_card)) {
            if (allowed_2_spades.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 3;

                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 5224,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 5240,
                    prev_card: prev_card
                };
                break;
            }
        }
    }
}


if ([24, 25, 26, 27].includes(prev_card)) {
    if ([24, 25, 26, 27, 28, 29].includes(current_card)) {
        play_allowed = true;
        card_ask_perm = true;

        if (k === pll - 1) {
            let fine = (current_card === 28 || current_card === 29) ? 5 : 3;
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 5280,
                prev_card: prev_card
            };
        }
    } else {
        if (hearts.includes(prev_card)) {
            if (allowed_3_hearts.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 5310,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 5327,
                    prev_card: prev_card
                };
                break;
            }
        } else if (diamonds.includes(prev_card)) {
            if (allowed_3_diamonds.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 5352,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 5370,
                    prev_card: prev_card
                };
                break;
            }
        } else if (flowers.includes(prev_card)) {
            if (allowed_3_flowers.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 5396,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 5412,
                    prev_card: prev_card
                };
                break;
            }
        } else if (spades.includes(prev_card)) {
            if (allowed_3_spades.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                        card_requests: card_request,
                        card_requested: card_requested,
                        last_play_cards: player_cards,
                        kadi: kadi,
                        cardless: cardless,
                        line: 5436,
                        prev_card: prev_card
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                    card_requests: card_request,
                    card_requested: card_requested,
                    last_play_cards: player_cards,
                    kadi: kadi,
                    cardless: cardless,
                    line: 5453,
                    prev_card: prev_card
                };
                break;
            }
        }
    }
}

if ([28, 29].includes(prev_card)) {
    if ([20, 21, 22, 23].includes(current_card)) {
        if (k === pll - 1) {
            fine = 2;
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 5489,
                prev_card: prev_card
            };
        }
        play_allowed = true;
    } else if ([24, 25, 26, 27].includes(current_card)) {
        if (k === pll - 1) {
            fine = 3;
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 5507,
                prev_card: prev_card
            };
        }
        play_allowed = true;
    } else if ([28, 29].includes(current_card)) {
        if (k === pll - 1) {
            fine = 5;
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 5526,
                prev_card: prev_card
            };
        }
        play_allowed = true;
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 5543,
            prev_card: prev_card
        };
        break;
    }
}


if ([30, 31, 32, 33].includes(prev_card)) {
    if ([30, 31, 32, 33].includes(current_card)) {
        play_allowed = true;
        card_ask_perm = true;

        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 5569,
                prev_card: prev_card,
            };
        }
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'none',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 5589,
            prev_card: prev_card,
        };
    }
}

if ([34, 35, 36, 37].includes(prev_card)) {
    if ([34, 35, 36, 37].includes(current_card)) {
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 5610,
                prev_card: prev_card,
            };
        }
        play_allowed = true;
        card_ask_perm = true;
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 5629,
            prev_card: prev_card,
        };
        break;
    }
}

if ([38, 39, 40, 41].includes(prev_card)) {
    if ([38, 39, 40, 41].includes(current_card)) {
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 5658,
                prev_card: prev_card,
            };
        }
        play_allowed = true;
        card_ask_perm = true;
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'none',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 5676,
            prev_card: prev_card,
        };
    }
}

if ([42, 43, 44, 45].includes(prev_card)) {
    if ([42, 43, 44, 45].includes(current_card)) {
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 5699,
                prev_card: prev_card,
            };
        }
        play_allowed = true;
        card_ask_perm = true;
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'none',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 5719,
            prev_card: prev_card,
        };
    }
}

if ([46, 47, 48, 49].includes(prev_card)) {
    if ([46, 47, 48, 49].includes(current_card)) {
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 5747,
                prev_card: prev_card,
            };
        }
        play_allowed = true;
        card_ask_perm = true;
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 5764,
            prev_card: prev_card,
        };
        break;
    }
}

if ([50, 51, 52, 53].includes(prev_card)) {
    if ([50, 51, 52, 53].includes(current_card)) {
        if (k === pll - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
                card_requests: card_request,
                card_requested: card_requested,
                last_play_cards: player_cards,
                kadi: kadi,
                cardless: cardless,
                line: 5789,
                prev_card: prev_card,
            };
        }
        play_allowed = true;
        card_ask_perm = true;
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
            card_requests: card_request,
            card_requested: card_requested,
            last_play_cards: player_cards,
            kadi: kadi,
            cardless: cardless,
            line: 5807,
            prev_card: prev_card,
        };
        break;
    }
}






}//end of second card





}//end of else for non pick











// Simulating database retrieval with LocalStorage
const query1 = JSON.parse(localStorage.getItem('challenge_registration')) || [];
//player_play = JSON.parse(localStorage.getItem('player_play')) || [];
//const action = JSON.parse(localStorage.getItem('action')) || {};

let all_cards = await getAllPlayerCards( play_type);
let all_playing_cards = Array.from(Array(54).keys()); // [0, 1, 2, ..., 53]
    
    /*let playerCards1 = (JSON.parse(localStorage.getItem('registrationData1'))).my_cards;
    let playerCards2 = (JSON.parse(localStorage.getItem('registrationData2'))).my_cards;
    all_cards = all_cards.concat(JSON.parse(playerCards1));
    all_cards = all_cards.concat(JSON.parse(playerCards2));*/

// Merge cards from other players
/*query1.forEach(q1 => {
    if (q1.userID !== user_id) {
        all_cards = all_cards.concat(JSON.parse(q1.my_cards));
    }
});
*/
// Update all_cards based on action
/*if (action.play_allowed === true) {
    const sp = player_play.length;
    all_cards.push(player_play[sp - 1]);
    all_cards = all_cards.concat(JSON.parse(localStorage.getItem('player_cards')) || []);
} else {
    const last_play = JSON.parse(localStorage.getItem('last_play'));
    all_cards.push(last_play);
    all_cards = all_cards.concat(JSON.parse(localStorage.getItem('player_cards')) || []);
}

// Remove used cards from all_playing_cards
all_cards.forEach(alc => {
    const ack = all_playing_cards.indexOf(alc);
    if (ack !== -1) {
        all_playing_cards.splice(ack, 1);
    }
});*/

// Update ready_cards
//ready_cards = all_playing_cards.slice();
/*console.log(user_id)*/
let tri = await getKadiPlays(duel_id)

let o_p = tri.last_play[0] == '[' ? JSON.parse(tri.last_play):tri.last_play;
last_play = o_p || [];
cardless_status = tri.cardless_status || [];
kadi_status = tri.kadi_status || '[]';//JSON.parse(o_plays.kadi_status || '[]');

let end_status = ''; // You can adjust this as needed
/*console.log(cardless_status== 0);
console.log(kadi_status.includes(user_id));
console.log(action.play_allowed);
console.log(player_play.length== 1);
console.log(player_cards.length ==0);
console.log(cardless_status.length == 0 && (action.play_allowed == true || action.play_allowed == 'true')&& kadi_status.includes(user_id) && player_play.length == 1 && player_cards.length ==0);*/
if (cardless_status.length == 0 && (action.play_allowed == true || action.play_allowed == 'true') && kadi_status.includes(user_id) && player_play.length === 1 && player_cards.length ===0) {
    
    const o_plays1 = last_play;
    
    o_plays1.push({
        player: user_id,
        play: JSON.stringify(player_play),
        player_fined: action.fine,
        play_allowed: action.play_allowed,
        to_fine: action.to_fine,
        next_player: action.next_player,
        card_requests: action.card_requests,
        card_requested: action.card_requested,
        game_end: true,
        kadi: action.kadi,
        cardless: action.cardless
    });

    action.game_end = 'true';
    action.game_winner = user_id != 19 ||user_id != '19'? getFullnameByID('registrationData2') : getFullnameByID('registrationData1'); // Implement this function to get the full name

    // Update LocalStorage
    tri.last_play = JSON.stringify(o_plays1);
    tri.ready_cards = ready_cards;
    tri.play_status = 'complete';
    tri.players = JSON.stringify(players);
    tri.playing = action.next_player;


await updateLeaderboard(user_id, 10);
        

let action_d = { ...action, ready_cards: ready_cards };

    if(play_type == 'single_player'){
        localStorage.setItem('kadi_plays', JSON.stringify(tri));
       if(user_id == 19 || user_id =='19'){
       /* console.log((JSON.parse(localStorage.getItem('registrationData1'))).my_cards)*/
    localStorage.setItem('registrationData1', JSON.stringify({
        ...JSON.parse(localStorage.getItem('registrationData1')),
        my_cards: JSON.stringify(player_cards) // Clear cards for user
    }));}
    else{
       /* console.log(player_cards);*/
        localStorage.setItem('registrationData2', JSON.stringify({
        ...JSON.parse(localStorage.getItem('registrationData2')),
        my_cards: JSON.stringify(player_cards) // Clear cards for user
    }));
    }
        // Update duel status
    localStorage.setItem('duel', JSON.stringify({
        ...JSON.parse(localStorage.getItem('duel')),
        winner: user_id,
        status: 'complete'
    }));
if (user_id != 19) {
        return (JSON.stringify(action_d)); // Adjust output as necessary
    }
}
else{
  await updateKadiPlays(tri);

await updatePlayerCards( player_cards);
return (JSON.stringify(action_d));
}
    // Determine action for AI or next player


/*


    localStorage.setItem('kadi_plays', JSON.stringify(tri));
     if(user_id == 19 || user_id =='19'){
    localStorage.setItem('registrationData1', JSON.stringify({
        ...JSON.parse(localStorage.getItem('registrationData1')),
        my_cards: JSON.stringify(player_cards) // Clear cards for user
    }));}
    else{
        localStorage.setItem('registrationData2', JSON.stringify({
        ...JSON.parse(localStorage.getItem('registrationData2')),
        my_cards: JSON.stringify(player_cards) // Clear cards for user
    }));
    }

*/

}
else{




let o_plays1 = last_play;
    let fined_card = null;
    if (action.fine == 1) {
        fined_card = ready_cards[ready_cards.length - 1];
        ready_cards.pop();
    }





const  o_plays1L =  o_plays1.length;
    o_plays1[ o_plays1L]={
        player: user_id,
        play: player_play,
        player_fined: action.fine,
        play_allowed: action.play_allowed,
        to_fine: action.to_fine,
        next_player: action.next_player,
        card_request: action.card_requests,
        card_requested: action.card_requested,
        kadi: action.kadi,
        cardless: action.cardless
    };
/*console.log( o_plays1);*/
    action.fined_card = fined_card;
    const cd = cardless_status || [];

   // if (!(JSON.parse(localStorage.getItem('registrationData2')).my_cards).length) {
    if (action.cardless == 'true' || action.cardless == true) {
        if (!cd.includes(user_id)) {
            cd.push(user_id);
        }
    } else {
        if (cd.includes(user_id)) {
            /*console.log(cd);*/
            cd.splice(cd.indexOf(user_id), 1);
        }
    }

    const kds1 = kadi_status || [];
/*console.log(kds1);*/
    if ((action.kadi == 'true' ||action.kadi == true ) && (action.cardless == 'false' || action.cardless == false)) {
        if (!kds1.includes(user_id)) {
            kds1.push(user_id);
        }
    } else {
        if (kds1.includes(user_id)) {
            kds1.splice(kds1.indexOf(user_id));
        }
    }
    /*console.log(action.cardless);
console.log(cd);*/

/*console.log(kds1);*/
    // Update LocalStorage for current plays
    tri.ready_cards = ready_cards;
    tri.play_status = 'playing';
    tri.cardless_status = cd;
    tri.kadi_status = kds1;
    tri.playing = action.next_player;
    tri.last_play = o_plays1;
    tri.game_end = 'false';
    tri.players= players;

/*$this->db->where('duel_id',$duel_id)->update('kadi_plays',['ready_cards'=>json_encode($ready_cards),'play_status'=>'playing','players'=>json_encode($players),'cardless_status'=>json_encode($cdl),'kadi_status'=>json_encode($kds),'playing'=>$action['next_player'],'last_play'=>json_encode($o_plays1),'game_end'=>'false']);*/


    // Save initial data to localStorage
//    localStorage.setItem('kadi_plays', JSON.stringify(kdp));
   
 
    action.game_end = 'false';

    let  action_d = { ...action, ready_cards: ready_cards, end_status: end_status };
    
    if(play_type == 'single_player'){
        localStorage.setItem('kadi_plays', JSON.stringify(tri));
       if(user_id == 19 || user_id =='19'){
       /* console.log((JSON.parse(localStorage.getItem('registrationData1'))).my_cards)*/
    localStorage.setItem('registrationData1', JSON.stringify({
        ...JSON.parse(localStorage.getItem('registrationData1')),
        my_cards: JSON.stringify(player_cards) // Clear cards for user
    }));}
    else{
       /* console.log(player_cards);*/
        localStorage.setItem('registrationData2', JSON.stringify({
        ...JSON.parse(localStorage.getItem('registrationData2')),
        my_cards: JSON.stringify(player_cards) // Clear cards for user
    }));
    }
        // Update duel status
    localStorage.setItem('duel', JSON.stringify({
        ...JSON.parse(localStorage.getItem('duel')),
        winner: user_id,
        status: 'complete'
    }));
//if (user_id != 19) {
        return (JSON.stringify(action_d)); // Adjust output as necessary
//    }
}
else{
  await updateKadiPlays(tri);

await updatePlayerCards( player_cards);
return (JSON.stringify(action_d));
}
       if(user_id == 19 || user_id =='19'){
       /* console.log('hello');*/
    localStorage.setItem('registrationData1', JSON.stringify({
        ...JSON.parse(localStorage.getItem('registrationData1')),
        my_cards: JSON.stringify(player_cards) // Clear cards for user
    }));}
    else{

        if(action.to_fine =="none"){
        localStorage.setItem('registrationData2', JSON.stringify({
        ...JSON.parse(localStorage.getItem('registrationData2')),
        my_cards: JSON.stringify(player_cards) // Clear cards for user

    }));
    }
    }

   // }

   /* let action_d = {};
    if (action.next_player == '19') {
      
        action_d = { ...action, ready_cards: ready_cards, end_status: end_status };
      console.log( aiTurn(action_d, duel_id, players)); // Implement this function for AI turn logic
    } else {
     }

    if (user !== 19) {
        
        return (JSON.stringify(action_d)); // Adjust output as necessary
    }*/


}



}


} //end of for





















///next block
function process_card_request(cards = null, players, currentPlayer, to_play) {
    // var_dump(cards);
    const userId = sessionStorage.getItem('userID'); // Assuming session storage is used
    const duelId = 1270; // You can modify this to get it dynamically
    const hearts = [0, 4, 8, 12, 16, 20, 24, 30, 34, 38, 42, 46, 50];
    const diamonds = [1, 5, 9, 13, 17, 21, 25, 31, 35, 39, 43, 47, 51];
    const flowers = [2, 6, 10, 14, 18, 22, 26, 32, 36, 40, 44, 48, 52];
    const spades = [3, 7, 11, 15, 19, 23, 27, 33, 37, 41, 45, 49, 53];

    const allowedQHearts = [16, 30, 34, 38, 42, 46, 50];
    const allowedQDiamonds = [17, 31, 35, 39, 43, 47, 51];
    const allowedQFlowers = [18, 32, 36, 40, 44, 48, 52];
    const allowedQSpades = [19, 33, 37, 41, 45, 49, 53];

    const allowed8Hearts = [12, 30, 34, 38, 42, 46, 50];
    const allowed8Diamonds = [13, 31, 35, 39, 43, 47, 51];
    const allowed8Flowers = [14, 32, 36, 40, 44, 48, 52];
    const allowed8Spades = [15, 33, 37, 41, 45, 49, 53];

    const allowed2Hearts = [24, 28, 29];
    const allowed2Diamonds = [25, 28, 29];
    const allowed2Flowers = [26, 28, 29];
    const allowed2Spades = [27, 28, 29];

    const allowed3Hearts = [20, 28, 29];
    const allowed3Diamonds = [21, 28, 29];
    const allowed3Flowers = [22, 28, 29];
    const allowed3Spades = [23, 28, 29];
    const allowedJK = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29];

    const playerCount = players.length;
    currentPlayer = players[playerCount - 1];

    const cardCount = cards.length;
    toPlay = players[playerCount - 1];

    let cardRequest = false;
    let cardRequested = '';
    let playerAskCard = false;
    let action = {};

    for (let k = 0; k < cards.length; k++) {
        let current_card = cards[k];
        let prev_card;

        if (k === 0) {
            prev_card = cards[0];
        } else {
            prev_card = cards[k - 1];
        }

        // Check all breaks and action return
        if ([4, 5, 6, 7].includes(prev_card)) {
            if ([4, 5, 6, 7].includes(current_card)) {
                const playAllowed = true;
                const cardAskPerm = true;
                const ps = playerCount - 1;

                const op = players[0];
                players.splice(0, 1); // Remove first player
                players.reverse(); // Reverse the array
                players.push(op); // Add the first player to the end

                toPlay = players[ps];
                if (k === cardCount - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        }

        if ([8, 9, 10, 11].includes(prev_card)) {
            if ([8, 9, 10, 11].includes(current_card)) {
                const pl = players.length;
                const lp = players[pl - 1];
                currentPlayer = players[pl - 1];
                players.pop(); // Remove last player
                players.unshift(lp); // Add last player to the front

                toPlay = players[pl - 1];

                const playAllowed = true;
                const cardAskPerm = true;
                if (k === cardCount - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                    };
                }
            } else {
                const playAllowed = false;

                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        }

if ([12, 13, 14, 15].includes(prev_card)) {
    if ([12, 13, 14, 15].includes(current_card)) {
        play_allowed = true;
        card_ask_perm = true;

        if (k === cardCount - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
            };
        }
    } else {
        if (hearts.includes(prev_card)) {
            if (allowed_q_hearts.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (diamonds.includes(prev_card)) {
            if (allowed_q_diamonds.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (flowers.includes(prev_card)) {
            if (allowed_q_flowers.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (spades.includes(prev_card)) {
            if (allowed_q_spades.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        }
    }
}

if ([16, 17, 18, 19].includes(prev_card)) {
    if ([16, 17, 18, 19].includes(current_card)) {
        play_allowed = true;
        card_ask_perm = true;

        if (k === cardCount - 1) {
            action = {
                fine: 'none',
                play_allowed: 'true',
                to_fine: 'none',
                next_player: to_play,
            };
        }
    } else {
        if (hearts.includes(prev_card)) {
            if (allowed_8_hearts.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (diamonds.includes(prev_card)) {
            if (allowed_8_diamonds.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (flowers.includes(prev_card)) {
            if (allowed_8_flowers.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (spades.includes(prev_card)) {
            if (allowed_8_spades.includes(current_card)) {
                play_allowed = true;
                question_allowed = false;

                if (k === pll - 1) {
                    action = {
                        fine: 'none',
                        play_allowed: 'true',
                        to_fine: 'none',
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        }
    }
}


if ([20, 21, 22, 23].includes(prev_card)) {
    if ([20, 21, 22, 23, 28, 29].includes(current_card)) {
        play_allowed = true;
        card_ask_perm = true;

        if (k === cardCount - 1) {
            let fine = (current_card === 28 || current_card === 29) ? 5 : 2;
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
            };
        }
    } else {
        if (hearts.includes(prev_card)) {
            if (allowed_2_hearts.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 3;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (diamonds.includes(prev_card)) {
            if (allowed_2_diamonds.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 3;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (flowers.includes(prev_card)) {
            if (allowed_2_flowers.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 3;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (spades.includes(prev_card)) {
            if (allowed_2_spades.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 3;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        }
    }
}
if ([24, 25, 26, 27].includes(prev_card)) {
    if ([24, 25, 26, 27, 28, 29].includes(current_card)) {
        play_allowed = true;
        card_ask_perm = true;

        if (k === cardCount - 1) {
            let fine = (current_card === 28 || current_card === 29) ? 5 : 3;
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
            };
        }
    } else {
        if (hearts.includes(prev_card)) {
            if (allowed_3_hearts.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (diamonds.includes(prev_card)) {
            if (allowed_3_diamonds.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (flowers.includes(prev_card)) {
            if (allowed_3_flowers.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        } else if (spades.includes(prev_card)) {
            if (allowed_3_spades.includes(current_card)) {
                play_allowed = true;
                if (k === pll - 1) {
                    let fine = 2;
                    action = {
                        fine: fine,
                        play_allowed: 'true',
                        to_fine: to_play,
                        next_player: to_play,
                    };
                }
            } else {
                action = {
                    fine: '1',
                    play_allowed: 'false',
                    to_fine: 'self',
                    next_player: to_play,
                };
                break;
            }
        }
    }
}

if ([28, 29].includes(prev_card)) {
    if ([20, 21, 22, 23].includes(current_card)) {
        if (k === cardCount - 1) {
            let fine = 2;
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
            };
        }
        play_allowed = true;
    } else if ([24, 25, 26, 27].includes(current_card)) {
        if (k === pll - 1) {
            let fine = 3;
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
            };
        }
        play_allowed = true;
    } else if ([28, 29].includes(current_card)) {
        if (k === pll - 1) {
            let fine = 5;
            action = {
                fine: fine,
                play_allowed: 'true',
                to_fine: to_play,
                next_player: to_play,
            };
        }
        play_allowed = true;
    } else {
        action = {
            fine: '1',
            play_allowed: 'false',
            to_fine: 'self',
            next_player: to_play,
        };
        break;
    }
}



    if ([30, 31, 32, 33].includes(prev_card)) {
        if ([30, 31, 32, 33].includes(current_card)) {
            playAllowed = true;
            cardAskPerm = true;

            if (k === cardCount - 1) {
                action = {
                    fine: 'none',
                    play_allowed: true,
                    to_fine: 'none',
                    next_player: to_play
                };
            }
        } else {
            action = {
                fine: '1',
                play_allowed: false,
                to_fine: 'none',
                next_player: to_play
            };
            return action;
        }
    }

    if ([34, 35, 36, 37].includes(prev_card)) {
        if ([34, 35, 36, 37].includes(current_card)) {
            playAllowed = true;
            cardAskPerm = true;

            if (k === cardCount - 1) {
                action = {
                    fine: 'none',
                    play_allowed: true,
                    to_fine: 'none',
                    next_player: to_play
                };
            }
        } else {
            action = {
                fine: '1',
                play_allowed: false,
                to_fine: 'self',
                next_player: to_play
            };
            return action;
        }
    }

    if ([38, 39, 40, 41].includes(prev_card)) {
        if ([38, 39, 40, 41].includes(current_card)) {
            playAllowed = true;
            cardAskPerm = true;

            if (k === cardCount - 1) {
                action = {
                    fine: 'none',
                    play_allowed: true,
                    to_fine: 'none',
                    next_player: to_play
                };
            }
        } else {
            action = {
                fine: '1',
                play_allowed: false,
                to_fine: 'none',
                next_player: to_play
            };
            return action;
        }
    }

    if ([42, 43, 44, 45].includes(prev_card)) {
        if ([42, 43, 44, 45].includes(current_card)) {
            playAllowed = true;
            cardAskPerm = true;

            if (k === cardCount - 1) {
                action = {
                    fine: 'none',
                    play_allowed: true,
                    to_fine: 'none',
                    next_player: to_play
                };
                return action;
            }
        } else {
            action = {
                fine: '1',
                play_allowed: false,
                to_fine: 'none',
                next_player: to_play
            };
            return action;
        }
    }

    if ([46, 47, 48, 49].includes(prev_card)) {
        if ([46, 47, 48, 49].includes(current_card)) {
            playAllowed = true;
            cardAskPerm = true;

            if (k === cardCount - 1) {
                action = {
                    fine: 'none',
                    play_allowed: true,
                    to_fine: 'none',
                    next_player: to_play
                };
            }
        } else {
            action = {
                fine: '1',
                play_allowed: false,
                to_fine: 'self',
                next_player: to_play
            };
            return action;
        }
    }

    if ([50, 51, 52, 53].includes(prev_card)) {
        if ([50, 51, 52, 53].includes(current_card)) {
            playAllowed = true;
            cardAskPerm = true;

            if (k === cardCount - 1) {
                action = {
                    fine: 'none',
                    play_allowed: true,
                    to_fine: 'none',
                    next_player: to_play
                };
            }
        } else {
            action = {
                fine: '1',
                play_allowed: false,
                to_fine: 'self',
                next_player: to_play
            };
            return action;
        }
    }





    }

    // Return action
    return action;
}


//next block 


// Helper function to determine card rank and suit
function getCardInfo(card) {
    const brackets = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9, 10, 11],
        [12, 13, 14, 15],
        [16, 17, 18, 19],
        [20, 21, 22, 23],
        [24, 25, 26, 27],
        [28, 29], // Jokers
        [30, 31, 32, 33],
        [34, 35, 36, 37],
        [38, 39, 40, 41],
        [42, 43, 44, 45],
        [46, 47, 48, 49],
        [50, 51, 52, 53]
    ];
    const suits = ['hearts', 'diamonds', 'flowers', 'spades'];
    let suit = '';
    let rank = null;

    // Determine the suit
    if ([0, 4, 8, 12, 16, 20, 24, 30, 34, 38, 42, 46, 50].includes(card)) {
        suit = 'hearts';
    } else if ([1, 5, 9, 13, 17, 21, 25, 31, 35, 39, 43, 47, 51].includes(card)) {
        suit = 'diamonds';
    } else if ([2, 6, 10, 14, 18, 22, 26, 32, 36, 40, 44, 48, 52].includes(card)) {
        suit = 'flowers';
    } else if ([3, 7, 11, 15, 19, 23, 27, 33, 37, 41, 45, 49, 53].includes(card)) {
        suit = 'spades';
    }

    // Determine the rank
    if ([28, 29].includes(card)) {
        rank = 'Joker';
        suit = 'none';
    } else {
        for (let i = 0; i < brackets.length; i++) {
            if (brackets[i].includes(card)) {
                rank = i;
                break;
            }
        }
    }

    return [rank, suit];
}

// Helper function to check if a card is playable
function isPlayable(card, topCard) {
    if ([0, 1, 2, 3].includes(card) || [28, 29].includes(card)) {
        return true;
    }

    const [cardRank, cardSuit] = getCardInfo(card);
   
    const [topRank, topSuit] = getCardInfo(topCard);

    return cardRank === topRank || cardSuit === topSuit;
}
function isMultiPlayable(card, topCard) {
    

    const [cardRank, cardSuit] = getCardInfo(card);
   
    const [topRank, topSuit] = getCardInfo(topCard);

    return cardRank === topRank || cardSuit === topSuit;
}
// Function to get the majority suit from a deck
function getMajoritySuit(deck) {
    // Define suits
    let hearts = 0;
    let diamonds = 0;
    let flowers = 0;
    let spades = 0;

    // Define which cards belong to which suit
    const heartsCards = [0, 4, 8, 12, 16, 20, 24, 30, 34, 38, 42, 46, 50];
    const diamondsCards = [1, 5, 9, 13, 17, 21, 25, 31, 35, 39, 43, 47, 51];
    const flowersCards = [2, 6, 10, 14, 18, 22, 26, 32, 36, 40, 44, 48, 52];
    const spadesCards = [3, 7, 11, 15, 19, 23, 27, 33, 37, 41, 45, 49, 53];

    // Process the deck, ignoring Joker cards (assuming 28 and 29 are Jokers)
    for (const card of deck) {
        if (heartsCards.includes(card)) {
            hearts++;
        } else if (diamondsCards.includes(card)) {
            diamonds++;
        } else if (flowersCards.includes(card)) {
            flowers++;
        } else if (spadesCards.includes(card)) {
            spades++;
        }
        // Ignore the Joker (assuming Joker is card number 28 and 29)
    }

    // Determine the majority suit
    const suits = {
        hearts,
        diamonds,
        flowers,
        spades
    };

    // Find the suit with the highest count
    const sortedSuits = Object.entries(suits).sort((a, b) => b[1] - a[1]);
    const highestCount = sortedSuits[0][1];

    // Check if there's a tie or if all are zero
    if (sortedSuits.length > 1 && sortedSuits[0][1] === sortedSuits[1][1]) {
        // If there's no majority, randomize a suit
        const randomSuits = ['hearts', 'diamonds', 'flowers', 'spades'];
        return randomSuits[Math.floor(Math.random() * randomSuits.length)];
    }

    // Return the suit with the majority
    return sortedSuits[0][0]; // Return the suit name
}

function recurseIsPlayable1(cards) {
    const results = [];

    function helper(currentPath, remainingCards) {
        if (remainingCards.length === 0) {
            results.push([...currentPath]);
            return;
        }

        const currentCard = currentPath[currentPath.length - 1];

        let foundMatch = false;

        for (let i = 0; i < remainingCards.length; i++) {
            const nextCard = remainingCards[i];
            if (isMultiPlayable(currentCard, nextCard)) {
                const newRemaining = remainingCards.filter((_, idx) => idx !== i);
                helper([...currentPath, nextCard], newRemaining);
                foundMatch = true;
            }
        }

        // If no further compatible match, we still push current path
        if (!foundMatch && currentPath.length > 1) {
            results.push([...currentPath]);
        }
    }

    const firstCard = cards[0];
    const remaining = cards.slice(1);

    helper([firstCard], remaining);
    return results;
}

// AI's turn
async function aiTurn(action = null, duelId = 1384, players = null) {
    console.log(action);
    let playerPlay = [];
    let cardRequest = action.card_requests;
    let cardRequested = action.card_requested;

    const hearts = [0, 4, 8, 12, 16, 20, 24, 30, 34, 38, 42, 46, 50];
    const diamonds = [1, 5, 9, 13, 17, 21, 25, 31, 35, 39, 43, 47, 51];
    const flowers = [2, 6, 10, 14, 18, 22, 26, 32, 36, 40, 44, 48, 52];
    const spades = [3, 7, 11, 15, 19, 23, 27, 33, 37, 41, 45, 49, 53];

    const allowedQHearts = [16, 30, 34, 38, 42, 46, 50];
    const allowedQDiamonds = [17, 31, 35, 39, 43, 47, 51];
    const allowedQFlowers = [18, 32, 36, 40, 44, 48, 52];
    const allowedQSpades = [19, 33, 37, 41, 45, 49, 53];

    const allowed8Hearts = [12, 30, 34, 38, 42, 46, 50];
    const allowed8Diamonds = [13, 31, 35, 39, 43, 47, 51];
    const allowed8Flowers = [14, 32, 36, 40, 44, 48, 52];
    const allowed8Spades = [15, 33, 37, 41, 45, 49, 53];

    const allowed2Hearts = [24, 28, 29];
    const allowed2Diamonds = [25, 28, 29];
    const allowed2Flowers = [26, 28, 29];
    const allowed2Spades = [27, 28, 29];

    const allowed3Hearts = [20, 28, 29];
    const allowed3Diamonds = [21, 28, 29];
    const allowed3Flowers = [22, 28, 29];
    const allowed3Spades = [23, 28, 29];
    const allowedJK = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29];







    // Assuming db is an object to interact with your database
 const lastPlayQuery = await getKadiPlays(duel_id) || {};

 /*console.log(lastPlayQuery.last_play);*/
const kppo = Array.isArray(lastPlayQuery.last_play)?lastPlayQuery.last_play:JSON.parse(lastPlayQuery.last_play);
let lastPlay = kppo || []
    const lpl = lastPlay.length;
    /*console.log(lpl);*
    let topDiscardCard = lastPlay[0].play[0];
    const gameEnd = lastPlayQuery.game_end;
    for (let i = lpl - 1; i >= 1; i--) {
        const lpla = Array.isArray(lastPlay[i].play)?lastPlay[i].play:JSON.parse(lastPlay[i].play);
//look at this

        if (lpla[lpla.length - 1] !== 'picked_card' && lastPlay[i].to_fine !== 'self') {
            let s = lpla.length - 1;

            for (let t = s; t >= 0; t--) {
                if (action.card_requests === 'true' && [0, 1, 2, 3].includes(lpla[t])) {
                    topDiscardCard = parseInt(lpla[t]);
                    break;
                } else if (lpla[t] === 28 && lpla[t] === 29 && lastPlay[i].to_fine === '19') {
                    topDiscardCard = parseInt(lpla[t]);
                    break;
                } else {
                    if ((action.card_requests !== 'true' && ![0, 1, 2, 3].includes(lpla[t])) || 
                        (lpla[t] !== 28 && lpla[t] !== 29 && lastPlay[i].to_fine !== '19')) {
                        topDiscardCard = parseInt(lpla[t]);
                        break;
                    }
                }
            }
            break;
        }
    }

    let acceptedPlay = [];
    let kadi ;
    let cardless ;
    const readyCards = action.ready_cards; // Ready cards array
    console.log(readyCards)
    const playerCardsQuery = JSON.parse(localStorage.getItem('registrationData1'));
    let playerCards = JSON.parse(playerCardsQuery.my_cards);
    
    // Initializations
    const cardSequence = ['A', 'Jump', 'Kickback', 'Q', '8', '2', '3', 'Joker', '4', '5', '6', '7', '9', '10'];
 let playableCards = [];
    const toFine = action.to_fine;

    // Identify playable cards
    for (let card of playerCards) {

    if (action.card_requests == true) {
       
        const requestMap = {
            hearts: hearts,
            diamonds: diamonds,
            flowers: flowers,
            spades: spades
        };
console.log(requestMap[action.card_requested]);
console.log(requestMap[action.card_requested]);
        const common = requestMap[action.card_requested].filter(card => playerCards.includes(card));

        playableCards = common.length === 0 ? [] : common;
    }

    else{
        const [rank, suit] = getCardInfo(card);
        
        if (isPlayable(card, topDiscardCard)) {
            playableCards.push(card);
            
        }
    }
    }
console.log(playableCards);
    if (toFine == '19') {
        const common = playableCards.filter(card => [0, 1, 2, 3, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29].includes(card));
        playableCards = common.length === 0 ? [] : common;
    }




console.log(playableCards);

    // No playable cards, draw a card
    if (playableCards.length === 0) {
        if (toFine == '19') {
            const pf = action.fine;
            for (let i = 0; i < pf; i++) {
                shuffle(readyCards);
                const drawnCard = readyCards.pop();
                playerCards .push(drawnCard);
            }
        } else {
            shuffle(readyCards);
            const drawnCard = readyCards.pop();
       
         playerCards.push(drawnCard);
        }

        acceptedPlay = ['picked_card'];
        kadi = "false";
        cardless = "false";
    } else {
        let allPlayableCards = [];

        for (let pc of playableCards) {
            let rCards = [];
            const fixed = pc;
            console.log(playerCards.includes(fixed)==true);
            const remainingArray =playerCards.filter(ra => ra!=fixed);// playerCards.slice(1);

            if ([0, 1, 2, 3].includes(fixed)) {
                rCards = remainingArray.filter(ra => [0, 1, 2, 3].includes(ra));
                 rCards.unshift(fixed);
            } else if ([4, 5, 6, 7].includes(fixed)) {
                rCards = remainingArray.filter(ra => [4, 5, 6, 7].includes(ra));
                 rCards.unshift(fixed);
            } else if ([8, 9, 10, 11].includes(fixed)) {
                rCards = remainingArray.filter(ra => [8, 9, 10, 11].includes(ra));
                 rCards.unshift(fixed);
            } else if ([12, 13, 14, 15, 16, 17, 18, 19].includes(fixed)) {
                
                let fc = remainingArray.filter(ra => [12, 13, 14, 15, 16, 17, 18, 19,30, 31, 32, 33,34, 35, 36, 37,38, 39, 40, 41,42, 43, 44, 45,46, 47, 48, 49,50, 51, 52, 53].includes(ra));
                
                
                let rCards1 = recurseIsPlayable1(fc);
                if(rCards1.length > 0){
                for(r1 of rCards1){
                 r1.unshift(fixed);
                 r1.unshift('undefined');
                 allPlayableCards.push(r1)
                }
            }
            } else if ([20, 21, 22, 23, 24, 25, 26, 27, 28, 29].includes(fixed)) {
                let fc = remainingArray.filter(ra => [20, 21, 22, 23, 24, 25, 26, 27, 28, 29].includes(ra));
                
                let rCards1 = recurseIsPlayable1(fc);
                if(rCards1.length > 0){
                for(let r1 of rCards1){
                 r1.unshift(fixed);
                 r1.unshift('undefined');
                 allPlayableCards.push(r1)
                }
            }
            } else if ([30, 31, 32, 33].includes(fixed)) {
                rCards = remainingArray.filter(ra => [30, 31, 32, 33].includes(ra));
                rCards.unshift(fixed);
                console.log(rCards);
            } else if ([34, 35, 36, 37].includes(fixed)) {
                rCards = remainingArray.filter(ra => [34, 35, 36, 37].includes(ra));
                 rCards.unshift(fixed);
            } else if ([38, 39, 40, 41].includes(fixed)) {
                rCards = remainingArray.filter(ra => [38, 39, 40, 41].includes(ra));
                 rCards.unshift(fixed);
            } else if ([42, 43, 44, 45].includes(fixed)) {
                rCards = remainingArray.filter(ra => [42, 43, 44, 45].includes(ra));
                 rCards.unshift(fixed);
            } else if ([46, 47, 48, 49].includes(fixed)) {
                rCards = remainingArray.filter(ra => [46, 47, 48, 49].includes(ra));
                 rCards.unshift(fixed);
            } else if ([50, 51, 52, 53].includes(fixed)) {
                rCards = remainingArray.filter(ra => [50, 51, 52, 53].includes(ra));
                 rCards.unshift(fixed);
            }

            if (rCards.length > 0) {
              
                allPlayableCards.push(rCards);
            }
        }

console.log(allPlayableCards);
        // Play a card
        if (allPlayableCards.length > 0) {
            acceptedPlay = allPlayableCards[0]; // Pick the first valid set
            playerCards = playerCards.filter(card => !acceptedPlay.includes(card)); // Remove played cards
        }
if(acceptedPlay.length > 1 && playerCards.length == 0 &&  [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53].includes(acceptedPlay[acceptedPlay.length - 1]) &&  [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53].includes(acceptedPlay[acceptedPlay.length - 2])){
    playerCards.push(acceptedPlay[acceptedPlay.length - 1]);
    acceptedPlay.pop();
}
        kadi = playerCards.length == 1? "true":"false"; // Check if about to finish
        cardless = playerCards.length == 0 ? "true":"false"; // Check if no cards left
    }

   //Handle special cases
     if ([0,1,2,3].includes(acceptedPlay[acceptedPlay.length - 1] ) && action.to_fine != '19') {
                cardRequested =  getMajoritySuit(playerCards);
                cardRequest = true;
               
                
            }
            else if([12,13,14,15,16,17,18,19].includes(acceptedPlay[acceptedPlay.length - 1] )){
                   shuffle(ready_cards);
            const drawn_card = ready_cards.splice(-1);
                    playerCards.push(drawn_card);


            }
    console.log(cardRequest)
    console.log(cardRequested)
 // Prepare the data to send
    // Send data to the game processor
    // Replace with the actual method to send data in your app

 
  /*  function kadiPlay(
  player = null,
  player_cards = null,
  cardless = null,
  kadi = null,
  player_play = null,
  ready_cards = null,
  card_request = null,
  card_requested = null,
  lastPlay = null,
  duelId = null,
)*/
    const resp = await kadiPlay(19,playerCards,cardless,kadi,acceptedPlay,readyCards,cardRequest,cardRequested,null,duelId)

  if((JSON.parse(resp)).next_player == 19 || (JSON.parse(resp)).next_player == "19"){
   
await aiTurn(JSON.parse(resp), duelId);
}


   // sendDataToGameProcessor(dataToSend);
}

// Function to send data to the game processor
function sendDataToGameProcessor(data) {
    // Implement the logic to send the data to your game processor
    kadiPlay(data);
    /*(console.log('Data sent to game processor:', data);*/
}

// Placeholder function to simulate database access
/*const db = {
    where: (key, value) => ({
        get: (table) => {
            // Replace with actual database access logic
            return {
                row: (rowName) => {
                    // Mock data for demonstration
                    if (table === 'kadi_plays') {
                        return { last_play: '[{"play":[0,1,2,3]}]' };
                    }
                    return { my_cards: '[1,2,3,4,5]' };
                }
            };
        }
    })
};*/

// Placeholder function for shuffling an array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


// Function to start the game and deal cards to AI
function aiStart(readyCards) {
    /*console.log(readyCards);*/
    let deck = readyCards.slice(); // Copy of readyCards
    shuffle(deck);

    // Deal 4 random cards to AI
    let playerCards = deck.splice(0, 4);

    // Initial discard pile and draw pile
    let discardPile = [deck.pop()];
    readyCards = deck;

const kadiPlays = getLocalStorage('kadi_plays', null)|| [];
const reg1 = getLocalStorage('registrationData1', null)|| [];

    const data1 = {
        ...kadiPlays,
        ready_cards: readyCards,
    };

    const data2 = {
        ...reg1,
        my_cards: JSON.stringify(playerCards),
    };

    // Store data in Local Storage
    updateLocalStorage('kadi_plays',null, data1);
    updateLocalStorage('registrationData1', null, data2); // Assuming 19 is userID for kadi_ai

    return { player_cards: playerCards, discard_pile: discardPile, ready_cards: readyCards };
}

// Function to generate combinations recursively
function generate(subArray, length, start, array, results) {
    if (length === 0) {
        results.push([...subArray]); // Use spread operator to push a copy
        return;
    }

    for (let i = start; i <= array.length - length; i++) {
        subArray.push(array[i]);
        generate(subArray, length - 1, i + 1, array, results);
        subArray.pop(); // Remove last element to backtrack
    }
}

// Function to get all combinations of an array
function getCombinations(array) {
    const results = [];
    const arrayLength = array.length;

    // Loop through to generate all combinations from single-value arrays to arrays containing all elements
    for (let i = 1; i <= arrayLength; i++) {
        generate([], i, 0, array, results);
    }

    return results;
}

// Function to generate permutations recursively
function permute(items, perms = [], results, fixed) {
    if (items.length === 0) {
        perms.unshift(fixed); // Add fixed element at the start
        results.push(perms);
    } else {
        for (let i = 0; i < items.length; i++) {
            const newItems = items.slice();
            const newPerms = [...perms]; // Copy current permutations
            const current = newItems.splice(i, 1)[0]; // Remove current item
            newPerms.push(current);
            permute(newItems, newPerms, results, fixed);
        }
    }
}

// Function to get all permutations of an array with the first element fixed
function getPermutations(array, fixed) {
    const results = [];
    permute(array, [], results, fixed);
    return results;
}

// Function to sort arrays by length in descending order
function sortArraysByLengthDescending(arrays) {
    return arrays.sort((a, b) => b.length - a.length);
}

// Function to shuffle an array (Fisher-Yates Shuffle)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

// Function to update Local Storage
function updateLocalStorage(tableName = null, duelId = null, data = null) {
    const key = tableName;//`${tableName}_${duelId}`;
    localStorage.setItem(key, JSON.stringify(data));
}

// Function to retrieve data from Local Storage
function getLocalStorage(tableName, duelId = null) {
    const key = tableName;//`${tableName}_${duelId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function getFullnameByID(storage){
const player = JSON.parse(localStorage.getItem(storage))
  return  player.name;
}






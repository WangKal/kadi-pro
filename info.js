
async function displayLeaderboard() {
    const entries = await getTopPlayers();
    if (!entries) return;

    let leaderboardHTML = '';
    entries.forEach(entry => {
        leaderboardHTML += `
            <tr>
                <td>${entry.getRank()}</td>
                <td><img src="${entry.getPlayer().getPhoto()}" width="30"> ${entry.getPlayer().getName()}</td>
                <td>${entry.getScore()}</td>
            </tr>
        `;
    });

    document.getElementById("leaderboard-list").innerHTML = leaderboardHTML;
    $('#leader_board').modal('show');
}


async function getTopPlayers() {
    const db = firebase.database();
    const leaderboardRef = db.ref("leaderboard")
        .orderByChild("score")
        .limitToLast(10); // Last 10 since highest scores are last

    leaderboardRef.once("value")
        .then(snapshot => {
            const data = [];
            snapshot.forEach(childSnapshot => {
                const val = childSnapshot.val();
                data.unshift({
                    name: val.name || "Unknown",
                    score: val.score || 0,
                    uid: childSnapshot.key
                });
            });

            console.log("Top Players:");
            data.forEach((entry, index) => {
                console.log(`${index + 1}. ${entry.name} - ${entry.score} points`);
            });

            // Optionally render in UI
            return data;
        })
        .catch(error => {
            console.error("Error fetching leaderboard:", error);
        });
}

async function getPlayerRank(playerID) {
    const db = firebase.database();
    const leaderboardRef = db.ref("leaderboard")
        .orderByChild("score");

    leaderboardRef.once("value")
        .then(snapshot => {
            const players = [];

            snapshot.forEach(childSnapshot => {
                players.push({
                    uid: childSnapshot.key,
                    name: childSnapshot.val().name || "Unknown",
                    score: childSnapshot.val().score || 0
                });
            });

            // Sort descending by score
            players.sort((a, b) => b.score - a.score);

            const rank = players.findIndex(p => p.uid === playerID) + 1;

            if (rank > 0) {
                const player = players[rank - 1];
                const result = `Your Rank: ${rank} | Score: ${player.score}`;
                console.log(result);
                updatePlayerRankUI(result); // Optional
            } else {
                console.log("You are not ranked yet.");
                updatePlayerRankUI("You are not ranked yet."); // Optional
            }
        })
        .catch(error => {
            console.error("Error fetching player rank:", error);
        });
}



async function updateLeaderboard(playerID, playerName, score) {
    const db = firebase.database();
    const playerRef = db.ref("leaderboard/" + playerID);

    playerRef.once("value")
        .then(snapshot => {
            let currentScore = 0;
            if (snapshot.exists()) {
                currentScore = parseInt(snapshot.val().score || 0);
            }

            let totalScore = parseInt(score) + currentScore;
            totalScore = totalScore >= 0 ? totalScore : 0;

            return playerRef.update({
                name: playerName,
                score: totalScore
            });
        })
        .then(() => {
            console.log("Leaderboard updated for", playerName, "with score:", score);
        })
        .catch(error => {
            console.error("Error updating leaderboard:", error);
        });
}



async function showInterstitialAd() {
    try {
        if (interstitialAd) {
            await interstitialAd.showAsync();
            console.log("Interstitial Ad displayed");
        } else {
            console.warn("Interstitial Ad not ready");
        }
    } catch (error) {
        console.error("Error displaying Interstitial Ad:", error);
    }
}

async function showRewardedAd() {
    try {
        if (rewardedAd) {
            await rewardedAd.showAsync();
            console.log("Rewarded Ad displayed - Give reward");
            givePlayerReward(); // Implement reward logic
        } else {
            console.warn("Rewarded Ad not ready");
        }
    } catch (error) {
        console.error("Error displaying Rewarded Ad:", error);
    }
}







   function showCustomAlert(text) {
        var alertBox = document.getElementById("custom-alert");
        $("#custom-alert").text(text);
        alertBox.style.display = "block";

       
        setTimeout(function() {
            alertBox.style.display = "none";
        }, 5000); 
    }



 let currentChatView = 'game';
  let currentTargetID = duel_id; // Replace with current gameID or DM ID
  let unreadFlags = {};

  const drawer = document.getElementById('chat-drawer');
  const handle = document.getElementById('chat-handle');
  const messages = document.getElementById('chat-messages');
  const input = document.getElementById('msgInput');
  const emojiPicker = document.getElementById('emojiPicker');
  const gifPicker = document.getElementById('gifPicker');
  const gifSearch = document.getElementById('gifSearch');
  const gifResults = document.getElementById('gifResults');
  const toast = document.getElementById('toast');
  const subdrawer = document.getElementById('chat-subdrawer');
  const chatList = document.getElementById('chat-list');
  const onlineList = document.getElementById('online-list');

   function toggleChatDrawer() {
    document.getElementById('chat-drawer').classList.toggle('open');
  }

  function toggleSubdrawer() {
    document.getElementById('chat-subdrawer').classList.toggle('open');
  }

  function appendMessage(sender, text) {
    const msg = document.createElement('div');
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
    if (!drawer.classList.contains('open')) drawer.classList.add('open');
  }

  function toggleSubdrawer() {
    subdrawer.classList.toggle('open');
  }

  function showChats() {
    chatList.style.display = 'block';
    onlineList.style.display = 'none';
    loadChatList();
  }

  function showOnline() {
    chatList.style.display = 'none';
    onlineList.style.display = 'block';
    loadOnlinePlayers();
  }

  function toggleEmojiPicker() {
    emojiPicker.style.display = emojiPicker.style.display === 'block' ? 'none' : 'block';
    gifPicker.style.display = 'none';
  }

  function toggleGifPicker() {
    gifPicker.style.display = gifPicker.style.display === 'block' ? 'none' : 'block';
    emojiPicker.style.display = 'none';
  }

  emojiPicker.addEventListener('emoji-click', e => input.value += e.detail.unicode);

  handle.addEventListener('click', () => drawer.classList.toggle('open'));

  gifSearch.addEventListener('input', () => {
    const term = gifSearch.value.trim();
    if (!term) return;
    fetch(`https://g.tenor.com/v1/search?q=${term}&key=LIVDSRZULELA&limit=8`)
      .then(res => res.json())
      .then(data => {
        gifResults.innerHTML = '';
        data.results.forEach(gif => {
          const img = document.createElement('img');
          img.src = gif.media[0].tinygif.url;
          img.style.height = '80px';
          img.style.margin = '5px';
          img.style.cursor = 'pointer';
          img.onclick = () => sendMessageWithGif(gif.media[0].tinygif.url);
          gifResults.appendChild(img);
        });
      });
  });

  function sendMessageWithGif(url) {
    input.value = `<img src='${url}' style='max-width:100px;'>`;
    sendMessage();
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const time = Date.now();
    const chatObj = {
      from: playerID,
      to: currentTargetID,
      msg: text,
      time: time,
      isGameChat: currentChatView === 'game',
      type: currentChatView
    };

    const refPath = currentChatView === 'game'
      ? `game/${currentTargetID}/chat`
      : `player_chats/${playerID}/${currentTargetID}`;

    db.ref(refPath).push(chatObj);

    if (currentChatView === 'dm') {
      db.ref(`player_chats/${currentTargetID}/${playerID}`).push(chatObj);
      db.ref(`players/${playerID}/chats/${currentTargetID}`).set(true);
      db.ref(`players/${currentTargetID}/chats/${playerID}`).set(true);
    }

    input.value = '';
    appendMessage('You', text);
  }

  function notifyNewMessage(msg) {
    if (msg.type === 'dm' && msg.from !== playerID) {
      unreadFlags[msg.from] = (unreadFlags[msg.from] || 0) + 1;
      updateChatList(); // show green dot
      showToast(`${msg.from} sent you a DM`);
    }
  }

  function listenToChat() {
    messages.innerHTML = '';

    const refPath = currentChatView === 'game'
      ? `game/${currentTargetID}/chat`
      : `player_chats/${playerID}/${currentTargetID}`;

    db.ref(refPath).off(); // Remove any existing listeners
    db.ref(refPath).on('child_added', snap => {
      const msg = snap.val();
      const relevant = currentChatView === 'game' ? msg.isGameChat : !msg.isGameChat;
      if (relevant && msg.to === currentTargetID) {
        appendMessage(msg.from === playerID ? 'You' : msg.from, msg.msg || (msg.gif && `<img src='${msg.gif.url}'>`));
      } else {
        notifyNewMessage(msg);
      }
    });
  }

  function loadChatList() {
    chatList.innerHTML = 'Loading...';
    db.ref(`players/${playerID}/chats`).once('value', snap => {
      chatList.innerHTML = '';
      const chats = snap.val() || {};
      Object.keys(chats).forEach(otherID => {
        const div = document.createElement('div');
        div.className = 'chat-entry';
        div.textContent = `Chat with ${otherID}`;
        if (unreadFlags[otherID]) {
          const dot = document.createElement('span');
          dot.className = 'dot';
          div.appendChild(dot);
        }
        div.onclick = () => {
          currentChatView = 'dm';
          currentTargetID = otherID;
          unreadFlags[otherID] = 0;
          messages.innerHTML = '';
          listenToChat();
          subdrawer.classList.remove('open');
        };
        chatList.appendChild(div);
      });
    });
  }

  function updateChatList() {
    if (subdrawer.classList.contains('open') && chatList.style.display === 'block') {
      loadChatList();
    }
  }

  function loadOnlinePlayers() {
    onlineList.innerHTML = 'Loading...';
    db.ref(`players`).once('value', snap => {
      onlineList.innerHTML = '';
      snap.forEach(child => {
        const pid = child.key;
        if (pid !== playerID) {
          const div = document.createElement('div');
          div.className = 'chat-entry';
          div.textContent = child.val().name || pid;
          div.onclick = () => {
            currentChatView = 'dm';
            currentTargetID = pid;
            messages.innerHTML = '';
            listenToChat();
            subdrawer.classList.remove('open');
          };
          onlineList.appendChild(div);
        }
      });
    });
  }

  // Default to game chat
  listenToChat();


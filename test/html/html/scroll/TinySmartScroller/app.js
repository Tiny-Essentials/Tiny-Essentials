import { fetchBlob, fetchJson, readBase64Blob } from '/src/v1/basics/html.mjs';
import { TinyDomReadyManager } from '/src/v1/libs/html/TinyDomReadyManager.mjs';
import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
import { TinySmartScroller } from '/src/v1/libs/html/scroll/TinySmartScroller.mjs';
import { UltraRandomMsgGen } from '/src/v1/libs/utils/UltraRandomMsgGen.mjs';
import { TinyTextarea } from '/src/v1/libs/text/TinyTextarea.mjs';

window.TinyTextarea = TinyTextarea;
window.TinySmartScroller = TinySmartScroller;
window.UltraRandomMsgGen = UltraRandomMsgGen;
window.TinyDomReadyManager = TinyDomReadyManager;
window.TinyHtml = TinyHtml;
window.fetchBlob = fetchBlob;
window.fetchJson = fetchJson;
window.readBase64Blob = readBase64Blob;

TinyHtml.elemDebug = true;

// Prepare test data
const blackImageBase64 =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
let tinyAvatar;
window.blackImageBase64 = blackImageBase64;
window.tinyAvatar = '';
const tinyReady = new TinyDomReadyManager();
tinyReady.addPromise(
  new Promise((resolve, reject) => {
    fetchBlob('/07ec6d0b-c9d7-482a-9c61-8e25dbe9b7fb.png')
      .then((blob) =>
        readBase64Blob(blob, true)
          .then((data) => {
            window.tinyAvatar = data;
            tinyAvatar = data;
            resolve();
          })
          .catch(reject),
      )
      .catch(reject);
  }),
);

// Prepare Log tester
const logEl = document.getElementById('log');
const log = (msg) => {
  const time = new Date().toLocaleTimeString();
  logEl.textContent += `[${time}] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
};

// Tiny Textarea tester
const fixOnTxtInput = () => {
  if (window.tinyScroller && window.tinyScroller.isAtBottom()) window.tinyScroller.scrollToBottom();
};

const txtInput = TinyHtml.getById('manualInput');
const tiny = new TinyTextarea(txtInput.get(0), {
  maxRows: 16,
  extraHeight: 0,
  onResize: ({ rows, height, scrollHeight, maxHeight, lineHeight, maxRows, breakLines }) => {
    console.log(`Textarea Extra:`, {
      breakLines,
      rows,
      height,
      scrollHeight,
      maxHeight,
      lineHeight,
      maxRows,
    });
    fixOnTxtInput();
  },
  onInput: () => {
    fixOnTxtInput();
  },
});

window.txtInput = txtInput;
window.tinyTxtarea = tiny;
fixOnTxtInput();

// Smart Scroller test
tinyReady.onReady(() => {
  let autoMessageInterval = null;
  const maxVisibleMessages = 100; // limite de mensagens visíveis

  function trimOldMessages() {
    const messages = chat.querySelectorAll('.message');
    const msgCount = messages.length + 1;
    if (msgCount > maxVisibleMessages) {
      const excess = msgCount - maxVisibleMessages;
      for (let i = 0; i < excess; i++) {
        messages[i].remove();
      }
      log(`Cleaned up ${excess} old messages`);
    }
  }

  const messageTypeWeights = {
    text: 87,
    image: 5,
    image2: 1,
    image3: 1,
    image4: 1,
    image5: 1,
    image6: 1,
    image7: 1,
    image8: 1,
    image9: 1,
    'async-image': 3,
    'image-base64': 3,
  };

  function getWeightedRandomType() {
    const types = Object.entries(messageTypeWeights);
    const totalWeight = types.reduce((sum, [, weight]) => sum + weight, 0);
    let rand = Math.random() * totalWeight;

    for (const [type, weight] of types) {
      if (rand < weight) return type;
      rand -= weight;
    }

    return 'text'; // fallback
  }

  let autoMessageRunning = false;

  window.startAutoChat = () => {
    if (autoMessageRunning) return;
    autoMessageRunning = true;
    log(`Start auto chat`);
    runAutoMessageCycle();
  };

  window.stopAutoChat = () => {
    if (!autoMessageRunning) return;
    autoMessageRunning = false;
    log(`Stop auto chat`);
  };

  function runAutoMessageCycle() {
    if (!autoMessageRunning) return;

    const type = getWeightedRandomType();
    const elem = createMessageElement(type);
    chat.appendChild(elem);

    // Cálculo do delay
    let delay = Math.random() * 10000 + 1500;

    if (type === 'text') {
      const textLength = elem.querySelector('.content').textContent.length;
      const extraTime = Math.min(textLength * 20, 5000); // 20ms por caractere, máximo 5s extra
      delay += extraTime;
    }

    setTimeout(runAutoMessageCycle, delay);
  }

  const chat = document.getElementById('chat');
  const statusText = document.getElementById('statusText');
  const toggleAutoScroll = document.getElementById('toggleAutoScroll');
  const selectAnchor = document.getElementById('selectAnchor');
  const randomText = new UltraRandomMsgGen({
    minLength: 20,
    maxLength: 100,
    repeatWords: true,
    readable: true,
    useEmojis: true,
    includeNumbers: false,
    includeSymbols: false,
    allowWeirdSpacing: false,
    emojiPlacement: 'end',
    paragraphs: { min: 1, max: 2 },
    line: {
      minLength: 10,
      maxLength: 100,
      emojiChance: 0.5,
    },
    mode: 'natural',
  });

  const scroller = new TinySmartScroller(chat, {
    // attributeFilter: [],
    // querySelector: 'img',
    autoScrollBottom: toggleAutoScroll.checked,
    observeMutations: true,
    debounceTime: 80,
  });

  window.tinyScroller = scroller;

  window.scroller = scroller;
  window.randomText = randomText;

  scroller.setExtraScrollBoundary(500);
  scroller.addSimpleOnHeight([]);

  const updateStatus = () => {
    const state = [
      scroller.isAtTop() ? 'TOP' : '',
      scroller.isAtBottom() ? 'BOTTOM' : '',
      scroller.isScrollPaused() ? 'PAUSED' : 'AUTO',
    ]
      .filter(Boolean)
      .join(' | ');
    statusText.textContent = 'Status: ' + state;
  };

  scroller.once('onScrollBoundary', ({ status }) => {
    if (!status) return;
    updateStatus();
    log(`onScrollBoundary (Once): ${status}`);
  });

  scroller.on('onScrollBoundary', ({ status }) => {
    if (!status) return;
    updateStatus();
    log(`onScrollBoundary: ${status}`);
  });

  scroller.on('onExtraScrollBoundary', ({ status }) => {
    if (!status) return;
    updateStatus();
    log(`onExtraScrollBoundary: ${status}`);
  });

  scroller.on('onAutoScroll', (data) => {
    updateStatus();
    log(`AutoScroll triggered --> ${JSON.stringify(data)}`);
  });

  scroller.on('onScrollPause', (data) => {
    updateStatus();
    log(`AutoScroll paused --> ${JSON.stringify(data)}`);
  });

  chat.addEventListener('scroll', updateStatus);

  let messageCount = 1;

  function createMessageElement(type = 'text', customContent = null) {
    const div = TinyHtml.createElement('div');
    div.addClass('message');
    div.get(0).dataset.id = `msg-${messageCount++}`;

    // Conteúdo principal
    const content = TinyHtml.createElement('div');
    content.addClass('content');

    if (type === 'text') {
      if (customContent) content.append(customContent);
      else {
        content.append(
          TinyHtml.createElementFromHTML(
            `<strong>User (${new Date().toLocaleTimeString()}):</strong>`,
          ),
        );
        content.append(`\n${randomText.generate()}`);
      }
    }

    const genMessage = (imgSrc) => {
      console.log('image');
      const img = new Image();
      img.className = 'resizable';
      img.src = imgSrc;
      img.alt = 'Image';
      img.title = 'Click to expand';
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        img.style.width = img.style.width === '300px' ? '100px' : '300px';
      });
      content.append(img);
    };

    if (type === 'image') {
      genMessage('/1012b1ff-536b-4134-8bfb-01ba7b87a186.png');
    }

    if (type === 'image2') {
      genMessage('/3da28b7b-69ca-403f-96f3-03735653d39e.png');
    }

    if (type === 'image3') {
      genMessage('/5ec92aff-7a9d-4b86-bcc3-fe715def537a.png');
    }

    if (type === 'image4') {
      genMessage('/85382271-5cf7-4806-ab8c-921167c0d8d7.png');
    }

    if (type === 'image5') {
      genMessage('/6c2df338-5257-4a2d-9dea-14f9f4ae8aba.png');
    }

    if (type === 'image6') {
      genMessage('/6c2df338-5257-4a2d-9dea-14f9f4ae8aba2.png');
    }

    if (type === 'image7') {
      genMessage('/66a177ed-8dbb-4e4b-a9e2-d7b2311e62b6.png');
    }

    if (type === 'image8') {
      genMessage('/69d958d1-381f-43f9-aee5-d9ffaff3b546.png');
    }

    if (type === 'image9') {
      genMessage('/f67893c7-e757-4e24-bc31-8f7490ae2098.png');
    }

    if (type === 'image-base64') {
      console.log('image base64');
      const img = new Image();
      img.className = 'resizable';
      img.src = tinyAvatar;
      img.alt = 'Image Base64';
      img.title = 'Click to expand';
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        img.style.width = img.style.width === '300px' ? '100px' : '300px';
      });
      content.append(img);
    }

    if (type === 'async-image') {
      console.log('async-image');
      const img = new Image();
      img.className = 'resizable';
      img.alt = 'Async image';
      img.title = 'Click to expand';
      img.onload = () => {
        setTimeout(() => {
          img.style.width = '300px';
        }, 5000);
      };
      setTimeout(() => (img.src = '/6d01c26e-e523-4439-8bfc-f656a83cdab0.png'), 10000);
      img.src = blackImageBase64;
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        img.style.width = img.style.width === '300px' ? '100px' : '300px';
      });
      img.addEventListener('contextmenu', (evt) => {
        evt.preventDefault();
        setTimeout(() => (img.style.width = img.style.width === '300px' ? '100px' : '300px'), 1000);
      });
      content.append(img);
    }

    if (type === 'iframe') {
      const wrapper = TinyHtml.createElement('div');
      wrapper.addClass('iframe-container');
      wrapper.setHtml(`<iframe src="https://example.com"></iframe>`);
      content.append(wrapper);
    }

    div.append(content);

    // Controles (editar/remover)
    const tools = TinyHtml.createElement('div');
    tools.setStyle('marginTop', '6px');

    const btnEdit = TinyHtml.createElement('button');
    btnEdit.setText('✏️ Edit');
    btnEdit.on('click', () => {
      const newText = prompt('Edit message content:', content.textContent);
      if (newText != null) content.textContent = newText;
    });

    const btnRemove = TinyHtml.createElement('button');
    btnRemove.setText('🗑 Remove');
    btnRemove.on('click', () => {
      div.remove();
    });

    tools.append(btnEdit);
    tools.append(btnRemove);
    div.append(tools);

    trimOldMessages();
    return div.get(0);
  }

  window.addTextMessage = () => {
    chat.appendChild(createMessageElement('text'));
  };

  window.addImageBase64Message = () => {
    chat.appendChild(createMessageElement('image-base64'));
  };

  window.addImageMessage = () => {
    chat.appendChild(createMessageElement('image'));
  };

  window.addAsyncImage = () => {
    chat.appendChild(createMessageElement('async-image'));
  };

  window.addIframeEmbed = () => {
    chat.appendChild(createMessageElement('iframe'));
  };

  window.addAsyncImage = () => {
    chat.appendChild(createMessageElement('async-image'));
  };

  window.addIframeEmbed = () => {
    const div = document.createElement('div');
    div.className = 'message';
    const wrapper = document.createElement('div');
    wrapper.className = 'iframe-container';
    wrapper.innerHTML = `<iframe src="https://example.com"></iframe>`;
    div.appendChild(wrapper);
    chat.appendChild(div);
  };

  window.addManyMessages = () => {
    for (let i = 0; i < 30; i++) {
      chat.appendChild(createMessageElement(getWeightedRandomType()));
    }
  };

  window.scrollToTop = () => scroller.scrollToTop();
  window.scrollToBottom = () => scroller.scrollToBottom();
  window.forceScrollToAnchor = () => {
    if (selectAnchor.value === 'top') {
      scroller.scrollToTop();
    } else {
      scroller.scrollToBottom();
    }
  };

  toggleAutoScroll.addEventListener('change', () => {
    scroller.autoScrollBottom = toggleAutoScroll.checked;
    log(`autoScrollBottom = ${scroller.autoScrollBottom}`);
  });

  selectAnchor.addEventListener('change', () => {
    const value = selectAnchor.value;
    log(`Anchor changed to: ${value}`);
    if (value === 'top') {
      scroller.scrollToTop();
    } else {
      scroller.scrollToBottom();
    }
  });

  window.sendManualMessage = () => {
    const textarea = TinyHtml.getById('manualInput');
    const text = textarea.val().trim();
    if (!text) return;
    const messageEl = createMessageElement('text', text);
    chat.appendChild(messageEl);
    textarea.setVal('');
  };

  txtInput.on('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent line break
      sendManualMessage();
    }
  });

  // Start with 10 messages
  addManyMessages();
  scrollToBottom();
  startAutoChat();
});
tinyReady.init();

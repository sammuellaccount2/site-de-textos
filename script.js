// ========== CONFIGURAÇÃO DO FIREBASE ==========
// ⭐ COLE AQUI O BLOCO DE CONFIGURAÇÃO DO SEU PROJETO FIREBASE
const firebaseConfig =  {
  apiKey: "AIZaSyAw9c0vvgCcMav3_RLLws6nrN1Fp4Pvqs4",
  authDomain: "textos-febd0.firebaseapp.com",
  projectId: "textos-febd0",
  storageBucket: "textos-febd0.firebasestorage.app",
  messagingSenderId: "674360612798",
  appId: "1:674360612798:web:4c1a8a35c25d5d97d38bef"
};


// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const cartasRef = db.collection("cartas");

// 🔐 SENHA SECRETA DO IMPÉRIO (troque aqui se quiser)
const SENHA_SECRETA = "8141722";

// ========== LÓGICA DO SITE ==========
(function(){
  "use strict";

  // Elementos DOM
  const passwordOverlay = document.getElementById('passwordOverlay');
  const passwordInput = document.getElementById('passwordInput');
  const submitPasswordBtn = document.getElementById('submitPasswordBtn');
  const passwordError = document.getElementById('passwordError');
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const enterBtn = document.getElementById('enterBtn');
  const app = document.getElementById('app');
  const lettersContainer = document.getElementById('lettersContainer');
  const toggleWriteBtn = document.getElementById('toggleWriteBtn');
  const writeSection = document.getElementById('writeSection');
  const cancelWriteBtn = document.getElementById('cancelWriteBtn');
  const saveLetterBtn = document.getElementById('saveLetterBtn');
  const letterTitleInput = document.getElementById('letterTitle');
  const letterMessageInput = document.getElementById('letterMessage');
  const cartasCountSpan = document.getElementById('cartasCount');

  let letters = [];
  let unsubscribe = null;
  let senhaCorreta = false;

  // 🎯 Verificar senha
  function verificarSenha() {
    const digitada = passwordInput.value.trim();
    if (digitada === SENHA_SECRETA) {
      senhaCorreta = true;
      passwordOverlay.style.display = 'none';
      welcomeOverlay.style.display = 'flex';
      // Habilita botão escrever futuramente
      toggleWriteBtn.disabled = false;
      // Já começa a ouvir a nuvem
      listenToLetters();
    } else {
      passwordError.textContent = '🌸 Senha incorreta, amor... tenta de novo.';
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  submitPasswordBtn.addEventListener('click', verificarSenha);
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verificarSenha();
  });

  // ☁️ Ouvir cartas em tempo real
  function listenToLetters() {
    if (unsubscribe) unsubscribe();
    unsubscribe = cartasRef.orderBy("dataISO", "desc").onSnapshot((snapshot) => {
      letters = [];
      snapshot.forEach((doc) => {
        letters.push({ id: doc.id, ...doc.data() });
      });
      renderLetters();
      atualizarContador();
    });
  }

  function atualizarContador() {
    if (cartasCountSpan) {
      cartasCountSpan.textContent = letters.length;
    }
  }

  // Excluir carta
  async function excluirCarta(id) {
    if (!senhaCorreta) return;
    if (confirm("Tem certeza que quer apagar essa cartinha? 💔")) {
      try {
        await cartasRef.doc(id).delete();
        // O snapshot atualiza automaticamente
      } catch (e) {
        alert("Não consegui apagar... 😢");
      }
    }
  }

  // Adicionar nova carta
  async function addNewLetter(title, message) {
    if (!senhaCorreta) return false;
    if (!message.trim()) {
      alert('🌸 Escreva pelo menos uma palavra...');
      return false;
    }
    try {
      await cartasRef.add({
        texto: message.trim(),
        titulo: title.trim() || "",
        dataISO: new Date().toISOString()
      });
      letterTitleInput.value = '';
      letterMessageInput.value = '';
      return true;
    } catch (e) {
      alert("Erro ao enviar. Tente novamente.");
      return false;
    }
  }

  // Renderizar cartas com efeito typing opcional (ativado)
  function renderLetters() {
    if (!lettersContainer) return;
    if (letters.length === 0) {
      lettersContainer.innerHTML = `<div class="empty-message">🌱 Nenhuma cartinha ainda...<br>escreva a primeira!</div>`;
      return;
    }

    let html = '';
    letters.forEach(item => {
      const titulo = item.titulo || 'carta de amor';
      const data = new Date(item.dataISO).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
      html += `
        <article class="love-letter" data-id="${item.id}">
          <div class="letter-header">
            <div class="letter-title">${escapeHtml(titulo)}</div>
            <div class="letter-date">${data}</div>
          </div>
          <div class="letter-body">${escapeHtml(item.texto).replace(/\n/g, '<br>')}</div>
          <div class="letter-footer">
            <span>❤️</span>
            <button class="delete-btn" data-id="${item.id}" title="Apagar carta">✕</button>
          </div>
        </article>
      `;
    });
    lettersContainer.innerHTML = html;

    // Adiciona event listeners aos botões de excluir
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        excluirCarta(id);
      });
    });
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, function(c) {
      if (c === '&') return '&amp;';
      if (c === '<') return '&lt;';
      if (c === '>') return '&gt;';
      if (c === '"') return '&quot;';
      return c;
    });
  }

  // Toggle escrita
  function toggleWriteSection(show) {
    if (!senhaCorreta) return;
    if (show === undefined) {
      writeSection.style.display = writeSection.style.display === 'none' ? 'block' : 'none';
    } else {
      writeSection.style.display = show ? 'block' : 'none';
    }
  }

  // Eventos
  function bindEvents() {
    enterBtn.addEventListener('click', () => {
      welcomeOverlay.style.opacity = '0';
      welcomeOverlay.style.visibility = 'hidden';
      app.style.display = 'block';
    });

    toggleWriteBtn.addEventListener('click', () => toggleWriteSection());

    cancelWriteBtn.addEventListener('click', () => {
      toggleWriteSection(false);
      letterTitleInput.value = '';
      letterMessageInput.value = '';
    });

    saveLetterBtn.addEventListener('click', async () => {
      const ok = await addNewLetter(letterTitleInput.value, letterMessageInput.value);
      if (ok) toggleWriteSection(false);
    });

    letterMessageInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        saveLetterBtn.click();
      }
    });
  }

  // Inicialização
  function init() {
    bindEvents();
    // Tudo começa com a tela de senha
  }
  init();
})();
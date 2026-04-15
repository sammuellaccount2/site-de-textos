const firebaseConfig = {
  apiKey: "AIzaSyAw9cOvvgCcMav3_RLLws6nrN1Fp4Pvqs4",
  authDomain: "textos-febd0.firebaseapp.com",
  projectId: "textos-febd0",
  storageBucket: "textos-febd0.firebasestorage.app",
  messagingSenderId: "674360612798",
  appId: "1:674360612798:web:4c1a8a35c25d5d97d38bef"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const bilhetesRef = db.collection("bilhetes");
const cartasRef = db.collection("cartas");

const SENHA_SECRETA = "8141722";

(function() {
  "use strict";

  // ===== ELEMENTOS DOM =====
  const passwordOverlay = document.getElementById('passwordOverlay');
  const passwordInput = document.getElementById('passwordInput');
  const submitPasswordBtn = document.getElementById('submitPasswordBtn');
  const passwordError = document.getElementById('passwordError');
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const enterBtn = document.getElementById('enterBtn');
  const app = document.getElementById('app');
  const toggleWriteBtn = document.getElementById('toggleWriteBtn');
  const writeSection = document.getElementById('writeSection');
  const cancelWriteBtn = document.getElementById('cancelWriteBtn');
  const saveLetterBtn = document.getElementById('saveLetterBtn');
  const letterTitleInput = document.getElementById('letterTitle');
  const letterMessageInput = document.getElementById('letterMessage');
  const cartasCountSpan = document.getElementById('cartasCount');
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  const bilhetesView = document.getElementById('bilhetesView');
  const cartasView = document.getElementById('cartasView');
  const bilhetesContainer = document.getElementById('bilhetesContainer');
  const cartasListContainer = document.getElementById('cartasListContainer');
  const tabBtns = document.querySelectorAll('.tab-btn');

  const modal = document.getElementById('cartaModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDate = document.getElementById('modalDate');
  const modalBody = document.getElementById('modalBody');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalDeleteBtn = document.getElementById('modalDeleteBtn');

  // ===== ESTADO =====
  let bilhetes = [];
  let cartas = [];
  let unsubscribeBilhetes = null;
  let unsubscribeCartas = null;
  let senhaCorreta = false;
  let currentTab = 'bilhetes';
  let currentModalId = null;

  // ===== MODO DIA/NOITE =====
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(savedTheme + '-mode');
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const isLight = document.body.classList.contains('light-mode');
    const newTheme = isLight ? 'dark' : 'light';
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(newTheme + '-mode');
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    const icon = themeToggleBtn.querySelector('.theme-icon');
    if (icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';
  }

  themeToggleBtn.addEventListener('click', toggleTheme);
  initTheme();

  // ===== VERIFICAÇÃO DE SENHA =====
  function verificarSenha() {
    if (passwordInput.value.trim() === SENHA_SECRETA) {
      senhaCorreta = true;
      passwordOverlay.style.display = 'none';
      welcomeOverlay.style.display = 'flex';
      toggleWriteBtn.disabled = false;
      escutarDados();
    } else {
      passwordError.textContent = 'senha incorreta, tente novamente';
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  submitPasswordBtn.addEventListener('click', verificarSenha);
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verificarSenha();
  });

  // ===== FIREBASE: ESCUTAR COLEÇÕES =====
  function escutarDados() {
    if (unsubscribeBilhetes) unsubscribeBilhetes();
    if (unsubscribeCartas) unsubscribeCartas();

    unsubscribeBilhetes = bilhetesRef.orderBy("dataISO", "desc").onSnapshot((snapshot) => {
      bilhetes = [];
      snapshot.forEach(doc => bilhetes.push({ id: doc.id, ...doc.data() }));
      renderizarBilhetes();
      atualizarContador();
    });

    unsubscribeCartas = cartasRef.orderBy("dataISO", "desc").onSnapshot((snapshot) => {
      cartas = [];
      snapshot.forEach(doc => cartas.push({ id: doc.id, ...doc.data() }));
      renderizarCartasLista();
      atualizarContador();
    });
  }

  function atualizarContador() {
    const total = bilhetes.length + cartas.length;
    cartasCountSpan.textContent = total;
  }

  // ===== RENDERIZAR BILHETES =====
  function renderizarBilhetes() {
    if (bilhetes.length === 0) {
      bilhetesContainer.innerHTML = '<div class="empty-message">🌱 nenhum bilhete ainda<br>escreva o primeiro</div>';
      return;
    }
    let html = '';
    bilhetes.forEach(item => {
      const titulo = item.titulo || 'bilhete';
      const data = new Date(item.dataISO).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
      html += `<article class="love-letter" data-id="${item.id}">
        <div class="letter-header"><div class="letter-title">${escapeHtml(titulo)}</div><div class="letter-date">${data}</div></div>
        <div class="letter-body">${escapeHtml(item.texto).replace(/\n/g, '<br>')}</div>
        <div class="letter-footer"><span>✽</span><button class="delete-btn" data-id="${item.id}" data-tipo="bilhete">✕</button></div>
      </article>`;
    });
    bilhetesContainer.innerHTML = html;
    document.querySelectorAll('#bilhetesContainer .delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        excluirItem(btn.dataset.id, 'bilhete');
      });
    });
  }

  // ===== RENDERIZAR CARTAS =====
  function renderizarCartasLista() {
    if (cartas.length === 0) {
      cartasListContainer.innerHTML = '<div class="empty-message">📭 nenhuma carta ainda</div>';
      return;
    }
    let html = '';
    cartas.forEach(item => {
      const titulo = item.titulo || 'carta sem título';
      const data = new Date(item.dataISO).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
      html += `<div class="carta-item" data-id="${item.id}">
        <div class="carta-item-content">
          <span class="carta-item-title">${escapeHtml(titulo)}</span>
          <span class="carta-item-date">${data}</span>
        </div>
      </div>`;
    });
    cartasListContainer.innerHTML = html;
    document.querySelectorAll('.carta-item').forEach(item => {
      item.addEventListener('click', () => abrirModal(item.dataset.id));
    });
  }

  // ===== MODAL CARTA =====
  function abrirModal(id) {
    const carta = cartas.find(c => c.id === id);
    if (!carta) return;
    currentModalId = id;
    modalTitle.textContent = carta.titulo || 'carta';
    modalDate.textContent = new Date(carta.dataISO).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
    modalBody.innerHTML = escapeHtml(carta.texto).replace(/\n/g, '<br>');
    modal.style.display = 'flex';
  }

  function fecharModal() {
    modal.style.display = 'none';
    currentModalId = null;
  }

  closeModalBtn.addEventListener('click', fecharModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
  });

  modalDeleteBtn.addEventListener('click', async () => {
    if (!currentModalId) return;
    if (!confirm("apagar esta carta?")) return;
    try {
      await cartasRef.doc(currentModalId).delete();
      fecharModal();
    } catch (e) {
      alert("não foi possível apagar.");
    }
  });

  // ===== EXCLUIR ITEM =====
  async function excluirItem(id, tipo) {
    if (!senhaCorreta) return;
    if (!confirm(`apagar este ${tipo}?`)) return;
    try {
      if (tipo === 'bilhete') await bilhetesRef.doc(id).delete();
      else await cartasRef.doc(id).delete();
    } catch (e) {
      alert("não foi possível apagar.");
    }
  }

  // ===== ADICIONAR ITEM =====
  async function adicionarItem(titulo, mensagem) {
    if (!senhaCorreta) return false;
    if (!mensagem.trim()) {
      alert('escreva algo...');
      return false;
    }
    const colecao = currentTab === 'bilhetes' ? bilhetesRef : cartasRef;
    try {
      await colecao.add({
        texto: mensagem.trim(),
        titulo: titulo.trim() || "",
        dataISO: new Date().toISOString()
      });
      letterTitleInput.value = '';
      letterMessageInput.value = '';
      return true;
    } catch (e) {
      alert("erro ao salvar.");
      return false;
    }
  }

  // ===== UTILITÁRIOS =====
  function escapeHtml(t) {
    if (!t) return '';
    return String(t)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ===== CONTROLE DE ESCRITA =====
  function alternarEscrita(mostrar) {
    if (!senhaCorreta) return;
    writeSection.style.display = (mostrar === undefined) 
      ? (writeSection.style.display === 'none' ? 'block' : 'none') 
      : (mostrar ? 'block' : 'none');
    if (writeSection.style.display === 'block') letterMessageInput.focus();
  }

  // ===== TROCA DE ABAS =====
  function switchTab(tabId) {
    currentTab = tabId;
    tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    bilhetesView.style.display = tabId === 'bilhetes' ? 'block' : 'none';
    cartasView.style.display = tabId === 'cartas' ? 'block' : 'none';
  }

  tabBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  // ===== EVENTOS =====
  enterBtn.addEventListener('click', () => {
    welcomeOverlay.style.opacity = '0';
    welcomeOverlay.style.visibility = 'hidden';
    app.style.display = 'block';
  });

  toggleWriteBtn.addEventListener('click', () => alternarEscrita());

  cancelWriteBtn.addEventListener('click', () => {
    alternarEscrita(false);
    letterTitleInput.value = '';
    letterMessageInput.value = '';
  });

  saveLetterBtn.addEventListener('click', async () => {
    if (await adicionarItem(letterTitleInput.value, letterMessageInput.value)) {
      alternarEscrita(false);
    }
  });

  letterMessageInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      saveLetterBtn.click();
    }
  });

  // ===== MIGRAÇÃO DE DADOS ANTIGOS =====
  async function migrarDadosAntigos() {
    try {
      const snapshotAntigo = await db.collection("cartas").get();
      if (!snapshotAntigo.empty) {
        const bilhetesSnapshot = await bilhetesRef.get();
        if (bilhetesSnapshot.empty) {
          const batch = db.batch();
          snapshotAntigo.forEach(doc => {
            const data = doc.data();
            batch.set(bilhetesRef.doc(), {
              texto: data.texto || "",
              titulo: data.titulo || "",
              dataISO: data.dataISO || new Date().toISOString()
            });
          });
          await batch.commit();
          console.log("✅ Dados migrados da coleção antiga para 'bilhetes'.");
        }
      }
    } catch (e) {
      console.warn("ℹ️ Nenhum dado antigo para migrar ou erro:", e);
    }
  }

  // ===== INICIALIZAÇÃO =====
  function init() {
    migrarDadosAntigos();
  }

  init();
  // ===== CORAÇÕES FLUTUANTES =====
  function criarCoracoesFlutuantes() {
    const container = document.createElement('div');
    container.className = 'floating-hearts';
    document.body.appendChild(container);
    
    const numCoracoes = 12;
    
    for (let i = 0; i < numCoracoes; i++) {
      const heart = document.createElement('div');
      heart.className = 'heart';
      heart.textContent = '❤️';
      
      const left = Math.random() * 100;
      const delay = Math.random() * 20;
      const duration = 20 + Math.random() * 15;
      
      heart.style.left = left + '%';
      heart.style.animationDelay = '-' + delay + 's';
      heart.style.animationDuration = duration + 's';
      
      container.appendChild(heart);
    }
  }
  
  // Chamar após o login
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.id === 'app' && window.getComputedStyle(app).display === 'block') {
        if (!document.querySelector('.floating-hearts')) {
          criarCoracoesFlutuantes();
        }
      }
    });
  });
  
  observer.observe(app, { attributes: true, attributeFilter: ['style'] });
})();
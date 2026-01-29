/**
 * UI de Redes Sociais
 * Gerencia links de redes sociais para o rodapé
 */

// ===================================
// VARIÁVEIS GLOBAIS
// ===================================
let redeEditandoId = null;

// ===================================
// INICIALIZAÇÃO
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  carregarRedes();
  setupEventListeners();
});

function initTheme() {
  ThemeService.init();
  const themeToggle = document.getElementById('themeToggleAdmin');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => ThemeService.toggle());
  }
}

function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggleAdmin');
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('menuOverlayAdmin');
  const closeBtn = document.getElementById('btnCloseSidebar');

  function toggleMenu() {
    const isOpen = sidebar.classList.contains('mobile-open');
    sidebar.classList.toggle('mobile-open');
    if (overlay) overlay.classList.toggle('active');
    document.body.style.overflow = isOpen ? '' : 'hidden';
    menuToggle.setAttribute('aria-expanded', !isOpen);
  }

  if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
  if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
  if (overlay) overlay.addEventListener('click', toggleMenu);
}

function setupEventListeners() {
  document.getElementById('btnNovaRede')?.addEventListener('click', () => abrirModalRede());
  document.getElementById('formRede')?.addEventListener('submit', salvarRede);
  
  // Atualizar helper text ao selecionar tipo
  document.getElementById('redeTipo')?.addEventListener('change', atualizarHelperText);
}

// ===================================
// CARREGAR REDES
// ===================================
async function carregarRedes() {
  const redes = await RedesSociaisService.listar();
  const tbody = document.getElementById('redesTableBody');

  if (redes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          Nenhuma rede social cadastrada.
          <button class="btn btn-primary" onclick="abrirModalRede()">Adicionar Primeira Rede</button>
        </td>
      </tr>
    `;
    atualizarPreview([]);
    return;
  }

  tbody.innerHTML = redes.map(rede => `
    <tr>
      <td><span class="badge">${rede.ordem}</span></td>
      <td style="text-align: center; font-size: 28px;">${rede.icone}</td>
      <td><strong>${escapeHtml(rede.nome)}</strong></td>
      <td>
        <a href="${escapeHtml(rede.url)}" target="_blank" style="font-size: 12px; word-break: break-all;">
          ${escapeHtml(rede.url)}
        </a>
      </td>
      <td>
        <span class="status-badge ${rede.ativo ? 'ativo' : 'inativo'}">
          ${rede.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="acoes">
        <button class="btn-editar" onclick="editarRede('${rede.id}')" title="Editar">✏️</button>
        <button class="btn-deletar" onclick="deletarRede('${rede.id}', '${escapeHtml(rede.nome)}')" title="Deletar">🗑️</button>
      </td>
    </tr>
  `).join('');

  atualizarPreview(redes);
}

// ===================================
// PREVIEW DAS REDES
// ===================================
function atualizarPreview(redes) {
  const previewContainer = document.getElementById('previewRedesItems');
  
  if (redes.length === 0) {
    previewContainer.innerHTML = '<p class="text-secondary">Nenhuma rede social ativa</p>';
    return;
  }

  const redesAtivas = redes.filter(r => r.ativo);

  if (redesAtivas.length === 0) {
    previewContainer.innerHTML = '<p class="text-secondary">Nenhuma rede social ativa</p>';
    return;
  }

  previewContainer.innerHTML = redesAtivas.map(rede => `
    <div class="preview-social-item">
      <span class="preview-social-icon">${rede.icone}</span>
      <span class="preview-social-nome">${escapeHtml(rede.nome)}</span>
    </div>
  `).join('');
}

// ===================================
// MODAL
// ===================================
function abrirModalRede(id = null) {
  redeEditandoId = id;
  
  const modal = document.getElementById('modalRede');
  const titulo = document.getElementById('modalRedeTitulo');
  
  if (id) {
    titulo.textContent = 'Editar Rede Social';
    carregarRedeParaEdicao(id);
  } else {
    titulo.textContent = 'Nova Rede Social';
    document.getElementById('formRede').reset();
    document.getElementById('redeId').value = '';
    atualizarHelperText();
  }
  
  modal.style.display = 'flex';
}

function fecharModalRede() {
  document.getElementById('modalRede').style.display = 'none';
  redeEditandoId = null;
}

function atualizarHelperText() {
  const tipo = document.getElementById('redeTipo').value;
  const helper = document.getElementById('redeUrlHelper');
  
  if (!tipo) {
    helper.textContent = 'Digite a URL completa do seu perfil';
    return;
  }

  const redesDisponiveis = RedesSociaisService.redesDisponiveis;
  const redeInfo = redesDisponiveis[tipo];
  
  if (redeInfo && redeInfo.placeholder) {
    helper.textContent = `Exemplo: ${redeInfo.placeholder}`;
  }
}

async function carregarRedeParaEdicao(id) {
  const rede = await RedesSociaisService.buscarPorId(id);
  
  if (!rede) {
    alert('Rede social não encontrada');
    fecharModalRede();
    return;
  }

  document.getElementById('redeId').value = rede.id;
  document.getElementById('redeTipo').value = rede.tipo;
  document.getElementById('redeUrl').value = rede.url;
  document.getElementById('redeOrdem').value = rede.ordem;
  document.getElementById('redeAtivo').checked = rede.ativo;
  
  atualizarHelperText();
}

async function salvarRede(e) {
  e.preventDefault();

  const rede = {
    tipo: document.getElementById('redeTipo').value,
    url: document.getElementById('redeUrl').value.trim(),
    ordem: parseInt(document.getElementById('redeOrdem').value) || 0,
    ativo: document.getElementById('redeAtivo').checked
  };

  const validacao = RedesSociaisService.validar(rede);
  
  if (!validacao.valido) {
    alert(validacao.erros.join('\n'));
    return;
  }

  const redeId = document.getElementById('redeId').value;
  let result;

  if (redeId) {
    result = await RedesSociaisService.atualizar(redeId, rede);
  } else {
    result = await RedesSociaisService.criar(rede);
  }

  if (result.success) {
    alert('✅ Rede social salva com sucesso!');
    fecharModalRede();
    carregarRedes();
  } else {
    alert('❌ Erro ao salvar rede social: ' + result.error);
  }
}

async function editarRede(id) {
  abrirModalRede(id);
}

async function deletarRede(id, nome) {
  if (!confirm(`Deletar a rede social "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const result = await RedesSociaisService.deletar(id);

  if (result.success) {
    alert('✅ Rede social deletada com sucesso!');
    carregarRedes();
  } else {
    alert('❌ ' + result.error);
  }
}

// ===================================
// UTILITÁRIOS
// ===================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Tornar funções globais
window.abrirModalRede = abrirModalRede;
window.fecharModalRede = fecharModalRede;
window.editarRede = editarRede;
window.deletarRede = deletarRede;
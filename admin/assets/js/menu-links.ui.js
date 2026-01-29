/**
 * UI de Menu & Links
 * Gerencia links personalizados do menu
 */

// ===================================
// VARIÁVEIS GLOBAIS
// ===================================
let linkEditandoId = null;

// ===================================
// INICIALIZAÇÃO
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  carregarLinks();
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
  document.getElementById('btnNovoLink')?.addEventListener('click', () => abrirModalLink());
  document.getElementById('formLink')?.addEventListener('submit', salvarLink);
}

// ===================================
// CARREGAR LINKS
// ===================================
async function carregarLinks() {
  const links = await MenuLinksService.listar();
  const tbody = document.getElementById('linksTableBody');

  if (links.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          Nenhum link cadastrado.
          <button class="btn btn-primary" onclick="abrirModalLink()">Criar Primeiro Link</button>
        </td>
      </tr>
    `;
    atualizarPreview([]);
    return;
  }

  tbody.innerHTML = links.map(link => `
    <tr>
      <td><span class="badge">${link.ordem}</span></td>
      <td style="text-align: center; font-size: 24px;">${link.icone || '🔗'}</td>
      <td><strong>${escapeHtml(link.texto)}</strong></td>
      <td>
        <a href="${escapeHtml(link.url)}" target="_blank" style="font-size: 12px; word-break: break-all;">
          ${escapeHtml(link.url)}
        </a>
      </td>
      <td>
        ${link.abrirNovaAba ? '<span class="tag">Nova Aba</span>' : ''}
        ${link.destacado ? '<span class="tag" style="background: var(--warning);">Destacado</span>' : ''}
      </td>
      <td>
        <span class="status-badge ${link.ativo ? 'ativo' : 'inativo'}">
          ${link.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="acoes">
        <button class="btn-editar" onclick="editarLink('${link.id}')" title="Editar">✏️</button>
        <button class="btn-deletar" onclick="deletarLink('${link.id}', '${escapeHtml(link.texto)}')" title="Deletar">🗑️</button>
      </td>
    </tr>
  `).join('');

  atualizarPreview(links);
}

// ===================================
// PREVIEW DO MENU
// ===================================
function atualizarPreview(links) {
  const previewContainer = document.getElementById('previewMenuItems');
  
  if (links.length === 0) {
    previewContainer.innerHTML = '<p class="text-secondary">Nenhum link ativo</p>';
    return;
  }

  const linksAtivos = links.filter(l => l.ativo);

  if (linksAtivos.length === 0) {
    previewContainer.innerHTML = '<p class="text-secondary">Nenhum link ativo</p>';
    return;
  }

  previewContainer.innerHTML = linksAtivos.map(link => `
    <div class="preview-menu-item ${link.destacado ? 'destacado' : ''}">
      <span class="preview-icone">${link.icone || '🔗'}</span>
      <span class="preview-texto">${escapeHtml(link.texto)}</span>
      ${link.abrirNovaAba ? '<span class="preview-badge">↗</span>' : ''}
    </div>
  `).join('');
}

// ===================================
// MODAL
// ===================================
function abrirModalLink(id = null) {
  linkEditandoId = id;
  
  const modal = document.getElementById('modalLink');
  const titulo = document.getElementById('modalLinkTitulo');
  
  if (id) {
    titulo.textContent = 'Editar Link';
    carregarLinkParaEdicao(id);
  } else {
    titulo.textContent = 'Novo Link';
    document.getElementById('formLink').reset();
    document.getElementById('linkId').value = '';
  }
  
  modal.style.display = 'flex';
}

function fecharModalLink() {
  document.getElementById('modalLink').style.display = 'none';
  linkEditandoId = null;
}

async function carregarLinkParaEdicao(id) {
  const link = await MenuLinksService.buscarPorId(id);
  
  if (!link) {
    alert('Link não encontrado');
    fecharModalLink();
    return;
  }

  document.getElementById('linkId').value = link.id;
  document.getElementById('linkTexto').value = link.texto;
  document.getElementById('linkUrl').value = link.url;
  document.getElementById('linkIcone').value = link.icone || '';
  document.getElementById('linkOrdem').value = link.ordem;
  document.getElementById('linkNovaAba').checked = link.abrirNovaAba;
  document.getElementById('linkDestacado').checked = link.destacado;
  document.getElementById('linkAtivo').checked = link.ativo;
}

async function salvarLink(e) {
  e.preventDefault();

  const link = {
    texto: document.getElementById('linkTexto').value.trim(),
    url: document.getElementById('linkUrl').value.trim(),
    icone: document.getElementById('linkIcone').value.trim(),
    ordem: parseInt(document.getElementById('linkOrdem').value) || 0,
    abrirNovaAba: document.getElementById('linkNovaAba').checked,
    destacado: document.getElementById('linkDestacado').checked,
    ativo: document.getElementById('linkAtivo').checked
  };

  const validacao = MenuLinksService.validar(link);
  
  if (!validacao.valido) {
    alert(validacao.erros.join('\n'));
    return;
  }

  const linkId = document.getElementById('linkId').value;
  let result;

  if (linkId) {
    result = await MenuLinksService.atualizar(linkId, link);
  } else {
    result = await MenuLinksService.criar(link);
  }

  if (result.success) {
    alert('✅ Link salvo com sucesso!');
    fecharModalLink();
    carregarLinks();
  } else {
    alert('❌ Erro ao salvar link: ' + result.error);
  }
}

async function editarLink(id) {
  abrirModalLink(id);
}

async function deletarLink(id, texto) {
  if (!confirm(`Deletar o link "${texto}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const result = await MenuLinksService.deletar(id);

  if (result.success) {
    alert('✅ Link deletado com sucesso!');
    carregarLinks();
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
window.abrirModalLink = abrirModalLink;
window.fecharModalLink = fecharModalLink;
window.editarLink = editarLink;
window.deletarLink = deletarLink;
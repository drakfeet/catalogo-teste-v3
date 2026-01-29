/**
 * UI de Comunicação
 * Versão corrigida e alinhada ao HTML real
 */

// ===================================
// INICIALIZAÇÃO
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  setupEventListeners();
  carregarConfiguracoes();
});

function initTheme() {
  if (window.ThemeService) {
    ThemeService.init();
    const themeToggle = document.getElementById('themeToggleAdmin');
    themeToggle?.addEventListener('click', () => ThemeService.toggle());
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
    overlay?.classList.toggle('active');
    document.body.style.overflow = isOpen ? '' : 'hidden';
    menuToggle?.setAttribute('aria-expanded', String(!isOpen));
  }

  menuToggle?.addEventListener('click', toggleMenu);
  closeBtn?.addEventListener('click', toggleMenu);
  overlay?.addEventListener('click', toggleMenu);
}

function setupEventListeners() {
  document.getElementById('configComunicacaoForm')
    ?.addEventListener('submit', salvarConfiguracoes);

  document.getElementById('mensagemPadrao')
    ?.addEventListener('input', atualizarPreviewProduto);

  document.getElementById('mensagemCarrinho')
    ?.addEventListener('input', atualizarPreviewCarrinho);
}

// ===================================
// CARREGAR CONFIGURAÇÕES
// ===================================
async function carregarConfiguracoes() {
  const config = await ConfigService.buscar();

  setValue('whatsapp', config.whatsapp);
  setValue(
    'mensagemPadrao',
    config.mensagemPadrao ||
    'Olá! Gostaria de fazer um pedido:\n\n*Produto:* {produto}\n*Marca:* {marca}\n*Tamanho:* {tamanho}\n*Pagamento:* {pagamento}\n*Valor:* R$ {valor}'
  );

  setValue(
    'mensagemCarrinho',
    config.mensagemCarrinho ||
    'Olá! Gostaria de finalizar meu pedido:\n\n{produtos}\n\nTotal: R$ {total}'
  );

  setChecked('whatsappFlutuante', config.whatsappFlutuante !== false);
  setValue('whatsappMensagemFlutuante', config.whatsappMensagemFlutuante);
  setValue('whatsappMensagemInicial', config.whatsappMensagemInicial);

  setChecked('exibirHorario', config.exibirHorario === true);
  setValue('horarioSegSexInicio', config.horarioSegSexInicio || '09:00');
  setValue('horarioSegSexFim', config.horarioSegSexFim || '18:00');
  setValue('horarioSabInicio', config.horarioSabInicio || '09:00');
  setValue('horarioSabFim', config.horarioSabFim || '13:00');
  setChecked('atendeDOM', config.atendeDOM === true);
  setValue('mensagemForaHorario', config.mensagemForaHorario);

  setValue('telefone', config.telefone);
  setValue('email', config.email);
  setValue('endereco', config.endereco);

  atualizarPreviewProduto();
  atualizarPreviewCarrinho();
}

// ===================================
// PREVIEWS
// ===================================
function atualizarPreviewProduto() {
  const mensagem = document.getElementById('mensagemPadrao')?.value || '';
  const preview = document.getElementById('previewMensagemProduto');
  if (!preview) return;

  const texto = mensagem
    .replace(/{produto}/g, 'Tênis Nike Air Max')
    .replace(/{marca}/g, 'Nike')
    .replace(/{tamanho}/g, '42')
    .replace(/{pagamento}/g, 'PIX')
    .replace(/{valor}/g, '299,90');

  preview.innerHTML = `<pre>${escapeHtml(texto)}</pre>`;
}

function atualizarPreviewCarrinho() {
  const mensagem = document.getElementById('mensagemCarrinho')?.value || '';
  const preview = document.getElementById('previewMensagemCarrinho');
  if (!preview) return;

  const exemplo = mensagem
    .replace(/{produtos}/g, '1x Tênis Nike Air Max (42)\n2x Camisa Adidas (M)')
    .replace(/{total}/g, '599,80');

  preview.innerHTML = `<pre>${escapeHtml(exemplo)}</pre>`;
}

// ===================================
// INSERIR VARIÁVEL
// ===================================
function inserirVariavel(campoId, variavel) {
  const campo = document.getElementById(campoId);
  if (!campo) return;

  const start = campo.selectionStart ?? campo.value.length;
  const end = campo.selectionEnd ?? campo.value.length;

  campo.value =
    campo.value.substring(0, start) +
    variavel +
    campo.value.substring(end);

  campo.focus();
  campo.setSelectionRange(start + variavel.length, start + variavel.length);

  campoId === 'mensagemPadrao'
    ? atualizarPreviewProduto()
    : atualizarPreviewCarrinho();
}

// ===================================
// SALVAR
// ===================================
async function salvarConfiguracoes(e) {
  e.preventDefault();

  const whatsapp = document.getElementById('whatsapp')?.value.trim();
  if (!CryptoService.validatePhone(whatsapp)) {
    alert('Número de WhatsApp inválido');
    return;
  }

  const config = {
    whatsapp,
    mensagemPadrao: getValue('mensagemPadrao'),
    mensagemCarrinho: getValue('mensagemCarrinho'),

    whatsappFlutuante: isChecked('whatsappFlutuante'),
    whatsappMensagemFlutuante: getValue('whatsappMensagemFlutuante'),
    whatsappMensagemInicial: getValue('whatsappMensagemInicial'),

    exibirHorario: isChecked('exibirHorario'),
    horarioSegSexInicio: getValue('horarioSegSexInicio'),
    horarioSegSexFim: getValue('horarioSegSexFim'),
    horarioSabInicio: getValue('horarioSabInicio'),
    horarioSabFim: getValue('horarioSabFim'),
    atendeDOM: isChecked('atendeDOM'),
    mensagemForaHorario: getValue('mensagemForaHorario'),

    telefone: getValue('telefone'),
    email: getValue('email'),
    endereco: getValue('endereco')
  };

  const result = await ConfigService.salvar(config);
  alert(result.success ? '✅ Salvo com sucesso!' : '❌ Erro ao salvar');
}

// ===================================
// HELPERS
// ===================================
function setValue(id, value = '') {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function setChecked(id, value = false) {
  const el = document.getElementById(id);
  if (el) el.checked = value;
}

function getValue(id) {
  return document.getElementById(id)?.value.trim() || '';
}

function isChecked(id) {
  return document.getElementById(id)?.checked || false;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.inserirVariavel = inserirVariavel;

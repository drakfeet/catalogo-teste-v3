/**
 * UI de Configurações de Produtos
 * Gerencia Tipos, Categorias e Marcas
 */

// ===================================
// VARIÁVEIS GLOBAIS
// ===================================
let opcoesTamanhoTemp = [];
let tipoEditandoId = null;
let categoriaEditandoId = null;
let marcaEditandoId = null;
let isUploadingLogo = false;

// ===================================
// INICIALIZAÇÃO
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  carregarTodosDados();
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
  // Botões de abertura de modais
  document.getElementById('btnNovoTipo')?.addEventListener('click', () => abrirModalTipo());
  document.getElementById('btnNovaCategoria')?.addEventListener('click', () => abrirModalCategoria());
  document.getElementById('btnNovaMarca')?.addEventListener('click', () => abrirModalMarca());

  // Forms
  document.getElementById('formTipo')?.addEventListener('submit', salvarTipo);
  document.getElementById('formCategoria')?.addEventListener('submit', salvarCategoria);
  document.getElementById('formMarca')?.addEventListener('submit', salvarMarca);

  // Upload de logo da marca
  document.getElementById('marcaLogoUpload')?.addEventListener('change', uploadLogoMarca);
}

// ===================================
// CARREGAR DADOS
// ===================================
async function carregarTodosDados() {
  await Promise.all([
    carregarTipos(),
    carregarCategorias(),
    carregarMarcas()
  ]);
}

// ===================================
// TIPOS DE PRODUTO
// ===================================
async function carregarTipos() {
  const tipos = await TiposProdutoService.listar();
  const tbody = document.getElementById('tiposTableBody');

  if (tipos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          Nenhum tipo cadastrado. 
          <button class="btn btn-primary" onclick="abrirModalTipo()">Criar Primeiro Tipo</button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = tipos.map(tipo => `
    <tr>
      <td><strong>${escapeHtml(tipo.nome)}</strong></td>
      <td>${escapeHtml(tipo.nomePropriedade)}</td>
      <td>
        <div class="opcoes-preview">
          ${tipo.opcoesTamanho.slice(0, 5).join(', ')}
          ${tipo.opcoesTamanho.length > 5 ? ` (+${tipo.opcoesTamanho.length - 5})` : ''}
        </div>
      </td>
      <td>
        <span class="status-badge ${tipo.ativo ? 'ativo' : 'inativo'}">
          ${tipo.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="acoes">
        <button class="btn-editar" onclick="editarTipo('${tipo.id}')" title="Editar">✏️</button>
        <button class="btn-deletar" onclick="deletarTipo('${tipo.id}', '${escapeHtml(tipo.nome)}')" title="Deletar">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function abrirModalTipo(id = null) {
  tipoEditandoId = id;
  opcoesTamanhoTemp = [];
  
  const modal = document.getElementById('modalTipo');
  const titulo = document.getElementById('modalTipoTitulo');
  
  if (id) {
    titulo.textContent = 'Editar Tipo de Produto';
    carregarTipoParaEdicao(id);
  } else {
    titulo.textContent = 'Novo Tipo de Produto';
    document.getElementById('formTipo').reset();
    document.getElementById('tipoId').value = '';
    atualizarListaOpcoes();
  }
  
  modal.style.display = 'flex';
}

function fecharModalTipo() {
  document.getElementById('modalTipo').style.display = 'none';
  opcoesTamanhoTemp = [];
  tipoEditandoId = null;
}

async function carregarTipoParaEdicao(id) {
  const tipo = await TiposProdutoService.buscarPorId(id);
  
  if (!tipo) {
    alert('Tipo não encontrado');
    fecharModalTipo();
    return;
  }

  document.getElementById('tipoId').value = tipo.id;
  document.getElementById('tipoNome').value = tipo.nome;
  document.getElementById('tipoPropriedade').value = tipo.nomePropriedade;
  document.getElementById('tipoAtivo').checked = tipo.ativo;
  
  opcoesTamanhoTemp = [...tipo.opcoesTamanho];
  atualizarListaOpcoes();
}

function adicionarOpcaoTamanho() {
  const input = document.getElementById('novaTamanhoOpcao');
  const valor = input.value.trim();

  if (!valor) {
    alert('Digite uma opção');
    return;
  }

  if (opcoesTamanhoTemp.includes(valor)) {
    alert('Esta opção já foi adicionada');
    return;
  }

  opcoesTamanhoTemp.push(valor);
  input.value = '';
  atualizarListaOpcoes();
}

function removerOpcaoTamanho(index) {
  opcoesTamanhoTemp.splice(index, 1);
  atualizarListaOpcoes();
}

function atualizarListaOpcoes() {
  const lista = document.getElementById('listaOpcoesTamanho');

  if (opcoesTamanhoTemp.length === 0) {
    lista.innerHTML = '<p class="text-secondary">Nenhuma opção adicionada</p>';
    return;
  }

  lista.innerHTML = opcoesTamanhoTemp.map((opcao, index) => `
    <div class="opcao-item">
      <span>${escapeHtml(opcao)}</span>
      <button type="button" class="btn-remover" onclick="removerOpcaoTamanho(${index})">✕</button>
    </div>
  `).join('');
}

async function salvarTipo(e) {
  e.preventDefault();

  const tipo = {
    nome: document.getElementById('tipoNome').value.trim(),
    nomePropriedade: document.getElementById('tipoPropriedade').value.trim(),
    opcoesTamanho: opcoesTamanhoTemp,
    ativo: document.getElementById('tipoAtivo').checked
  };

  const validacao = TiposProdutoService.validar(tipo);
  
  if (!validacao.valido) {
    alert(validacao.erros.join('\n'));
    return;
  }

  const tipoId = document.getElementById('tipoId').value;
  let result;

  if (tipoId) {
    result = await TiposProdutoService.atualizar(tipoId, tipo);
  } else {
    result = await TiposProdutoService.criar(tipo);
  }

  if (result.success) {
    alert('✅ Tipo salvo com sucesso!');
    fecharModalTipo();
    carregarTipos();
  } else {
    alert('❌ Erro ao salvar tipo: ' + result.error);
  }
}

async function editarTipo(id) {
  abrirModalTipo(id);
}

async function deletarTipo(id, nome) {
  if (!confirm(`Deletar o tipo "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const result = await TiposProdutoService.deletar(id);

  if (result.success) {
    alert('✅ Tipo deletado com sucesso!');
    carregarTipos();
  } else {
    alert('❌ ' + result.error);
  }
}

// ===================================
// CATEGORIAS
// ===================================
async function carregarCategorias() {
  const categorias = await CategoriasService.listar();
  const tbody = document.getElementById('categoriasTableBody');

  if (categorias.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          Nenhuma categoria cadastrada.
          <button class="btn btn-primary" onclick="abrirModalCategoria()">Criar Primeira Categoria</button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = categorias.map(cat => `
    <tr>
      <td><span class="badge">${cat.ordem}</span></td>
      <td><strong>${escapeHtml(cat.nome)}</strong></td>
      <td><code>${escapeHtml(cat.slug)}</code></td>
      <td>
        <span class="status-badge ${cat.ativo ? 'ativo' : 'inativo'}">
          ${cat.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="acoes">
        <button class="btn-editar" onclick="editarCategoria('${cat.id}')" title="Editar">✏️</button>
        <button class="btn-deletar" onclick="deletarCategoria('${cat.id}', '${escapeHtml(cat.nome)}')" title="Deletar">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function abrirModalCategoria(id = null) {
  categoriaEditandoId = id;
  
  const modal = document.getElementById('modalCategoria');
  const titulo = document.getElementById('modalCategoriaTitulo');
  
  if (id) {
    titulo.textContent = 'Editar Categoria';
    carregarCategoriaParaEdicao(id);
  } else {
    titulo.textContent = 'Nova Categoria';
    document.getElementById('formCategoria').reset();
    document.getElementById('categoriaId').value = '';
  }
  
  modal.style.display = 'flex';
}

function fecharModalCategoria() {
  document.getElementById('modalCategoria').style.display = 'none';
  categoriaEditandoId = null;
}

async function carregarCategoriaParaEdicao(id) {
  const categoria = await CategoriasService.buscarPorId(id);
  
  if (!categoria) {
    alert('Categoria não encontrada');
    fecharModalCategoria();
    return;
  }

  document.getElementById('categoriaId').value = categoria.id;
  document.getElementById('categoriaNome').value = categoria.nome;
  document.getElementById('categoriaOrdem').value = categoria.ordem;
  document.getElementById('categoriaAtivo').checked = categoria.ativo;
}

async function salvarCategoria(e) {
  e.preventDefault();

  const categoria = {
    nome: document.getElementById('categoriaNome').value.trim(),
    ordem: parseInt(document.getElementById('categoriaOrdem').value) || 0,
    ativo: document.getElementById('categoriaAtivo').checked
  };

  const validacao = CategoriasService.validar(categoria);
  
  if (!validacao.valido) {
    alert(validacao.erros.join('\n'));
    return;
  }

  const categoriaId = document.getElementById('categoriaId').value;
  let result;

  if (categoriaId) {
    result = await CategoriasService.atualizar(categoriaId, categoria);
  } else {
    result = await CategoriasService.criar(categoria);
  }

  if (result.success) {
    alert('✅ Categoria salva com sucesso!');
    fecharModalCategoria();
    carregarCategorias();
  } else {
    alert('❌ Erro ao salvar categoria: ' + result.error);
  }
}

async function editarCategoria(id) {
  abrirModalCategoria(id);
}

async function deletarCategoria(id, nome) {
  if (!confirm(`Deletar a categoria "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const result = await CategoriasService.deletar(id);

  if (result.success) {
    alert('✅ Categoria deletada com sucesso!');
    carregarCategorias();
  } else {
    alert('❌ ' + result.error);
  }
}

// ===================================
// MARCAS
// ===================================
async function carregarMarcas() {
  const marcas = await MarcasService.listar();
  const tbody = document.getElementById('marcasTableBody');

  if (marcas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          Nenhuma marca cadastrada.
          <button class="btn btn-primary" onclick="abrirModalMarca()">Criar Primeira Marca</button>
        </td>
      </tr>
    `;
    return;
  }

  // Contar produtos por marca
  const marcasComContagem = await Promise.all(
    marcas.map(async (marca) => ({
      ...marca,
      totalProdutos: await MarcasService.contarProdutos(marca.id)
    }))
  );

  tbody.innerHTML = marcasComContagem.map(marca => `
    <tr>
      <td><strong>${escapeHtml(marca.nome)}</strong></td>
      <td><code>${escapeHtml(marca.slug)}</code></td>
      <td><span class="badge">${marca.totalProdutos}</span></td>
      <td>
        <span class="status-badge ${marca.ativo ? 'ativo' : 'inativo'}">
          ${marca.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="acoes">
        <button class="btn-editar" onclick="editarMarca('${marca.id}')" title="Editar">✏️</button>
        <button class="btn-deletar" onclick="deletarMarca('${marca.id}', '${escapeHtml(marca.nome)}')" title="Deletar">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function abrirModalMarca(id = null) {
  marcaEditandoId = id;
  
  const modal = document.getElementById('modalMarca');
  const titulo = document.getElementById('modalMarcaTitulo');
  
  if (id) {
    titulo.textContent = 'Editar Marca';
    carregarMarcaParaEdicao(id);
  } else {
    titulo.textContent = 'Nova Marca';
    document.getElementById('formMarca').reset();
    document.getElementById('marcaId').value = '';
    document.getElementById('marcaLogoUrl').value = '';
    document.getElementById('marcaLogoPreview').innerHTML = '';
    document.getElementById('marcaLogoPreview').style.display = 'none';
  }
  
  modal.style.display = 'flex';
}

function fecharModalMarca() {
  document.getElementById('modalMarca').style.display = 'none';
  marcaEditandoId = null;
}

async function carregarMarcaParaEdicao(id) {
  const marca = await MarcasService.buscarPorId(id);
  
  if (!marca) {
    alert('Marca não encontrada');
    fecharModalMarca();
    return;
  }

  document.getElementById('marcaId').value = marca.id;
  document.getElementById('marcaNome').value = marca.nome;
  document.getElementById('marcaDescricao').value = marca.descricao || '';
  document.getElementById('marcaLogoUrl').value = marca.logoUrl || '';
  document.getElementById('marcaAtivo').checked = marca.ativo;

  if (marca.logoUrl) {
    const preview = document.getElementById('marcaLogoPreview');
    preview.innerHTML = `<img src="${marca.logoUrl}" alt="Logo da Marca">`;
    preview.style.display = 'block';
  }
}

async function uploadLogoMarca(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Selecione apenas imagens');
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert('Imagem muito grande (máx. 2MB)');
    return;
  }

  const preview = document.getElementById('marcaLogoPreview');
  preview.innerHTML = '<p>📤 Enviando...</p>';
  preview.style.display = 'block';

  isUploadingLogo = true;

  try {
    const imageUrl = await ProdutosService.uploadImagem(file);
    document.getElementById('marcaLogoUrl').value = imageUrl;
    preview.innerHTML = `<img src="${imageUrl}" alt="Logo da Marca">`;
  } catch (err) {
    console.error('❌ Erro no upload:', err);
    alert('Erro ao enviar logo');
    preview.innerHTML = '';
  } finally {
    isUploadingLogo = false;
  }
}

async function salvarMarca(e) {
  e.preventDefault();

  if (isUploadingLogo) {
    alert('Aguarde o upload da logo finalizar');
    return;
  }

  const marca = {
    nome: document.getElementById('marcaNome').value.trim(),
    descricao: document.getElementById('marcaDescricao').value.trim(),
    logoUrl: document.getElementById('marcaLogoUrl').value.trim(),
    ativo: document.getElementById('marcaAtivo').checked
  };

  const validacao = MarcasService.validar(marca);
  
  if (!validacao.valido) {
    alert(validacao.erros.join('\n'));
    return;
  }

  const marcaId = document.getElementById('marcaId').value;
  let result;

  if (marcaId) {
    result = await MarcasService.atualizar(marcaId, marca);
  } else {
    result = await MarcasService.criar(marca);
  }

  if (result.success) {
    alert('✅ Marca salva com sucesso!');
    fecharModalMarca();
    carregarMarcas();
  } else {
    alert('❌ Erro ao salvar marca: ' + result.error);
  }
}

async function editarMarca(id) {
  abrirModalMarca(id);
}

async function deletarMarca(id, nome) {
  if (!confirm(`Deletar a marca "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const result = await MarcasService.deletar(id);

  if (result.success) {
    alert('✅ Marca deletada com sucesso!');
    carregarMarcas();
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
window.abrirModalTipo = abrirModalTipo;
window.fecharModalTipo = fecharModalTipo;
window.editarTipo = editarTipo;
window.deletarTipo = deletarTipo;
window.adicionarOpcaoTamanho = adicionarOpcaoTamanho;
window.removerOpcaoTamanho = removerOpcaoTamanho;

window.abrirModalCategoria = abrirModalCategoria;
window.fecharModalCategoria = fecharModalCategoria;
window.editarCategoria = editarCategoria;
window.deletarCategoria = deletarCategoria;

window.abrirModalMarca = abrirModalMarca;
window.fecharModalMarca = fecharModalMarca;
window.editarMarca = editarMarca;
window.deletarMarca = deletarMarca;
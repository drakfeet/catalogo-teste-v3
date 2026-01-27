/**
 * Sistema de Filtros do Catálogo
 * Filtra produtos por marca e tamanho
 */

const Filters = {
  produtosTodos: [],
  filtrosMarcaSelecionados: [],
  filtrosTamanhoSelecionados: [],
  termoBusca: '',
  config: null,

  /**
   * Inicializa o sistema de filtros
   * @param {Array} produtos 
   * @param {object} config 
   */
  init(produtos, config) {
    this.produtosTodos = produtos;
    this.config = config;
    this.renderizarFiltros();
    this.configurarEventListeners();
  },

  /**
   * Renderiza opções de filtros
   */
  renderizarFiltros() {
    this.renderizarFiltrosMarca();
    this.renderizarFiltrosTamanho();
  },

  /**
   * Renderiza filtros de marca
   */
  renderizarFiltrosMarca() {
    const container = document.getElementById('filtrosMarca');
    if (!container) return;

    const marcas = DataService.extrairMarcas(this.produtosTodos);
    
    container.innerHTML = marcas.map(marca => `
      <label class="filtro-checkbox">
        <input type="checkbox" value="${marca}" data-filtro="marca">
        <span>${marca}</span>
      </label>
    `).join('');
  },

  /**
   * Renderiza filtros de tamanho
   */
  renderizarFiltrosTamanho() {
    const container = document.getElementById('filtrosTamanho');
    if (!container) return;

    const tamanhos = DataService.extrairTamanhos(this.produtosTodos);
    
    container.innerHTML = tamanhos.map(tamanho => `
      <label class="filtro-checkbox">
        <input type="checkbox" value="${tamanho}" data-filtro="tamanho">
        <span>${tamanho}</span>
      </label>
    `).join('');
  },

  /**
   * Configura event listeners
   */
  configurarEventListeners() {
    // Busca simples
    const campoBusca = document.getElementById('campoBusca');
    if (campoBusca) {
      campoBusca.addEventListener('input', (e) => {
        this.termoBusca = e.target.value.toLowerCase();
        this.aplicarFiltros();
      });
    }

    // Filtros de marca
    document.querySelectorAll('[data-filtro="marca"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filtrosMarcaSelecionados.push(e.target.value);
        } else {
          this.filtrosMarcaSelecionados = this.filtrosMarcaSelecionados.filter(
            m => m !== e.target.value
          );
        }
        this.aplicarFiltros();
      });
    });

    // Filtros de tamanho
    document.querySelectorAll('[data-filtro="tamanho"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filtrosTamanhoSelecionados.push(e.target.value);
        } else {
          this.filtrosTamanhoSelecionados = this.filtrosTamanhoSelecionados.filter(
            t => t !== e.target.value
          );
        }
        this.aplicarFiltros();
      });
    });

    // Botão limpar filtros
    const btnLimpar = document.getElementById('btnLimparFiltros');
    if (btnLimpar) {
      btnLimpar.addEventListener('click', () => this.limparFiltros());
    }
  },

  /**
   * Aplica filtros selecionados
   */
  aplicarFiltros() {
    let produtosFiltrados = [...this.produtosTodos];

    // Filtrar por busca
    if (this.termoBusca) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        p.nome.toLowerCase().includes(this.termoBusca) ||
        p.marca.toLowerCase().includes(this.termoBusca) ||
        (p.categoria && p.categoria.toLowerCase().includes(this.termoBusca))
      );
    }

    // Filtrar por marca
    if (this.filtrosMarcaSelecionados.length > 0) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        this.filtrosMarcaSelecionados.includes(p.marca)
      );
    }

    // Filtrar por tamanho
    if (this.filtrosTamanhoSelecionados.length > 0) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        p.tamanhos.some(t => this.filtrosTamanhoSelecionados.includes(t))
      );
    }

    // Atualizar contadores
    this.atualizarContadores(produtosFiltrados.length);

    // Renderizar produtos filtrados
    CatalogRender.renderizarPorCategorias(produtosFiltrados);

    // Fechar sidebar mobile após filtrar
    this.fecharSidebarMobile();
  },

  /**
   * Limpa todos os filtros
   */
  limparFiltros() {
    this.filtrosMarcaSelecionados = [];
    this.filtrosTamanhoSelecionados = [];
    this.termoBusca = '';

    // Desmarcar checkboxes
    document.querySelectorAll('[data-filtro]').forEach(checkbox => {
      checkbox.checked = false;
    });

    // Limpar campo de busca
    const campoBusca = document.getElementById('campoBusca');
    if (campoBusca) {
      campoBusca.value = '';
    }

    // Resetar categoria para "todas"
    CatalogRender.categoriaAtual = 'todas';
    document.querySelectorAll('.categoria-item').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.categoria === 'todas') {
        btn.classList.add('active');
      }
    });

    // Mostrar todos os produtos
    this.atualizarContadores(this.produtosTodos.length);
    CatalogRender.renderizarPorCategorias(this.produtosTodos);

    // Fechar sidebar mobile
    this.fecharSidebarMobile();
  },

  /**
   * Fecha sidebar mobile
   */
  fecharSidebarMobile() {
    const sidebar = document.getElementById('filtrosSidebar');
    const overlay = document.getElementById('filtrosOverlay');
    
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  },

  /**
   * Atualiza contador de produtos
   * @param {number} total 
   */
  atualizarContadores(total) {
    const contador = document.getElementById('contadorProdutos');
    if (contador) {
      contador.textContent = `${total} produto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    }
  }
};

// Exportar
window.Filters = Filters;
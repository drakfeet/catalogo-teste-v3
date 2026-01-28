/**
 * Renderização do Catálogo V3
 * Com separação Vestuário/Tênis
 */

const CatalogRender = {
  config: null,
  produtosTodos: [],
  categoriaAtual: 'todas',
  tipoFiltro: 'todos', // 'todos', 'tenis', 'vestuario'

  /**
   * Renderiza produtos organizados
   * @param {Array} produtos 
   */
  renderizarPorCategorias(produtos) {
    this.produtosTodos = produtos;
    const container = document.getElementById('produtosPorCategoria');
    
    if (!container) return;

    if (produtos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Nenhum produto encontrado</p>
        </div>
      `;
      return;
    }

    // Filtrar por tipo se necessário
    let produtosFiltrados = produtos;
    if (this.tipoFiltro !== 'todos') {
      produtosFiltrados = this.filtrarPorTipo(produtos, this.tipoFiltro);
    }

    // Agrupar por categoria
    const produtosPorCategoria = this.agruparPorCategoria(produtosFiltrados);

    // Renderizar menu de tipos
    this.renderizarMenuTipos();

    // Renderizar menu de categorias
    this.renderizarMenuCategorias(produtosPorCategoria);

    // Renderizar seções
    let html = '';
    
    if (this.categoriaAtual === 'todas') {
      for (const [categoria, prods] of Object.entries(produtosPorCategoria)) {
        html += this.criarSecaoCategoria(categoria, prods);
      }
    } else {
      const prods = produtosPorCategoria[this.categoriaAtual];
      if (prods && prods.length > 0) {
        html += this.criarSecaoCategoria(this.categoriaAtual, prods);
      }
    }

    container.innerHTML = html || '<div class="empty-state"><p>Nenhum produto nesta categoria</p></div>';
    this.configurarEventListeners();
  },

  /**
   * Filtra produtos por tipo
   * @param {Array} produtos 
   * @param {string} tipo 
   * @returns {Array}
   */
  filtrarPorTipo(produtos, tipo) {
    if (tipo === 'tenis') {
      return produtos.filter(p => 
        p.tipoProdutoNome?.toLowerCase() === 'tênis' ||
        p.tipoProdutoNome?.toLowerCase() === 'tenis'
      );
    } else if (tipo === 'vestuario') {
      return produtos.filter(p => 
        p.tipoProdutoNome?.toLowerCase() !== 'tênis' &&
        p.tipoProdutoNome?.toLowerCase() !== 'tenis'
      );
    }
    return produtos;
  },

  /**
   * Renderiza menu de tipos (Tênis/Vestuário)
   */
  renderizarMenuTipos() {
    const menuTipos = document.getElementById('menuTipos');
    if (!menuTipos) {
      // Criar menu de tipos se não existir
      const header = document.querySelector('.header');
      if (header) {
        const menuContainer = document.createElement('div');
        menuContainer.className = 'menu-tipos-container';
        menuContainer.id = 'menuTipos';
        menuContainer.innerHTML = `
          <button class="tipo-btn active" data-tipo="todos">
            🏪 Todos
          </button>
          <button class="tipo-btn" data-tipo="tenis">
            👟 Tênis
          </button>
          <button class="tipo-btn" data-tipo="vestuario">
            👕 Vestuário
          </button>
        `;
        header.appendChild(menuContainer);
        
        this.configurarMenuTipos();
      }
      return;
    }

    // Atualizar estado ativo
    menuTipos.querySelectorAll('.tipo-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tipo === this.tipoFiltro);
    });
  },

  /**
   * Configura eventos do menu de tipos
   */
  configurarMenuTipos() {
    const menuTipos = document.getElementById('menuTipos');
    if (!menuTipos) return;

    menuTipos.querySelectorAll('.tipo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tipoFiltro = btn.dataset.tipo;
        this.categoriaAtual = 'todas';
        this.renderizarPorCategorias(this.produtosTodos);
      });
    });
  },

  /**
   * Agrupa produtos por categoria
   * @param {Array} produtos 
   * @returns {Object}
   */
  agruparPorCategoria(produtos) {
    const agrupados = {};
    
    produtos.forEach(produto => {
      const categoria = produto.categoria || 'Sem Categoria';
      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      agrupados[categoria].push(produto);
    });

    return agrupados;
  },

  /**
   * Renderiza menu de categorias
   * @param {Object} produtosPorCategoria 
   */
  renderizarMenuCategorias(produtosPorCategoria) {
    const menuDesktop = document.getElementById('menuCategoriasDesktop');
    
    const categorias = Object.keys(produtosPorCategoria);
    
    let categoriasMenu = [];
    if (this.config?.menuCategorias && this.config.menuCategorias.length > 0) {
      categoriasMenu = this.config.menuCategorias.filter(cat => categorias.includes(cat));
    } else {
      categoriasMenu = categorias;
    }

    // Menu Desktop (horizontal)
    const menuDesktopNav = document.getElementById('menuDesktopList');
    if (menuDesktopNav) {
      const categoriasHtmlNav = categoriasMenu.map(cat => `
        <li><a href="#" class="menu-link" data-categoria="${cat}">${cat}</a></li>
      `).join('');

      menuDesktopNav.innerHTML = `
        <li><a href="#" class="menu-link active" data-categoria="todas">Início</a></li>
        ${categoriasHtmlNav}
      `;

      menuDesktopNav.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          menuDesktopNav.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
          link.classList.add('active');
          
          this.categoriaAtual = link.dataset.categoria;
          this.renderizarPorCategorias(this.produtosTodos);
          
          // Scroll suave para produtos
          document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    // Menu Mobile (scroll horizontal) - manter compatibilidade
    if (menuDesktop) {
      const scrollDiv = menuDesktop.querySelector('.categorias-scroll');
      if (scrollDiv) {
        const btnTodas = '<button class="categoria-item active" data-categoria="todas">Todas</button>';
        const categoriasHtml = categoriasMenu.map(cat => `
          <button class="categoria-item" data-categoria="${cat}">
            ${cat}
          </button>
        `).join('');
        scrollDiv.innerHTML = btnTodas + categoriasHtml;
        
        scrollDiv.querySelectorAll('.categoria-item').forEach(btn => {
          btn.addEventListener('click', () => {
            scrollDiv.querySelectorAll('.categoria-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            this.categoriaAtual = btn.dataset.categoria;
            this.renderizarPorCategorias(this.produtosTodos);
            
            // Fechar menu mobile se estiver aberto
            if (window.MenuService) {
              MenuService.close();
            }
          });
        });
      }
    }
  },

  /**
   * Renderiza menu mobile
   * @param {Array} produtos 
   */
  renderizarMenuMobile(produtos) {
    const menuMobile = document.getElementById('mobileMenuCategorias');
    if (!menuMobile) return;

    const produtosPorCategoria = this.agruparPorCategoria(produtos);
    const categorias = Object.keys(produtosPorCategoria);
    
    let categoriasMenu = [];
    if (this.config?.menuCategorias && this.config.menuCategorias.length > 0) {
      categoriasMenu = this.config.menuCategorias.filter(cat => categorias.includes(cat));
    } else {
      categoriasMenu = categorias;
    }

    const categoriasHtml = categoriasMenu.map(cat => `
      <button class="mobile-categoria-item" data-categoria="${cat}">
        <span class="categoria-nome">${cat}</span>
        <span class="categoria-count">${produtosPorCategoria[cat].length}</span>
      </button>
    `).join('');

    const btnTodas = `
      <button class="mobile-categoria-item active" data-categoria="todas">
        <span class="categoria-nome">Todas</span>
        <span class="categoria-count">${produtos.length}</span>
      </button>
    `;

    menuMobile.innerHTML = btnTodas + categoriasHtml;

    // Event listeners
    menuMobile.querySelectorAll('.mobile-categoria-item').forEach(btn => {
      btn.addEventListener('click', () => {
        menuMobile.querySelectorAll('.mobile-categoria-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.categoriaAtual = btn.dataset.categoria;
        this.renderizarPorCategorias(this.produtosTodos);
        
        // Fechar menu mobile
        if (window.MenuService) {
          MenuService.close();
        }
      });
    });
  },

  /**
   * Cria seção de categoria
   * @param {string} categoria 
   * @param {Array} produtos 
   * @returns {string}
   */
  criarSecaoCategoria(categoria, produtos) {
    return `
      <div class="categoria-secao">
        <h3 class="categoria-titulo">${categoria}</h3>
        <div class="produtos-grid">
          ${produtos.map(p => this.criarCardProduto(p)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Cria HTML do card de produto
   * @param {object} produto 
   * @returns {string}
   */
  criarCardProduto(produto) {
    const parcelasSemJuros = this.config.parcelasSemJuros || 3;
    const valorMinParcela = this.config.valorMinimoParcela || 0;

    // Calcular desconto real baseado na diferença entre precoCartao e precoPix
    const descontoReal = produto.precoCartao > 0 
      ? Math.round(((produto.precoCartao - produto.precoPix) / produto.precoCartao) * 100)
      : 0;

    // Calcular parcelas válidas
    let parcelasValidas = parcelasSemJuros;
    if (valorMinParcela > 0) {
      parcelasValidas = Math.min(parcelasSemJuros, Math.floor(produto.precoCartao / valorMinParcela));
    }

    const parcelasTexto = parcelasValidas > 1 
      ? `até ${parcelasValidas}x de R$ ${this.formatarPreco(produto.precoCartao / parcelasValidas)}` 
      : '';

    // Badge do tipo de produto
    const tipoBadge = produto.tipoProdutoNome 
      ? `<span class="tipo-badge">${produto.tipoProdutoNome}</span>` 
      : '';

    return `
      <div class="produto-card" data-produto-id="${produto.id}">
        <div class="produto-imagem">
          <img src="${produto.imagemUrl}" alt="${produto.nome}" loading="lazy">
          ${tipoBadge}
        </div>
        <div class="produto-info">
          <span class="produto-marca">${produto.marca}</span>
          <h3 class="produto-nome">${produto.nome}</h3>
          
          <div class="produto-precos">
            <div class="preco-item">
              <span class="preco-label">💳 Cartão</span>
              <span class="preco-valor">R$ ${this.formatarPreco(produto.precoCartao)}</span>
              ${parcelasTexto ? `<small class="parcelas-info">${parcelasTexto}</small>` : ''}
            </div>
            <div class="preco-item destaque">
              ${descontoReal > 0 ? `<span class="desconto-badge">${descontoReal}% OFF</span>` : ''}
              <span class="preco-label">💰 PIX</span>
              <span class="preco-valor">R$ ${this.formatarPreco(produto.precoPix)}</span>
            </div>
          </div>

          <div class="produto-tamanhos">
            <label>${produto.tipoProdutoNome === 'Tênis' ? 'Numeração' : 'Tamanho'}:</label>
            <div class="tamanhos-opcoes">
              ${produto.tamanhos.map(tamanho => `
                <label class="tamanho-radio">
                  <input type="radio" name="tamanho-${produto.id}" value="${tamanho}">
                  <span>${tamanho}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="produto-pagamento">
            <label>Forma de Pagamento:</label>
            <div class="pagamento-opcoes">
              <label class="pagamento-radio">
                <input type="radio" name="pagamento-${produto.id}" value="pix" checked>
                <span>💰 PIX - R$ ${this.formatarPreco(produto.precoPix)}</span>
              </label>
              <label class="pagamento-radio">
                <input type="radio" name="pagamento-${produto.id}" value="cartao">
                <span>💳 Cartão - R$ ${this.formatarPreco(produto.precoCartao)}</span>
              </label>
            </div>
          </div>

          <div class="produto-actions">
            <button class="btn-add-cart" onclick="CatalogRender.adicionarAoCarrinho('${produto.id}')">
              🛒 Adicionar ao Carrinho
            </button>
            <button class="btn-whatsapp" onclick="CatalogRender.enviarWhatsApp('${produto.id}')">
              📱 Comprar Agora
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Adiciona produto ao carrinho
   * @param {string} produtoId 
   */
  adicionarAoCarrinho(produtoId) {
    const card = document.querySelector(`[data-produto-id="${produtoId}"]`);
    if (!card) return;

    const tamanhoRadio = card.querySelector(`input[name="tamanho-${produtoId}"]:checked`);
    if (!tamanhoRadio) {
      alert('Por favor, selecione um tamanho');
      return;
    }

    const pagamentoRadio = card.querySelector(`input[name="pagamento-${produtoId}"]:checked`);
    const formaPagamento = pagamentoRadio.value === 'pix' ? 'PIX' : 'Cartão';
    const preco = pagamentoRadio.value === 'pix' ? this.produtosTodos.find(p => p.id === produtoId).precoPix : this.produtosTodos.find(p => p.id === produtoId).precoCartao;

    const produto = this.produtosTodos.find(p => p.id === produtoId);
    
    if (window.CartService) {
      CartService.addItem(produto, tamanhoRadio.value, formaPagamento, preco);
    } else {
      alert('Carrinho não disponível');
    }
  },

  /**
   * Formata preço
   * @param {number} preco 
   * @returns {string}
   */
  formatarPreco(preco) {
    return parseFloat(preco).toFixed(2).replace('.', ',');
  },

  /**
   * Configura event listeners
   */
  configurarEventListeners() {
    const btnFiltros = document.getElementById('btnFiltrosMobile');
    const sidebar = document.getElementById('filtrosSidebar');
    const overlay = document.getElementById('filtrosOverlay');
    const btnFechar = document.getElementById('btnFecharFiltros');

    if (btnFiltros) {
      btnFiltros.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      });
    }

    if (btnFechar) {
      btnFechar.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    }
  },

  /**
   * Envia pedido via WhatsApp
   * @param {string} produtoId 
   */
  async enviarWhatsApp(produtoId) {
    const card = document.querySelector(`[data-produto-id="${produtoId}"]`);
    
    if (!card) return;

    const tamanhoRadio = card.querySelector(`input[name="tamanho-${produtoId}"]:checked`);
    if (!tamanhoRadio) {
      alert('Por favor, selecione um tamanho');
      return;
    }

    const pagamentoRadio = card.querySelector(`input[name="pagamento-${produtoId}"]:checked`);
    const formaPagamento = pagamentoRadio.value === 'pix' ? 'PIX' : 'Cartão';

    const nome = card.querySelector('.produto-nome').textContent;
    const marca = card.querySelector('.produto-marca').textContent;
    const tamanho = tamanhoRadio.value;
    
    const precoText = pagamentoRadio.parentElement.querySelector('span').textContent;
    const preco = precoText.match(/R\$ ([\d,]+)/)[1];
    const valorNumerico = parseFloat(preco.replace(',', '.'));

    let mensagem = this.config.mensagemPadrao;
    
    mensagem = mensagem
      .replace(/{produto}/g, nome)
      .replace(/{marca}/g, marca)
      .replace(/{tamanho}/g, tamanho)
      .replace(/{pagamento}/g, formaPagamento)
      .replace(/{valor}/g, preco);

    await DataService.registrarCliqueWhatsApp({
      produtoId,
      produtoNome: nome
    });

    if (window.TrackingService) {
      TrackingService.trackWhatsAppClick({
        nome: nome,
        marca: marca,
        tamanho: tamanho,
        pagamento: formaPagamento,
        valor: valorNumerico
      });
    }

    const whatsappUrl = `https://wa.me/${this.config.whatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  },

  /**
   * Define configuração
   * @param {object} config 
   */
  setConfig(config) {
    this.config = config;
    this.aplicarCustomizacao(config);
  },

  /**
   * Aplica customização de cores
   * @param {object} config 
   */
  aplicarCustomizacao(config) {
    if (!config.customizacao) return;

    const root = document.documentElement;
    const custom = config.customizacao;

    if (custom.corPrimaria) root.style.setProperty('--primary', custom.corPrimaria);
    if (custom.corSecundaria) root.style.setProperty('--success', custom.corSecundaria);
    if (custom.corFundo) root.style.setProperty('--bg-dark', custom.corFundo);
    if (custom.corTexto) root.style.setProperty('--text-primary', custom.corTexto);
  },

  /**
   * Mostra loading
   */
  mostrarLoading() {
    const container = document.getElementById('produtosPorCategoria');
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Carregando produtos...</p>
        </div>
      `;
    }
  }
};

// Exportar
window.CatalogRender = CatalogRender;
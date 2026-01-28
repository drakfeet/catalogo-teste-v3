/**
 * UI de Produtos V3
 * Interface com tipos dinâmicos
 */

const ProdutosUI = {
  isSubmitting: false,
  isUploading: false,
  tiposDisponiveis: [],

  /**
   * Inicialização
   */
  init() {
    console.log('🟢 ProdutosUI.init iniciado');

    const form = document.getElementById('produtoForm');
    if (form) {
      form.addEventListener('submit', e => this.salvarProduto(e));
    }

    const inputImagem = document.getElementById('imagemUpload');
    if (inputImagem) {
      inputImagem.addEventListener('change', e => this.processarUpload(e));
    }

    const tipoSelect = document.getElementById('tipoProduto');
    if (tipoSelect) {
      tipoSelect.addEventListener('change', e => this.carregarTamanhosPorTipo(e.target.value));
    }

    this.carregarTiposProduto();
  },

  /**
   * Carrega tipos de produto disponíveis
   */
  async carregarTiposProduto() {
    try {
      this.tiposDisponiveis = await TiposProdutoService.listar();
      this.renderizarSelectTipos();
    } catch (error) {
      console.error('❌ Erro ao carregar tipos:', error);
    }
  },

  /**
   * Renderiza select de tipos
   */
  renderizarSelectTipos() {
    const select = document.getElementById('tipoProduto');
    if (!select) return;

    const tiposAtivos = this.tiposDisponiveis.filter(t => t.ativo);

    select.innerHTML = `
      <option value="">Selecione o tipo</option>
      ${tiposAtivos.map(tipo => `
        <option value="${tipo.id}">${tipo.nome}</option>
      `).join('')}
    `;
  },

  /**
   * Carrega tamanhos baseado no tipo selecionado
   * @param {string} tipoId 
   */
  async carregarTamanhosPorTipo(tipoId) {
    const container = document.getElementById('tamanhosSelect');
    if (!container) return;

    if (!tipoId) {
      container.innerHTML = '<p class="text-secondary">Selecione um tipo de produto primeiro</p>';
      return;
    }

    const tipo = this.tiposDisponiveis.find(t => t.id === tipoId);
    if (!tipo) return;

    this.renderizarTamanhos(tipo.opcoesTamanho, tipo.nomePropriedade);
  },

  /**
   * Renderiza opções de tamanho
   * @param {Array} tamanhos 
   * @param {string} nomePropriedade 
   * @param {Array} tamanhosSelecionados 
   */
  renderizarTamanhos(tamanhos, nomePropriedade = 'Tamanho', tamanhosSelecionados = []) {
    const container = document.getElementById('tamanhosSelect');
    if (!container) return;

    // Atualizar label
    const label = document.querySelector('label[for="tamanhosSelect"]');
    if (label) {
      label.textContent = `${nomePropriedade} Disponíveis *`;
    }

    container.innerHTML = tamanhos.map(tamanho => {
      const checked = tamanhosSelecionados.includes(tamanho) ? 'checked' : '';
      return `
        <label class="tamanho-item">
          <input 
            type="checkbox" 
            name="tamanhos" 
            value="${tamanho}" 
            ${checked}>
          <span>${tamanho}</span>
        </label>
      `;
    }).join('');
  },

  /**
   * Renderiza lista de produtos
   * @param {Array} produtos 
   */
  renderizarLista(produtos = []) {
    const tbody = document.getElementById('produtosTableBody');
    if (!tbody) return;

    if (!Array.isArray(produtos) || produtos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:40px;">
            Nenhum produto cadastrado
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = produtos.map(produto => `
      <tr>
        <td>
          <img src="${produto.imagemUrl}"
               alt="${this.escapeHTML(produto.nome)}"
               style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
        </td>
        <td>
          <strong>${this.escapeHTML(produto.nome)}</strong>
          <br>
          <small class="text-secondary">${produto.tipoProdutoNome || 'Sem tipo'}</small>
        </td>
        <td>${this.escapeHTML(produto.marca)}</td>
        <td>R$ ${this.formatarPreco(produto.precoPix)}</td>
        <td>R$ ${this.formatarPreco(produto.precoCartao)}</td>
        <td>
          <span class="status-badge ${produto.ativo ? 'ativo' : 'inativo'}">
            ${produto.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td class="acoes">
          <button onclick="ProdutosUI.editar('${produto.id}')">✏️</button>
          <button onclick="ProdutosUI.confirmarDelete('${produto.id}', '${this.escapeHTML(produto.nome)}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  },

  /**
   * Editar produto
   * @param {string} id 
   */
  editar(id) {
    window.location.href = `/admin/produto-form.html?id=${encodeURIComponent(id)}`;
  },

  /**
   * Confirmar exclusão
   * @param {string} id 
   * @param {string} nome 
   */
  async confirmarDelete(id, nome) {
    if (!confirm(`Excluir o produto "${nome}"?\n\nEsta ação é irreversível.`)) {
      return;
    }

    try {
      this.mostrarLoading('Excluindo produto...');
      await ProdutosService.deletar(id);
      this.mostrarMensagem('Produto excluído com sucesso!', 'success');
      this.renderizarLista(await ProdutosService.listar());
    } catch (err) {
      console.error('❌ Erro ao excluir produto', err);
      this.mostrarMensagem('Erro ao excluir produto', 'error');
    } finally {
      this.esconderLoading();
    }
  },

  /**
   * Carregar produto para edição
   * @param {string} produtoId 
   */
  async carregarFormulario(produtoId) {
    try {
      this.mostrarLoading('Carregando produto...');
      
      await this.carregarTiposProduto();
      
      const produto = await ProdutosService.buscarPorId(produtoId);
      
      if (!produto) {
        alert('Produto não encontrado');
        window.location.href = '/admin/produtos.html';
        return;
      }

      document.getElementById('nome').value = produto.nome;
      document.getElementById('marca').value = produto.marca;
      document.getElementById('categoria').value = produto.categoria || '';
      document.getElementById('tipoProduto').value = produto.tipoProdutoId || '';
      document.getElementById('precoPix').value = produto.precoPix;
      document.getElementById('precoCartao').value = produto.precoCartao;
      document.getElementById('imagemUrlHidden').value = produto.imagemUrl;
      document.getElementById('ativo').checked = produto.ativo;

      // Preview da imagem
      const preview = document.getElementById('imagemPreview');
      if (preview && produto.imagemUrl) {
        preview.innerHTML = `<img src="${produto.imagemUrl}" alt="Produto">`;
        preview.style.display = 'block';
      }

      // Carregar tamanhos do tipo
      if (produto.tipoProdutoId) {
        const tipo = this.tiposDisponiveis.find(t => t.id === produto.tipoProdutoId);
        if (tipo) {
          this.renderizarTamanhos(tipo.opcoesTamanho, tipo.nomePropriedade, produto.tamanhos);
        }
      }

      this.esconderLoading();
    } catch (error) {
      console.error('❌ Erro ao carregar formulário:', error);
      this.esconderLoading();
      alert('Erro ao carregar produto');
    }
  },

  /**
   * Processar upload de imagem
   * @param {Event} e 
   */
  async processarUpload(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      this.mostrarMensagem('Selecione uma imagem válida', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.mostrarMensagem('Imagem muito grande (máx. 5MB)', 'error');
      return;
    }

    const preview = document.getElementById('imagemPreview');
    if (!preview) return;

    preview.innerHTML = '';
    preview.style.display = 'block';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.width = '160px';
    img.style.height = '160px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '10px';

    const progressContainer = document.createElement('div');
    progressContainer.style.marginTop = '8px';
    progressContainer.innerHTML = `
      <div style="width:160px;height:8px;background:#334155;border-radius:4px;">
        <div id="uploadBar" style="width:0%;height:100%;background:#10b981;border-radius:4px;transition:width .2s;"></div>
      </div>
    `;

    preview.appendChild(img);
    preview.appendChild(progressContainer);

    this.isUploading = true;

    try {
      const imageUrl = await this.uploadComProgresso(file);
      document.getElementById('imagemUrlHidden').value = imageUrl;
      img.src = imageUrl;
      progressContainer.remove();
    } catch (err) {
      console.error('❌ Erro no upload', err);
      progressContainer.remove();
      this.mostrarMensagem('Erro ao enviar imagem', 'error');
    } finally {
      this.isUploading = false;
    }
  },

  /**
   * Upload com barra de progresso
   * @param {File} file 
   * @returns {Promise<string>}
   */
  uploadComProgresso(file) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append('file', file);
      formData.append('upload_preset', ProdutosService.cloudinary.uploadPreset);

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          const bar = document.getElementById('uploadBar');
          if (bar) bar.style.width = percent + '%';
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText || '{}');
          res.secure_url ? resolve(res.secure_url) : reject(new Error('URL não retornada'));
        } catch {
          reject(new Error('Erro ao processar resposta'));
        }
      };

      xhr.onerror = () => reject(new Error('Erro na requisição'));

      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${ProdutosService.cloudinary.cloudName}/image/upload`
      );
      xhr.send(formData);
    });
  },

  /**
   * Salvar produto
   * @param {Event} e 
   */
  async salvarProduto(e) {
    e.preventDefault();
    
    if (this.isSubmitting || this.isUploading) {
      alert('Aguarde o upload da imagem finalizar');
      return;
    }

    this.isSubmitting = true;
    const form = e.target;
    const produtoId = new URLSearchParams(window.location.search).get('id');

    const tamanhosSelecionados = [...document.querySelectorAll('#tamanhosSelect input:checked')]
      .map(i => i.value);

    const tipoId = form.tipoProduto.value;
    const tipo = this.tiposDisponiveis.find(t => t.id === tipoId);

    const produto = {
      nome: form.nome.value.trim(),
      marca: form.marca.value.trim(),
      categoria: form.categoria.value.trim(),
      tipoProdutoId: tipoId,
      tipoProdutoNome: tipo ? tipo.nome : '',
      precoPix: Number(form.precoPix.value),
      precoCartao: Number(form.precoCartao.value),
      tamanhos: tamanhosSelecionados,
      imagemUrl: form.imagemUrlHidden.value,
      ativo: form.ativo.checked
    };

    const validacao = ProdutosService.validar(produto);
    
    if (!validacao.valido) {
      alert(validacao.erros.join('\n'));
      this.isSubmitting = false;
      return;
    }

    try {
      this.mostrarLoading(produtoId ? 'Atualizando...' : 'Salvando...');
      
      const result = produtoId
        ? await ProdutosService.atualizar(produtoId, produto)
        : await ProdutosService.criar(produto);

      if (result.success) {
        this.mostrarMensagem('✅ Produto salvo com sucesso!', 'success');
        setTimeout(() => {
          window.location.href = '/admin/produtos.html';
        }, 1200);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('❌ Erro ao salvar produto', err);
      this.mostrarMensagem('Erro ao salvar produto', 'error');
    } finally {
      this.isSubmitting = false;
      this.esconderLoading();
    }
  },

  /**
   * Utilitários
   */
  formatarPreco(valor) {
    const num = Number(valor);
    return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
  },

  mostrarLoading(msg) {
    let el = document.getElementById('loadingOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'loadingOverlay';
      el.className = 'loading-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <div class="loading-spinner"></div>
      <p>${this.escapeHTML(msg)}</p>
    `;
    el.style.display = 'flex';
  },

  esconderLoading() {
    const el = document.getElementById('loadingOverlay');
    if (el) el.style.display = 'none';
  },

  mostrarMensagem(msg, tipo = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo}`;
    alert.innerHTML = msg;
    alert.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10000;
      min-width: 300px;
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
      alert.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  },

  escapeHTML(str = '') {
    return str.replace(/[&<>"']/g, m =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])
    );
  }
};

// Exportar
window.ProdutosUI = ProdutosUI;

// Inicializar
document.addEventListener('DOMContentLoaded', () => ProdutosUI.init());
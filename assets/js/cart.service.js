/**
 * Serviço de Carrinho de Compras
 * Gerencia produtos adicionados ao carrinho
 */

const CartService = {
  items: [],
  maxItems: 50,

  /**
   * Inicializa o carrinho
   */
  init() {
    this.loadFromStorage();
    this.updateCartUI();
    console.info('✅ CartService inicializado');
  },

  /**
   * Carrega carrinho do localStorage
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        this.items = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar carrinho:', error);
      this.items = [];
    }
  },

  /**
   * Salva carrinho no localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem('cart', JSON.stringify(this.items));
    } catch (error) {
      console.warn('⚠️ Erro ao salvar carrinho:', error);
    }
  },

  /**
   * Adiciona produto ao carrinho
   * @param {object} produto 
   * @param {string} tamanho 
   * @param {string} pagamento 
   * @param {number} preco 
   */
  addItem(produto, tamanho, pagamento, preco) {
    if (this.items.length >= this.maxItems) {
      alert(`Limite de ${this.maxItems} itens no carrinho atingido`);
      return false;
    }

    const item = {
      id: `${produto.id}-${tamanho}-${pagamento}`,
      produtoId: produto.id,
      nome: produto.nome,
      marca: produto.marca,
      imagem: produto.imagemUrl,
      tamanho: tamanho,
      pagamento: pagamento,
      preco: preco,
      quantidade: 1,
      timestamp: Date.now()
    };

    // Verificar se já existe item igual
    const existingIndex = this.items.findIndex(i => 
      i.produtoId === produto.id && 
      i.tamanho === tamanho && 
      i.pagamento === pagamento
    );

    if (existingIndex >= 0) {
      this.items[existingIndex].quantidade += 1;
    } else {
      this.items.push(item);
    }

    this.saveToStorage();
    this.updateCartUI();
    this.showNotification('Produto adicionado ao carrinho!');
    return true;
  },

  /**
   * Remove item do carrinho
   * @param {string} itemId 
   */
  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.saveToStorage();
    this.updateCartUI();
  },

  /**
   * Atualiza quantidade de um item
   * @param {string} itemId 
   * @param {number} quantidade 
   */
  updateQuantity(itemId, quantidade) {
    if (quantidade <= 0) {
      this.removeItem(itemId);
      return;
    }

    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.quantidade = Math.min(quantidade, 10); // Máximo 10 por item
      this.saveToStorage();
      this.updateCartUI();
    }
  },

  /**
   * Limpa o carrinho
   */
  clear() {
    this.items = [];
    this.saveToStorage();
    this.updateCartUI();
  },

  /**
   * Retorna total de itens
   * @returns {number}
   */
  getTotalItems() {
    return this.items.reduce((sum, item) => sum + item.quantidade, 0);
  },

  /**
   * Retorna valor total
   * @returns {number}
   */
  getTotalValue() {
    return this.items.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
  },

  /**
   * Atualiza UI do carrinho
   */
  updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const cartTotal = document.getElementById('cartTotal');
    
    const totalItems = this.getTotalItems();
    
    if (badge) {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    if (cartTotal) {
      const total = this.getTotalValue();
      cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    // Atualizar lista do carrinho se estiver aberto
    this.renderCartItems();
  },

  /**
   * Renderiza itens do carrinho
   */
  renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <p>Seu carrinho está vazio</p>
          <small>Adicione produtos para começar</small>
        </div>
      `;
      return;
    }

    container.innerHTML = this.items.map(item => `
      <div class="cart-item" data-item-id="${item.id}">
        <img src="${item.imagem}" alt="${item.nome}" class="cart-item-image">
        <div class="cart-item-info">
          <h4 class="cart-item-name">${item.nome}</h4>
          <p class="cart-item-details">${item.marca} • ${item.tamanho} • ${item.pagamento}</p>
          <div class="cart-item-controls">
            <button class="btn-quantity" onclick="CartService.updateQuantity('${item.id}', ${item.quantidade - 1})">-</button>
            <span class="cart-item-qty">${item.quantidade}</span>
            <button class="btn-quantity" onclick="CartService.updateQuantity('${item.id}', ${item.quantidade + 1})">+</button>
            <span class="cart-item-price">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <button class="btn-remove-item" onclick="CartService.removeItem('${item.id}')" aria-label="Remover">
          ✕
        </button>
      </div>
    `).join('');
  },

  /**
   * Mostra notificação
   * @param {string} message 
   */
  showNotification(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  /**
   * Gera mensagem do WhatsApp com todos os itens
   * @param {object} config 
   * @returns {string}
   */
  generateWhatsAppMessage(config) {
    if (this.items.length === 0) return '';

    let mensagem = config.mensagemPadrao || 'Olá! Gostaria de fazer um pedido:\n\n';
    
    mensagem += '*ITENS DO CARRINHO:*\n\n';
    
    this.items.forEach((item, index) => {
      mensagem += `${index + 1}. *${item.nome}*\n`;
      mensagem += `   Marca: ${item.marca}\n`;
      mensagem += `   Tamanho: ${item.tamanho}\n`;
      mensagem += `   Pagamento: ${item.pagamento}\n`;
      mensagem += `   Quantidade: ${item.quantidade}\n`;
      mensagem += `   Valor: R$ ${item.preco.toFixed(2).replace('.', ',')}\n`;
      mensagem += `   Subtotal: R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}\n\n`;
    });

    mensagem += `*TOTAL: R$ ${this.getTotalValue().toFixed(2).replace('.', ',')}*\n\n`;
    mensagem += 'Aguardo confirmação!';

    return mensagem;
  }
};

// Exportar
window.CartService = CartService;

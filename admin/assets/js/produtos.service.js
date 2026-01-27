/**
 * Serviço de Produtos V3
 * Gerencia CRUD com tipos dinâmicos
 */

const ProdutosService = {
  collection: 'produtos',

  // ☁️ Cloudinary
  cloudinary: {
    cloudName: AppConfig.cloudinary.cloudName,
    uploadPreset: AppConfig.cloudinary.uploadPreset
  },

  /**
   * Lista todos os produtos
   * @returns {Promise<Array>}
   */
  async listar() {
    try {
      console.info('📦 Buscando produtos...');
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('nome')
        .get();

      const produtos = [];
      snapshot.forEach(doc => {
        produtos.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${produtos.length} produtos encontrados`);
      return produtos;
    } catch (error) {
      console.error('❌ Erro ao listar produtos:', error);
      return [];
    }
  },

  /**
   * Busca produto por ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar produto:', error);
      return null;
    }
  },

  /**
   * Cria novo produto
   * @param {Object} produto 
   * @returns {Promise<Object>}
   */
  async criar(produto) {
    try {
      console.info('➕ Criando produto...');

      // Sanitizar dados
      const novoProduto = {
        nome: CryptoService.sanitizeInput(produto.nome),
        marca: CryptoService.sanitizeInput(produto.marca),
        categoria: CryptoService.sanitizeInput(produto.categoria),
        tipoProdutoId: produto.tipoProdutoId,
        tipoProdutoNome: produto.tipoProdutoNome,
        precoPix: parseFloat(produto.precoPix),
        precoCartao: parseFloat(produto.precoCartao),
        tamanhos: produto.tamanhos || [],
        imagemUrl: produto.imagemUrl,
        ativo: produto.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novoProduto);
      console.info('✅ Produto criado:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar produto:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualiza produto
   * @param {string} id 
   * @param {Object} dados 
   * @returns {Promise<Object>}
   */
  async atualizar(id, dados) {
    try {
      console.info('✏️ Atualizando produto:', id);

      const dadosAtualizados = {
        nome: CryptoService.sanitizeInput(dados.nome),
        marca: CryptoService.sanitizeInput(dados.marca),
        categoria: CryptoService.sanitizeInput(dados.categoria),
        tipoProdutoId: dados.tipoProdutoId,
        tipoProdutoNome: dados.tipoProdutoNome,
        precoPix: parseFloat(dados.precoPix),
        precoCartao: parseFloat(dados.precoCartao),
        tamanhos: dados.tamanhos || [],
        imagemUrl: dados.imagemUrl,
        ativo: dados.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);
      console.info('✅ Produto atualizado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deleta produto
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async deletar(id) {
    try {
      console.info('🗑️ Deletando produto:', id);
      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Produto deletado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar produto:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upload de imagem para Cloudinary
   * @param {File} file 
   * @returns {Promise<string>}
   */
  async uploadImagem(file) {
    try {
      console.info('📤 Upload de imagem...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.cloudinary.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudinary.cloudName}/image/upload`,
        { 
          method: 'POST', 
          body: formData 
        }
      );

      const data = await response.json();
      
      if (!data.secure_url) {
        throw new Error('URL não retornada pelo Cloudinary');
      }

      console.info('✅ Imagem enviada');
      return data.secure_url;
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      throw error;
    }
  },

  /**
   * Valida produto
   * @param {Object} produto 
   * @returns {Object}
   */
  validar(produto) {
    const erros = [];

    if (!produto.nome?.trim()) {
      erros.push('Nome é obrigatório');
    }

    if (!produto.marca?.trim()) {
      erros.push('Marca é obrigatória');
    }

    if (!produto.tipoProdutoId) {
      erros.push('Tipo de produto é obrigatório');
    }

    if (!produto.precoPix || produto.precoPix <= 0) {
      erros.push('Preço PIX inválido');
    }

    if (!produto.precoCartao || produto.precoCartao <= 0) {
      erros.push('Preço Cartão inválido');
    }

    if (!Array.isArray(produto.tamanhos) || produto.tamanhos.length === 0) {
      erros.push('Selecione pelo menos um tamanho');
    }

    if (!produto.imagemUrl) {
      erros.push('Imagem é obrigatória');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  /**
   * Busca produtos por tipo
   * @param {string} tipoId 
   * @returns {Promise<Array>}
   */
  async buscarPorTipo(tipoId) {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .where('tipoProdutoId', '==', tipoId)
        .where('ativo', '==', true)
        .get();

      const produtos = [];
      snapshot.forEach(doc => {
        produtos.push({ id: doc.id, ...doc.data() });
      });

      return produtos;
    } catch (error) {
      console.error('❌ Erro ao buscar por tipo:', error);
      return [];
    }
  },

  /**
   * Busca produtos por categoria
   * @param {string} categoria 
   * @returns {Promise<Array>}
   */
  async buscarPorCategoria(categoria) {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .where('categoria', '==', categoria)
        .where('ativo', '==', true)
        .get();

      const produtos = [];
      snapshot.forEach(doc => {
        produtos.push({ id: doc.id, ...doc.data() });
      });

      return produtos;
    } catch (error) {
      console.error('❌ Erro ao buscar por categoria:', error);
      return [];
    }
  },

  /**
   * Estatísticas de produtos
   * @returns {Promise<Object>}
   */
  async estatisticas() {
    try {
      const produtos = await this.listar();
      
      const stats = {
        total: produtos.length,
        ativos: produtos.filter(p => p.ativo).length,
        inativos: produtos.filter(p => !p.ativo).length,
        porTipo: {},
        porMarca: {},
        porCategoria: {}
      };

      produtos.forEach(p => {
        // Por tipo
        if (p.tipoProdutoNome) {
          stats.porTipo[p.tipoProdutoNome] = (stats.porTipo[p.tipoProdutoNome] || 0) + 1;
        }

        // Por marca
        if (p.marca) {
          stats.porMarca[p.marca] = (stats.porMarca[p.marca] || 0) + 1;
        }

        // Por categoria
        if (p.categoria) {
          stats.porCategoria[p.categoria] = (stats.porCategoria[p.categoria] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return {
        total: 0,
        ativos: 0,
        inativos: 0,
        porTipo: {},
        porMarca: {},
        porCategoria: {}
      };
    }
  }
};

// Exportar
window.ProdutosService = ProdutosService;
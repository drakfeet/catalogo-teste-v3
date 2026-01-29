/**
 * Serviço de Marcas
 * Gerencia marcas de produtos
 */

const MarcasService = {
  collection: 'marcas',

  /**
   * Listar todas as marcas
   * @returns {Promise<Array>}
   */
  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('nome')
        .get();

      const marcas = [];
      snapshot.forEach(doc => {
        marcas.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${marcas.length} marcas encontradas`);
      return marcas;
    } catch (error) {
      console.error('❌ Erro ao listar marcas:', error);
      return [];
    }
  },

  /**
   * Buscar marca por ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar marca:', error);
      return null;
    }
  },

  /**
   * Criar nova marca
   * @param {Object} marca 
   * @returns {Promise<Object>}
   */
  async criar(marca) {
    try {
      const novaMarca = {
        nome: CryptoService.sanitizeInput(marca.nome),
        slug: this.gerarSlug(marca.nome),
        logoUrl: marca.logoUrl || '',
        descricao: CryptoService.sanitizeInput(marca.descricao || ''),
        ativo: marca.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novaMarca);
      console.info('✅ Marca criada:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar marca:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualizar marca
   * @param {string} id 
   * @param {Object} dados 
   * @returns {Promise<Object>}
   */
  async atualizar(id, dados) {
    try {
      const dadosAtualizados = {
        nome: CryptoService.sanitizeInput(dados.nome),
        slug: this.gerarSlug(dados.nome),
        logoUrl: dados.logoUrl || '',
        descricao: CryptoService.sanitizeInput(dados.descricao || ''),
        ativo: dados.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);
      console.info('✅ Marca atualizada');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar marca:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deletar marca
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async deletar(id) {
    try {
      // Verificar se há produtos usando esta marca
      const produtosSnapshot = await firebaseDb
        .collection('produtos')
        .where('marca', '==', id)
        .limit(1)
        .get();

      if (!produtosSnapshot.empty) {
        return {
          success: false,
          error: 'Não é possível deletar. Existem produtos desta marca.'
        };
      }

      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Marca deletada');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar marca:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Contar produtos por marca
   * @param {string} marcaId 
   * @returns {Promise<number>}
   */
  async contarProdutos(marcaId) {
    try {
      const snapshot = await firebaseDb
        .collection('produtos')
        .where('marca', '==', marcaId)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('❌ Erro ao contar produtos:', error);
      return 0;
    }
  },

  /**
   * Gerar slug a partir do nome
   * @param {string} nome 
   * @returns {string}
   */
  gerarSlug(nome) {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  },

  /**
   * Validar marca
   * @param {Object} marca 
   * @returns {Object}
   */
  validar(marca) {
    const erros = [];

    if (!marca.nome || marca.nome.trim() === '') {
      erros.push('Nome da marca é obrigatório');
    }

    if (marca.nome && marca.nome.length > 100) {
      erros.push('Nome muito longo (máx. 100 caracteres)');
    }

    if (marca.descricao && marca.descricao.length > 500) {
      erros.push('Descrição muito longa (máx. 500 caracteres)');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }
};

// Exportar
window.MarcasService = MarcasService;
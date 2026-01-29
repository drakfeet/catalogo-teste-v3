/**
 * Serviço de Categorias
 * Gerencia categorias do menu do catálogo
 */

const CategoriasService = {
  collection: 'categorias',

  /**
   * Listar todas as categorias
   * @returns {Promise<Array>}
   */
  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('ordem')
        .get();

      const categorias = [];
      snapshot.forEach(doc => {
        categorias.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${categorias.length} categorias encontradas`);
      return categorias;
    } catch (error) {
      console.error('❌ Erro ao listar categorias:', error);
      return [];
    }
  },

  /**
   * Buscar categoria por ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar categoria:', error);
      return null;
    }
  },

  /**
   * Criar nova categoria
   * @param {Object} categoria 
   * @returns {Promise<Object>}
   */
  async criar(categoria) {
    try {
      const novaCategoria = {
        nome: CryptoService.sanitizeInput(categoria.nome),
        slug: this.gerarSlug(categoria.nome),
        ordem: parseInt(categoria.ordem) || 0,
        ativo: categoria.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novaCategoria);
      console.info('✅ Categoria criada:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar categoria:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualizar categoria
   * @param {string} id 
   * @param {Object} dados 
   * @returns {Promise<Object>}
   */
  async atualizar(id, dados) {
    try {
      const dadosAtualizados = {
        nome: CryptoService.sanitizeInput(dados.nome),
        slug: this.gerarSlug(dados.nome),
        ordem: parseInt(dados.ordem) || 0,
        ativo: dados.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);
      console.info('✅ Categoria atualizada');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar categoria:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deletar categoria
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async deletar(id) {
    try {
      // Verificar se há produtos usando esta categoria
      const produtosSnapshot = await firebaseDb
        .collection('produtos')
        .where('categoria', '==', id)
        .limit(1)
        .get();

      if (!produtosSnapshot.empty) {
        return {
          success: false,
          error: 'Não é possível deletar. Existem produtos nesta categoria.'
        };
      }

      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Categoria deletada');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar categoria:', error);
      return { success: false, error: error.message };
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
   * Validar categoria
   * @param {Object} categoria 
   * @returns {Object}
   */
  validar(categoria) {
    const erros = [];

    if (!categoria.nome || categoria.nome.trim() === '') {
      erros.push('Nome da categoria é obrigatório');
    }

    if (categoria.nome && categoria.nome.length > 100) {
      erros.push('Nome muito longo (máx. 100 caracteres)');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  /**
   * Reordenar categorias
   * @param {Array} categorias - Array de objetos {id, ordem}
   * @returns {Promise<Object>}
   */
  async reordenar(categorias) {
    try {
      const batch = firebaseDb.batch();

      categorias.forEach(({ id, ordem }) => {
        const ref = firebaseDb.collection(this.collection).doc(id);
        batch.update(ref, { ordem: parseInt(ordem) });
      });

      await batch.commit();
      console.info('✅ Categorias reordenadas');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao reordenar categorias:', error);
      return { success: false, error: error.message };
    }
  }
};

// Exportar
window.CategoriasService = CategoriasService;
/**
 * Serviço de Tipos de Produto
 * Gerencia tipos dinâmicos (tênis, camisa, etc) e suas propriedades
 */

const TiposProdutoService = {
  collection: 'tipos_produto',

  /**
   * Busca todos os tipos de produto
   * @returns {Promise<Array>}
   */
  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('nome')
        .get();

      const tipos = [];
      snapshot.forEach(doc => {
        tipos.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${tipos.length} tipos de produto encontrados`);
      return tipos;
    } catch (error) {
      console.error('❌ Erro ao listar tipos:', error);
      return this.getTiposPadrao();
    }
  },

  /**
   * Busca tipo por ID
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar tipo:', error);
      return null;
    }
  },

  /**
   * Cria novo tipo de produto
   * @param {Object} tipo 
   * @returns {Promise<Object>}
   */
  async criar(tipo) {
    try {
      const novoTipo = {
        nome: CryptoService.sanitizeInput(tipo.nome),
        nomePropriedade: CryptoService.sanitizeInput(tipo.nomePropriedade),
        opcoesTamanho: tipo.opcoesTamanho || [],
        ativo: tipo.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novoTipo);
      console.info('✅ Tipo criado:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar tipo:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualiza tipo de produto
   * @param {string} id 
   * @param {Object} dados 
   * @returns {Promise<Object>}
   */
  async atualizar(id, dados) {
    try {
      const dadosAtualizados = {
        nome: CryptoService.sanitizeInput(dados.nome),
        nomePropriedade: CryptoService.sanitizeInput(dados.nomePropriedade),
        opcoesTamanho: dados.opcoesTamanho || [],
        ativo: dados.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);
      console.info('✅ Tipo atualizado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar tipo:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deleta tipo de produto
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async deletar(id) {
    try {
      // Verificar se há produtos usando este tipo
      const produtosSnapshot = await firebaseDb
        .collection('produtos')
        .where('tipoProdutoId', '==', id)
        .limit(1)
        .get();

      if (!produtosSnapshot.empty) {
        return {
          success: false,
          error: 'Não é possível deletar. Existem produtos usando este tipo.'
        };
      }

      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Tipo deletado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar tipo:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Busca opções de tamanho para um tipo específico
   * @param {string} tipoId 
   * @returns {Promise<Array>}
   */
  async buscarOpcoesTamanho(tipoId) {
    try {
      const tipo = await this.buscarPorId(tipoId);
      return tipo ? tipo.opcoesTamanho : [];
    } catch (error) {
      console.error('❌ Erro ao buscar opções:', error);
      return [];
    }
  },

  /**
   * Valida tipo de produto
   * @param {Object} tipo 
   * @returns {Object}
   */
  validar(tipo) {
    const erros = [];

    if (!tipo.nome || tipo.nome.trim() === '') {
      erros.push('Nome do tipo é obrigatório');
    }

    if (!tipo.nomePropriedade || tipo.nomePropriedade.trim() === '') {
      erros.push('Nome da propriedade é obrigatório');
    }

    if (!Array.isArray(tipo.opcoesTamanho) || tipo.opcoesTamanho.length === 0) {
      erros.push('Adicione pelo menos uma opção de tamanho');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  /**
   * Tipos padrão (fallback)
   * @returns {Array}
   */
  getTiposPadrao() {
    return [
      {
        id: 'tenis',
        nome: 'Tênis',
        nomePropriedade: 'Numeração',
        opcoesTamanho: Array.from({ length: 10 }, (_, i) => String(34 + i)),
        ativo: true
      },
      {
        id: 'camisa',
        nome: 'Camisa',
        nomePropriedade: 'Tamanho',
        opcoesTamanho: ['P', 'M', 'G', 'GG', 'XG'],
        ativo: true
      },
      {
        id: 'calca',
        nome: 'Calça',
        nomePropriedade: 'Numeração',
        opcoesTamanho: Array.from({ length: 11 }, (_, i) => String(38 + i)),
        ativo: true
      },
      {
        id: 'bermuda',
        nome: 'Bermuda',
        nomePropriedade: 'Tamanho',
        opcoesTamanho: ['P', 'M', 'G', 'GG'],
        ativo: true
      }
    ];
  },

  /**
   * Migra tipos padrão para o Firestore (executar uma vez)
   */
  async migrarTiposPadrao() {
    try {
      const tiposPadrao = this.getTiposPadrao();
      
      for (const tipo of tiposPadrao) {
        const { id, ...dados } = tipo;
        await firebaseDb.collection(this.collection).doc(id).set({
          ...dados,
          criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
          atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      console.info('✅ Tipos padrão migrados');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao migrar tipos:', error);
      return { success: false, error: error.message };
    }
  }
};

// Exportar
window.TiposProdutoService = TiposProdutoService;
/**
 * UI de Configurações
 * Gerencia abas e formulário
 */

document.addEventListener('DOMContentLoaded', () => {

  // ⚠️ Se não estiver na página de configurações, não executa nada
  const configForm = document.getElementById('configForm');
  if (!configForm) return;

  /* =========================
     SISTEMA DE ABAS
  ========================== */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      // Atualizar botões
      document.querySelectorAll('.tab-btn')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Atualizar painéis
      document.querySelectorAll('.tab-pane')
        .forEach(pane => pane.classList.remove('active'));

      const painel = document.querySelector(`[data-pane="${tab}"]`);
      if (painel) painel.classList.add('active');
    });
  });

  /* =========================
     CARREGAR CONFIGURAÇÕES
  ========================== */
  async function carregarConfiguracoes() {
    ProdutosUI.mostrarLoading('Carregando configurações...');

    const config = await ConfigService.buscar();

    ProdutosUI.esconderLoading();

    // Aba Geral
    document.getElementById('nomeLoja').value = config.nomeLoja || '';
    document.getElementById('whatsapp').value = config.whatsapp || '';
    document.getElementById('taxaMotoboy').value = config.taxaMotoboy || 8.00;

    // Aba Visual
    document.getElementById('logoUrl').value = config.logoUrl || '';
    document.getElementById('avisoTexto').value = config.avisoTexto || '';
    document.getElementById('avisoBotaoTexto').value =
      config.avisoBotaoTexto || 'Visitar Loja Online';
    document.getElementById('avisoBotaoUrl').value = config.avisoBotaoUrl || '';

    if (config.logoUrl) {
      mostrarPreviewLogo(config.logoUrl);
    }

    // Aba Produtos
    if (Array.isArray(config.menuCategorias)) {
      document.getElementById('menuCategorias').value =
        config.menuCategorias.join('\n');
    }

    if (Array.isArray(config.marcasCadastradas)) {
      document.getElementById('marcasCadastradas').value =
        config.marcasCadastradas.join('\n');
    }

    if (Array.isArray(config.categoriasCadastradas)) {
      document.getElementById('categoriasCadastradas').value =
        config.categoriasCadastradas.join('\n');
    }

    // Aba Pagamento
    document.getElementById('descontoPix').value = config.descontoPix || 10;
    document.getElementById('parcelasSemJuros').value =
      config.parcelasSemJuros || 3;

    // Aba Comunicação
    document.getElementById('mensagemPadrao').value =
      config.mensagemPadrao || '';
    document.getElementById('whatsappFlutuante').checked =
      config.whatsappFlutuante !== false;
    document.getElementById('whatsappMensagemFlutuante').value =
      config.whatsappMensagemFlutuante || 'Precisa de Ajuda?';

    // Aba Tracking
    document.getElementById('pixelFacebook').value =
      config.pixelFacebook || '';
    document.getElementById('gtmGoogle').value = config.gtmGoogle || '';
    document.getElementById('googleAnalytics').value =
      config.googleAnalytics || '';
  }

  /* =========================
     UPLOAD DE LOGO
  ========================== */
  const logoUpload = document.getElementById('logoUpload');
  if (logoUpload) {
    logoUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        ProdutosUI.mostrarMensagem('Selecione apenas imagens', 'error');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        ProdutosUI.mostrarMensagem(
          'Imagem muito grande. Máximo 2MB',
          'error'
        );
        return;
      }

      try {
        ProdutosUI.mostrarLoading('Enviando logo...');
        const url = await ProdutosService.uploadImagem(file);
        ProdutosUI.esconderLoading();

        document.getElementById('logoUrl').value = url;
        mostrarPreviewLogo(url);

        ProdutosUI.mostrarMensagem(
          'Logo enviada com sucesso!',
          'success'
        );
      } catch (error) {
        ProdutosUI.esconderLoading();
        ProdutosUI.mostrarMensagem(
          'Erro ao enviar logo',
          'error'
        );
      }
    });
  }

  function mostrarPreviewLogo(url) {
    const preview = document.getElementById('logoPreview');
    if (!preview) return;

    preview.innerHTML = `<img src="${url}" alt="Logo">`;
    preview.style.display = 'block';
  }

  /* =========================
     SALVAR CONFIGURAÇÕES
  ========================== */
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const processarLista = (texto) =>
      texto.split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

    const config = {
      nomeLoja: document.getElementById('nomeLoja').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      taxaMotoboy:
        parseFloat(document.getElementById('taxaMotoboy').value) || 0,

      logoUrl: document.getElementById('logoUrl').value.trim(),
      avisoTexto: document.getElementById('avisoTexto').value.trim(),
      avisoBotaoTexto:
        document.getElementById('avisoBotaoTexto').value.trim(),
      avisoBotaoUrl:
        document.getElementById('avisoBotaoUrl').value.trim(),

      menuCategorias:
        processarLista(document.getElementById('menuCategorias').value),
      marcasCadastradas:
        processarLista(document.getElementById('marcasCadastradas').value),
      categoriasCadastradas:
        processarLista(document.getElementById('categoriasCadastradas').value),

      descontoPix:
        parseInt(document.getElementById('descontoPix').value) || 10,
      parcelasSemJuros:
        parseInt(document.getElementById('parcelasSemJuros').value) || 1,

      mensagemPadrao:
        document.getElementById('mensagemPadrao').value.trim(),
      whatsappFlutuante:
        document.getElementById('whatsappFlutuante').checked,
      whatsappMensagemFlutuante:
        document.getElementById('whatsappMensagemFlutuante').value.trim(),

      pixelFacebook:
        document.getElementById('pixelFacebook').value.trim(),
      gtmGoogle:
        document.getElementById('gtmGoogle').value.trim(),
      googleAnalytics:
        document.getElementById('googleAnalytics').value.trim()
    };

    if (!ConfigService.validarWhatsApp(config.whatsapp)) {
      ProdutosUI.mostrarMensagem(
        'Número de WhatsApp inválido',
        'error'
      );
      return;
    }

    ProdutosUI.mostrarLoading('Salvando configurações...');
    const result = await ConfigService.salvar(config);
    ProdutosUI.esconderLoading();

    ProdutosUI.mostrarMensagem(
      result.success
        ? '✅ Configurações salvas com sucesso!'
        : '❌ Erro ao salvar configurações',
      result.success ? 'success' : 'error'
    );
  });

  // 🚀 Inicialização
  carregarConfiguracoes();
});

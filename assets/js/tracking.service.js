/**
 * Serviço de Tracking
 * Gerencia Pixel Facebook e Google Tag Manager
 */

const TrackingService = {
  config: null,
  facebookInitialized: false,
  gtmInitialized: false,
  gaInitialized: false,

  /**
   * Inicializa tracking com base nas configurações
   * @param {object} config 
   */
  init(config) {
    this.config = config;

    // Inicializar Facebook Pixel
    if (config.pixelFacebook && config.pixelFacebook.trim() !== '') {
      this.initFacebookPixel(config.pixelFacebook.trim());
    }

    // Inicializar Google Tag Manager
    if (config.gtmGoogle && config.gtmGoogle.trim() !== '') {
      this.initGTM(config.gtmGoogle.trim());
    }

    // Inicializar Google Analytics
    if (config.googleAnalytics && config.googleAnalytics.trim() !== '') {
      this.initGoogleAnalytics(config.googleAnalytics.trim());
    }
  },

  /**
   * Inicializa Facebook Pixel
   * @param {string} pixelId 
   */
  initFacebookPixel(pixelId) {
    try {
      // Criar função fbq
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');

      fbq('init', pixelId);
      fbq('track', 'PageView');

      this.facebookInitialized = true;
      console.info('✅ Facebook Pixel inicializado:', pixelId);
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar Facebook Pixel:', error);
    }
  },

  /**
   * Inicializa Google Tag Manager
   * @param {string} gtmId 
   */
  initGTM(gtmId) {
    try {
      // GTM script
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer', gtmId);

      this.gtmInitialized = true;
      console.info('✅ Google Tag Manager inicializado:', gtmId);
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar GTM:', error);
    }
  },

  /**
   * Inicializa Google Analytics 4
   * @param {string} gaId 
   */
  initGoogleAnalytics(gaId) {
    try {
      // GA4 script
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script1);

      // GA4 config
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', gaId);

      this.gaInitialized = true;
      console.info('✅ Google Analytics inicializado:', gaId);
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar Google Analytics:', error);
    }
  },

  /**
   * Envia evento de contato para Facebook
   * @param {object} dados 
   */
  trackFacebookContact(dados) {
    if (!this.facebookInitialized || typeof fbq === 'undefined') return;

    try {
      fbq('track', 'Contact', {
        content_name: dados.produtoNome,
        content_category: dados.marca,
        value: dados.valor,
        currency: 'BRL'
      });
      console.info('✅ Evento Contact enviado ao Facebook');
    } catch (error) {
      console.warn('⚠️ Erro ao enviar evento para Facebook:', error);
    }
  },

  /**
   * Envia evento para Google Tag Manager
   * @param {string} eventName 
   * @param {object} dados 
   */
  trackGTMEvent(eventName, dados) {
    if (!this.gtmInitialized || typeof dataLayer === 'undefined') return;

    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        ...dados
      });
      console.info('✅ Evento enviado ao GTM:', eventName);
    } catch (error) {
      console.warn('⚠️ Erro ao enviar evento para GTM:', error);
    }
  },

  /**
   * Rastreia clique no WhatsApp (ambos os serviços)
   * @param {object} dados 
   */
  trackWhatsAppClick(dados) {
    // Facebook Pixel
    this.trackFacebookContact({
      produtoNome: dados.nome,
      marca: dados.marca,
      valor: dados.valor
    });

    // Google Tag Manager
    this.trackGTMEvent('whatsapp_contact', {
      product_name: dados.nome,
      product_brand: dados.marca,
      product_size: dados.tamanho,
      payment_method: dados.pagamento,
      value: dados.valor,
      currency: 'BRL'
    });

    // Google Analytics
    if (this.gaInitialized && typeof gtag !== 'undefined') {
      try {
        gtag('event', 'contact', {
          event_category: 'WhatsApp',
          event_label: dados.nome,
          value: dados.valor
        });
        console.info('✅ Evento enviado ao Google Analytics');
      } catch (error) {
        console.warn('⚠️ Erro ao enviar evento para GA:', error);
      }
    }
  }
};

// Exportar
window.TrackingService = TrackingService;
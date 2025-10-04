// sw.js - Service Worker para Café Valdore
const CACHE_VERSION = 'v1.2';
const CACHE_NAME = `cafe-valdore-${CACHE_VERSION}`;

// Recursos para cachear (AGREGA MÁS SEGÚN TUS ARCHIVOS)
const ASSETS_TO_CACHE = [
  // CSS
  '/styles-unificado.css',
  
  // JavaScript
  '/main.js',
  '/firebaseconfig.js', 
  '/chat.js',
  
  // Imágenes WebP
  '/bourbon.webp',
  '/caturra.webp',
  '/logo.webp',
  '/promocion.webp',
  '/superpromocion.webp',
  '/fondocafe.webp',
  
  // Páginas HTML principales
  '/index.html',
  '/contacto.html',
  '/historia.html',
  '/pedidos.html',
  '/auth.html',
  
  // Favicon y recursos esenciales
  '/favicon.ico'
];

// INSTALACIÓN - Cachear recursos críticos
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker instalándose...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cacheando recursos esenciales');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ Todos los recursos cacheados');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch((error) => {
        console.error('❌ Error cacheando:', error);
      })
  );
});

// ACTIVACIÓN - Limpiar caches viejos
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker activado');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Cache limpio, reclamando clientes');
      return self.clients.claim();
    })
  );
});

// FETCH - Interceptar requests
self.addEventListener('fetch', (event) => {
  // Solo manejar requests GET
  if (event.request.method !== 'GET') return;
  
  // Excluir Firebase y APIs externas del cache
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 1. Si está en cache, devolver del cache
        if (cachedResponse) {
          console.log('📨 Sirviendo desde cache:', event.request.url);
          return cachedResponse;
        }
        
        // 2. Si no está en cache, hacer fetch y cachear
        return fetch(event.request).then((response) => {
          // Solo cachear responses exitosas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clonar la response para cachear
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              console.log('💾 Cacheando nuevo recurso:', event.request.url);
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
      .catch((error) => {
        console.error('❌ Error en fetch:', error);
        // Podrías servir una página offline aquí
      })
  );
});

// Mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
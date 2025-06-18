// js/script.js

document.addEventListener('DOMContentLoaded', function() {
  // --- Lógica do Contador Regressivo (Apenas para a página index.html) ---
  // Define a data-alvo para o countdown (casamento).
  const countdownDate = new Date('December 31, 2025 18:00:00').getTime(); 

  // O elemento 'countdown-timer' existe apenas na index.html.
  // Esta verificação garante que o setInterval só seja executado se o contador estiver presente.
  if (document.getElementById('countdown-timer')) {
      const countdownInterval = setInterval(function() {
          const now = new Date().getTime();
          const distance = countdownDate - now;

          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          const daysEl = document.getElementById('days');
          const hoursEl = document.getElementById('hours');
          const minutesEl = document.getElementById('minutes');
          const secondsEl = document.getElementById('seconds');

          if (daysEl) daysEl.innerHTML = String(days).padStart(2, '0');
          if (hoursEl) hoursEl.innerHTML = String(hours).padStart(2, '0');
          if (minutesEl) minutesEl.innerHTML = String(minutes).padStart(2, '0');
          if (secondsEl) secondsEl.innerHTML = String(seconds).padStart(2, '0');

          if (distance < 0) {
              clearInterval(countdownInterval);
              const countdownTimerEl = document.getElementById('countdown-timer');
              if (countdownTimerEl) countdownTimerEl.innerHTML = '<p class="display-4">É HOJE!</p>';
          }
      }, 1000);
  }

  // --- Lógica de Filtro e Pesquisa para a Lista de Presentes (Apenas na página presentes.html) ---
  if (window.location.pathname.includes('presentes.html')) {
      const filterButtons = document.querySelectorAll('[data-filter]');
      const categorySections = document.querySelectorAll('.category-section');
      const searchInput = document.getElementById('search-input');
      const clearSearchButton = document.getElementById('clear-search');

      let currentFilter = 'all'; 

      /**
       * Aplica os filtros de categoria e pesquisa nos presentes.
       * Chamada ao clicar nos botões de filtro ou ao digitar na pesquisa.
       */
      function applyFiltersAndSearch() {
          const searchTerm = searchInput.value.toLowerCase().trim();

          categorySections.forEach(section => {
              const sectionCategory = section.id.replace('-section', '');

              // 1. Filtragem por Categoria
              if (currentFilter === 'all' || sectionCategory === currentFilter) {
                  section.style.display = 'block';

                  // 2. Filtragem por Pesquisa (dentro da seção visível)
                  const itemsInSection = section.querySelectorAll('.present-item');
                  let anyItemVisibleInSection = false; 

                  itemsInSection.forEach(item => {
                      const title = item.querySelector('.card-title')?.textContent.toLowerCase() || '';
                      const description = item.querySelector('.card-text')?.textContent.toLowerCase() || '';

                      if (searchTerm === '' || title.includes(searchTerm) || description.includes(searchTerm)) {
                          item.style.display = 'block';
                          anyItemVisibleInSection = true;
                      } else {
                          item.style.display = 'none';
                      }
                  });

                  // 3. Esconde a seção se nenhum item corresponder à pesquisa
                  if (!anyItemVisibleInSection && searchTerm !== '') {
                      section.style.display = 'none';
                  }

              } else {
                  section.style.display = 'none';
              }
          });
      }

      // --- Event Listeners para Filtro e Pesquisa ---
      filterButtons.forEach(button => {
          button.addEventListener('click', function() {
              filterButtons.forEach(btn => btn.classList.remove('active'));
              this.classList.add('active');
              currentFilter = this.getAttribute('data-filter');
              applyFiltersAndSearch();
          });
      });

      searchInput.addEventListener('keyup', applyFiltersAndSearch);

      clearSearchButton.addEventListener('click', function() {
          searchInput.value = '';
          applyFiltersAndSearch();
      });

      // Inicialização: Simula clique no botão "Todas as Categorias" ao carregar a página
      const allCategoryButton = document.querySelector('[data-filter="all"]');
      if (allCategoryButton) {
          allCategoryButton.click(); 
      }
  }

  // --- Lógica para Efeito de Fade entre Páginas ---

  const overlay = document.getElementById('pageTransitionOverlay');

  // 1. Lógica de Fade-In ao Carregar a Página
  // Garante que o overlay esteja opaco no início da renderização (graças ao CSS)
  // e inicia o fade-in assim que o DOM está pronto.
  
  // Usamos requestAnimationFrame para garantir que a transição comece
  // após o navegador ter tido tempo de pintar o estado inicial (opacidade 1).
  requestAnimationFrame(() => {
      overlay.classList.add('is-loaded'); // Inicia o fade-in (opacidade 0)
  });
  
  // Oculta o elemento do fluxo DOM depois que a transição de fade-in termina.
  // Isso é importante para que o overlay não interfira com cliques.
  overlay.addEventListener('transitionend', function() {
      if (overlay.classList.contains('is-loaded') && overlay.style.opacity === '0') {
          overlay.style.visibility = 'hidden';
          overlay.classList.remove('is-loaded'); // Remove a classe para resetar
      }
  });

  // 2. Lógica de Fade-Out ao Clicar em Links Internos
  document.querySelectorAll('a[href^="."], a[href^="/"]').forEach(link => {
      if (link.hash && link.pathname === window.location.pathname) { return; }
      if (link.target === '_blank' || link.getAttribute('data-bs-toggle') === 'modal') { return; }

      link.addEventListener('click', function(event) {
          event.preventDefault();

          const targetUrl = this.href;

          // Inicia o fade-out do overlay
          overlay.classList.add('is-leaving'); // Torna o overlay opaco para cobrir a saída

          // Redireciona após a duração da transição
          setTimeout(() => {
              window.location.href = targetUrl;
          }, 800); // Deve corresponder à duração da transição no CSS
      });
  });
});
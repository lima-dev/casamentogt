// js/script.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Lógica do Contador Regressivo (Apenas para a página index.html) ---
    const countdownDate = new Date('December 31, 2025 18:00:00').getTime(); 

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

    // --- Lógica de Lista de Presentes com Firebase (Apenas na página presentes.html) ---
    if (window.location.pathname.includes('presentes.html')) {
        const filterButtons = document.querySelectorAll('[data-filter]');
        const categorySections = document.querySelectorAll('.category-section');
        const searchInput = document.getElementById('search-input');
        const clearSearchButton = document.getElementById('clear-search');
        const confirmacaoModal = new bootstrap.Modal(document.getElementById('confirmacaoModal'));
        const btnConfirmarCompra = document.getElementById('btnConfirmarCompra');

        let currentFilter = 'all'; 
        let lastClickedGift = null;
        
        const database = firebase.database();
        const giftsRef = database.ref('gifts');

        /**
         * Cria e retorna o HTML de um card de presente.
         */
        function createGiftCardHtml(giftId, giftData) {
            const isPurchased = giftData.status === 'comprado';
            const buttonText = isPurchased ? 'Presente Comprado' : 'Ver na Loja';
            const buttonDisabled = isPurchased ? 'disabled' : '';
            const purchasedClass = isPurchased ? 'purchased' : '';
            
            // Verifica se o presente tem uma imagem
            const imageHtml = giftData.image 
                ? `<img src="${giftData.image}" class="card-img-top" alt="${giftData.title}">` 
                : '';

            return `
                <div class="col present-item ${purchasedClass}" data-gift-id="${giftId}" data-category="${giftData.category}">
                    <div class="card h-100 shadow-sm">
                        ${imageHtml}
                        <div class="card-body">
                            <div>
                                <h5 class="card-title">${giftData.title}</h5>
                                <p class="card-text">${giftData.description}</p>
                            </div>
                            <a href="${giftData.link}" target="_blank" class="btn btn-primary-alt mt-auto ${buttonDisabled}" ${buttonDisabled} data-gift-id="${giftId}">
                                ${buttonText}
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Renderiza todos os presentes na página, baseando-se nos dados do Firebase.
         */
        function renderGifts(giftsData) {
            // Limpa todas as seções dinâmicas
            document.querySelectorAll('.row[id$="-list"]').forEach(list => {
                if(list.parentElement.id !== 'lua-de-mel-section') {
                    list.innerHTML = '';
                }
            });

            for (const giftId in giftsData) {
                const gift = giftsData[giftId];
                // Ignora o presente se a categoria for 'lua-de-mel' (já está no HTML)
                if (gift.category === 'lua-de-mel') {
                    continue;
                }

                const listContainerId = `${gift.category}-list`;
                const listContainer = document.getElementById(listContainerId);
                
                if (listContainer) {
                    const giftHtml = createGiftCardHtml(giftId, gift);
                    listContainer.innerHTML += giftHtml;
                }
            }

            // Atacha os event listeners nos novos botões
            attachEventListeners();
        }

        /**
         * Anexa os event listeners aos botões dos presentes.
         */
        function attachEventListeners() {
            const giftLinks = document.querySelectorAll('.present-item a.btn');
            giftLinks.forEach(link => {
                if (!link.dataset.bsToggle) { 
                    link.addEventListener('click', function(event) {
                        lastClickedGift = this.getAttribute('data-gift-id');
                        
                        setTimeout(() => {
                            confirmacaoModal.show();
                        }, 1000); 
                    });
                }
            });

            btnConfirmarCompra.addEventListener('click', function() {
                if (lastClickedGift) {
                    giftsRef.child(lastClickedGift).update({ status: 'comprado' })
                        .then(() => {
                            console.log("Status atualizado no Firebase!");
                        })
                        .catch((error) => {
                            console.error("Erro ao atualizar o status: ", error);
                        });
                    
                    confirmacaoModal.hide();
                    lastClickedGift = null;
                }
            });

            document.getElementById('confirmacaoModal').addEventListener('hidden.bs.modal', function () {
                lastClickedGift = null;
            });
        }

        // --- Event Listeners para Filtro e Pesquisa ---
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.getAttribute('data-filter');
                
                categorySections.forEach(section => {
                    const sectionCategory = section.id.replace('-section', '');
                    if (currentFilter === 'all' || sectionCategory === currentFilter) {
                        section.style.display = 'block';
                    } else {
                        section.style.display = 'none';
                    }
                });
            });
        });

        searchInput.addEventListener('keyup', () => {
             const searchTerm = searchInput.value.toLowerCase().trim();
             document.querySelectorAll('.present-item').forEach(item => {
                 const title = item.querySelector('.card-title')?.textContent.toLowerCase() || '';
                 const description = item.querySelector('.card-text')?.textContent.toLowerCase() || '';

                 if (searchTerm === '' || title.includes(searchTerm) || description.includes(searchTerm)) {
                     item.style.display = 'block';
                 } else {
                     item.style.display = 'none';
                 }
             });
        });

        clearSearchButton.addEventListener('click', function() {
            searchInput.value = '';
            // Simula um clique no botão de todas as categorias para resetar a visualização
            document.querySelector('[data-filter="all"]').click();
        });

        // Inicialização: Lê o estado inicial do banco de dados e escuta por mudanças
        giftsRef.on('value', (snapshot) => {
            const giftsData = snapshot.val();
            renderGifts(giftsData);
            // Simula um clique no botão "Todas as Categorias" para aplicar o filtro inicial
            document.querySelector('[data-filter="all"]').click(); 
        });
    }

    // --- Lógica para Efeito de Fade entre Páginas ---
    const overlay = document.getElementById('pageTransitionOverlay');
    requestAnimationFrame(() => {
        overlay.classList.add('is-loaded'); 
    });
    
    overlay.addEventListener('transitionend', function() {
        if (overlay.classList.contains('is-loaded') && overlay.style.opacity === '0') {
            overlay.style.visibility = 'hidden';
            overlay.classList.remove('is-loaded');
        }
    });

    document.querySelectorAll('a[href^="."], a[href^="/"]').forEach(link => {
        if (link.hash && link.pathname === window.location.pathname) { return; }
        if (link.target === '_blank' || link.getAttribute('data-bs-toggle') === 'modal') { return; }
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetUrl = this.href;
            overlay.classList.add('is-leaving');
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 800); 
        });
    });
});
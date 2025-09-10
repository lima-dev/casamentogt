// js/script.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Lógica do Contador Regressivo (Apenas para a página index.html) ---
    const countdownDate = new Date('Octuber 25, 2025 15:30:00').getTime(); 

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
        const pixModal = new bootstrap.Modal(document.getElementById('pixModal'));
        
        let currentFilter = 'all'; 
        let lastClickedGiftId = null;
        
        const database = firebase.database();
        const giftsRef = database.ref('gifts');

        /**
         * Cria e retorna o HTML de um card de presente.
         */
        function createGiftCardHtml(giftId, giftData) {
            const isPurchased = giftData.status && giftData.status.toLowerCase() === 'comprado';
            const isPixGift = giftData.category === 'lua-de-mel';
            const buttonText = isPixGift ? (isPurchased ? 'Doação já realizada' : 'Doar Valor') : (isPurchased ? 'Presente Comprado' : 'Ver na Loja');
            const buttonDisabled = isPurchased ? 'disabled' : '';
            const purchasedClass = isPurchased ? 'purchased' : '';
            
            // Verifica se o presente tem uma imagem. Adiciona um placeholder se não tiver.
            const imageHtml = giftData.image 
                ? `<img src="${giftData.image}" class="card-img-top img-fluid" alt="Imagem do presente ${giftData.title}">` 
                : `<div class="card-img-top-placeholder d-flex align-items-center justify-content-center bg-light text-muted">Sem Imagem</div>`;

            const title = giftData.title ? giftData.title : 'Presente Indefinido';
            const description = giftData.description ? giftData.description : 'Sem descrição.';
            const link = giftData.link ? giftData.link : '#';

            // Determina qual modal o botão abrirá (se for um presente normal)
            const modalAttribute = isPixGift ? '' : `data-bs-toggle="modal" data-bs-target="#confirmacaoModal"`;

            return `
                <div class="col present-item ${purchasedClass}" data-gift-id="${giftId}" data-category="${giftData.category}">
                    <div class="card h-100 shadow-sm">
                        ${imageHtml}
                        <div class="card-body d-flex flex-column"> 
                            <div>
                                <h5 class="card-title">${title}</h5>
                                <p class="card-text">${description}</p>
                            </div>
                            <button type="button" class="btn btn-primary-alt mt-auto ${buttonDisabled}" ${buttonDisabled} data-gift-id="${giftId}" ${isPixGift ? '' : `onclick="window.open('${link}', '_blank')" ${modalAttribute}`}>
                                ${buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Renderiza todos os presentes na página, baseando-se nos dados do Firebase.
         */
        function renderGifts(giftsData) {
            // Limpa todas as seções
            document.querySelectorAll('.row[id$="-list"]').forEach(list => list.innerHTML = '');

            for (const giftId in giftsData) {
                const gift = giftsData[giftId];
                const listContainerId = `${gift.category}-list`;
                const listContainer = document.getElementById(listContainerId);
                
                if (listContainer) {
                    const giftHtml = createGiftCardHtml(giftId, gift);
                    listContainer.innerHTML += giftHtml;
                }
            }
            attachEventListeners(giftsData);
        }

        /**
         * Anexa os event listeners aos botões dos presentes.
         */
        function attachEventListeners(giftsData) {
            const giftLinks = document.querySelectorAll('.present-item .btn-primary-alt');
            giftLinks.forEach(link => {
                // Remove listeners anteriores para evitar duplicação
                link.replaceWith(link.cloneNode(true));
            });

            document.querySelectorAll('.present-item .btn-primary-alt').forEach(link => {
                const giftId = link.getAttribute('data-gift-id');
                const gift = giftsData[giftId];
                
                if (link.textContent.trim() === 'Doar Valor' && gift.status.toLowerCase() === 'disponível') {
                    link.addEventListener('click', function() {
                        lastClickedGiftId = giftId;
                        pixModal.show();
                    });
                } else if (link.textContent.trim() === 'Ver na Loja' && gift.status.toLowerCase() === 'disponível') {
                    link.addEventListener('click', function() {
                        lastClickedGiftId = giftId;
                        // O modal de confirmação já é aberto pelo onclick do HTML para esses links
                    });
                }
            });

            // Listener para o botão "Sim, eu comprei!" do modal de confirmação
            document.getElementById('btnConfirmarCompra').addEventListener('click', function() {
                if (lastClickedGiftId) {
                    giftsRef.child(lastClickedGiftId).update({ status: 'comprado' })
                        .then(() => {
                            console.log("Status atualizado no Firebase!");
                        })
                        .catch((error) => {
                            console.error("Erro ao atualizar o status: ", error);
                        });
                    confirmacaoModal.hide();
                    lastClickedGiftId = null;
                }
            });

            // Listener para o botão "Já doei!" do modal de Pix
            const btnConfirmarDoacao = document.querySelector('#pixModal #btnConfirmarDoacao');
            if(btnConfirmarDoacao) {
                 btnConfirmarDoacao.addEventListener('click', function() {
                    if (lastClickedGiftId) {
                        giftsRef.child(lastClickedGiftId).update({ status: 'comprado' })
                            .then(() => {
                                console.log("Status de doação atualizado no Firebase!");
                            })
                            .catch((error) => {
                                console.error("Erro ao atualizar o status de doação: ", error);
                            });
                        pixModal.hide();
                        lastClickedGiftId = null;
                    }
                });
            }


            document.getElementById('confirmacaoModal').addEventListener('hidden.bs.modal', function () {
                lastClickedGiftId = null;
            });
            document.getElementById('pixModal').addEventListener('hidden.bs.modal', function () {
                lastClickedGiftId = null;
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

        if (searchInput) {
            searchInput.addEventListener('keyup', () => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                document.querySelectorAll('.present-item').forEach(item => {
                    const title = item.querySelector('.card-title')?.textContent.toLowerCase() || '';
                    const description = item.querySelector('.card-text')?.textContent.toLowerCase() || '';
                    const category = item.getAttribute('data-category') || '';

                    if (searchTerm === '' || title.includes(searchTerm) || description.includes(searchTerm)) {
                        if (currentFilter === 'all' || category === currentFilter) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }

        if (clearSearchButton) {
            clearSearchButton.addEventListener('click', function() {
                searchInput.value = '';
                document.querySelector('[data-filter="all"]').click();
            });
        }


        // Inicialização: Lê o estado inicial do banco de dados e escuta por mudanças
        giftsRef.on('value', (snapshot) => {
            const giftsData = snapshot.val();
            renderGifts(giftsData);
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
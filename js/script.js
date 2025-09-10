// js/script.js

// Firebase Configurações (já estão no HTML)
const database = firebase.database();

// Lógica para o contador regressivo (sem alterações)
document.addEventListener('DOMContentLoaded', function() {
    const countdownDate = new Date('Octuber 250, 2025 15:30:00').getTime(); 
    if (document.getElementById('countdown-timer')) {
        const x = setInterval(function() {
            const now = new Date().getTime();
            const distance = countdownDate - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById('days').innerHTML = days;
            document.getElementById('hours').innerHTML = hours;
            document.getElementById('minutes').innerHTML = minutes;
            document.getElementById('seconds').innerHTML = seconds;

            if (distance < 0) {
                clearInterval(x);
                document.getElementById('countdown-timer').innerHTML = "O grande dia chegou!";
            }
        }, 1000);
    }
});

// Lógica para a transição de páginas
window.addEventListener('beforeunload', function() {
    document.getElementById('pageTransitionOverlay').classList.add('is-leaving');
});

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        document.getElementById('pageTransitionOverlay').classList.add('is-loaded');
    }, 100);
});


// Funções para a página de presentes
if (document.getElementById('lista-presentes')) {
    
    // Referências no HTML para as categorias e a lista de presentes
    const categories = {
        'casa-e-cozinha': document.getElementById('casa-e-cozinha-list'),
        'eletrodomesticos': document.getElementById('eletrodomesticos-list'),
        'eletronicos': document.getElementById('eletronicos-list'),
        'lua-de-mel': document.getElementById('lua-de-mel-list')
    };

    const sections = {
        'casa-e-cozinha': document.getElementById('casa-e-cozinha-section'),
        'eletrodomesticos': document.getElementById('eletrodomesticos-section'),
        'eletronicos': document.getElementById('eletronicos-section'),
        'lua-de-mel': document.getElementById('lua-de-mel-section')
    };
    
    // Funções auxiliares
    
    function createGiftCard(gift, id) {
        let buttonContent, buttonClass;
        if (gift.disponivel === true) {
            if (gift.categoria === 'lua-de-mel') {
                buttonContent = 'Doar Valor';
                buttonClass = 'btn-primary-alt donate-pix-btn'; // Classe para o botão de Pix
            } else {
                buttonContent = gift.link ? 'Comprar Presente' : 'Reservar Presente';
                buttonClass = 'btn-primary-alt buy-reserve-btn';
            }
        } else {
            buttonContent = 'Indisponível';
            buttonClass = 'btn-secondary disabled';
        }

        const formattedPrice = `R$ ${parseFloat(gift.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        return `
            <div class="col present-item" data-category="${gift.categoria}" data-item-id="${id}">
                <div class="card h-100 bg-transparent border-light">
                    ${gift.imagem ? `<img src="${gift.imagem}" class="card-img-top" alt="${gift.nome}">` : `<div class="card-img-top-placeholder d-flex align-items-center justify-content-center"><span>Imagem em breve</span></div>`}
                    <div class="card-body">
                        <div>
                            <h5 class="card-title">${gift.nome}</h5>
                            <p class="card-text">${gift.descricao}</p>
                            <h6 class="card-subtitle mb-2">${formattedPrice}</h6>
                        </div>
                        <button type="button" class="btn ${buttonClass}" data-gift-id="${id}" ${gift.disponivel === false ? 'disabled' : ''}>
                            ${buttonContent}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Carrega e renderiza os presentes do Firebase
    database.ref('presentes').on('value', (snapshot) => {
        const presentes = snapshot.val();
        if (presentes) {
            // Limpa as listas de presentes existentes
            Object.values(categories).forEach(list => list.innerHTML = '');

            Object.keys(presentes).forEach(id => {
                const present = presentes[id];
                const card = createGiftCard(present, id);
                if (categories[present.categoria]) {
                    categories[present.categoria].innerHTML += card;
                }
            });

            // Adiciona event listeners aos botões "Comprar" ou "Doar"
            document.querySelectorAll('.btn-primary-alt').forEach(button => {
                button.addEventListener('click', (event) => {
                    const giftId = event.target.dataset.giftId;
                    const gift = presentes[giftId];
                    if (gift) {
                        if (gift.categoria === 'lua-de-mel') {
                            showDonateModal(gift, giftId);
                        } else {
                            handleGiftClick(gift, giftId);
                        }
                    }
                });
            });
        }
    });

    // Função para lidar com a doação via Pix (Lua de Mel)
    function showDonateModal(gift, giftId) {
        const pixModal = new bootstrap.Modal(document.getElementById('pixModal'));
        const modalBody = document.querySelector('#pixModal .modal-body');

        // Conteúdo do modal de Pix
        modalBody.innerHTML = `
            <p>Obrigado por contribuir para nossa Lua de Mel! O valor de <strong>R$ ${parseFloat(gift.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> pode ser enviado para a chave Pix abaixo.</p>
            <p><strong>Chave Pix:</strong> (Chave do Pix que você irá adicionar manualmente)</p>
            <p><strong>Nome:</strong> (Nome do Titular)</p>
        `;
        
        // Adiciona o botão "Já doei" no modal
        const confirmButton = document.createElement('button');
        confirmButton.type = 'button';
        confirmButton.id = 'btnConfirmarDoacao';
        confirmButton.className = 'btn btn-primary-alt';
        confirmButton.textContent = 'Já Doei!';
        
        // Remove botões anteriores do footer e adiciona o novo
        const modalFooter = document.querySelector('#pixModal .modal-footer');
        modalFooter.innerHTML = ''; // Limpa o footer
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn btn-secondary';
        closeButton.setAttribute('data-bs-dismiss', 'modal');
        closeButton.textContent = 'Ainda não doei';
        
        modalFooter.appendChild(closeButton);
        modalFooter.appendChild(confirmButton);

        confirmButton.addEventListener('click', () => {
            updateGiftStatus(giftId, false);
            pixModal.hide();
        });

        pixModal.show();
    }
    
    // Funções de atualização do Firebase
    function updateGiftStatus(id, newStatus) {
        database.ref(`presentes/${id}`).update({
            disponivel: newStatus
        }).then(() => {
            console.log("Status do presente atualizado com sucesso!");
        }).catch((error) => {
            console.error("Erro ao atualizar o status do presente: ", error);
        });
    }

    function handleGiftClick(gift, id) {
        // Redireciona para o link da loja e abre o modal de confirmação
        if (gift.link) {
            window.open(gift.link, '_blank');
            const confirmacaoModal = new bootstrap.Modal(document.getElementById('confirmacaoModal'));
            confirmacaoModal.show();
            // Adiciona o listener para o botão "Sim, eu comprei!"
            document.getElementById('btnConfirmarCompra').onclick = () => {
                updateGiftStatus(id, false);
                confirmacaoModal.hide();
            };
        } else {
            // Se não tem link, apenas marca como indisponível
            updateGiftStatus(id, false);
        }
    }

    // Lógica para os botões de filtro
    document.querySelectorAll('.gifts-category-filters .btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.gifts-category-filters .btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;
            document.querySelectorAll('.category-section').forEach(section => {
                if (filter === 'all' || section.id === `${filter}-section`) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });

    // Lógica para a pesquisa
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        const clearSearchBtn = document.getElementById('clear-search');
        searchInput.addEventListener('keyup', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            document.querySelectorAll('.present-item').forEach(item => {
                const title = item.querySelector('.card-title').textContent.toLowerCase();
                if (title.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            document.querySelectorAll('.present-item').forEach(item => {
                item.style.display = 'block';
            });
        });
    }

}
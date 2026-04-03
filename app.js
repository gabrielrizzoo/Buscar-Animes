document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("search-form");
    const input = document.getElementById("campo-pesquisa");
    const section = document.getElementById("resultados-pesquisa");
    
    // Controle anti-spam (Debounce em flag)
    let isFetching = false;

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        
        if (isFetching) return; // Cancela interações múltiplas em milissegundos
        let query = input.value.trim(); 

        if (!query) {
            renderEmptyState("Por favor, digite o nome de uma obra para procurar.", "🔍");
            return;
        }

        // UX: Ativar estado Visual Premium (Skeleton Screen preenchendo a Grid)
        renderSkeletons(12);
        isFetching = true;

        try {
            // A API Jikan pode bloquear se fizermos floods.
            const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&sfw=true`);
            
            if (!response.ok) {
                throw new Error(response.status);
            }

            const data = await response.json();
            const animes = data.data;

            if (animes && animes.length > 0) {
                renderizarAnimes(animes);
            } else {
                renderEmptyState(`Nenhuma obra encontrada para "<b>${query}</b>".`, "👻");
            }

        } catch (error) {
            console.error("Erro na Jikan API:", error);
            if (error.message.includes('429')) {
                renderEmptyState("Muitas requisições. O banco de dados do MyAnimeList pede para você esperar alguns segundos e tentar novamente.", "⏳");
            } else {
                renderEmptyState("Problema de conexão. Tente novamente mais tarde.", "📡");
            }
        } finally {
            isFetching = false; // Libera nova tentativa
        }
    });

    // Função de tratamento do Fluxo de Ausência
    function renderEmptyState(message, icon) {
        section.innerHTML = `
            <div class="feedback-msg">
                <span class="feedback-icon">${icon}</span>
                ${message}
            </div>
        `;
    }

    // Função Criadora de Malha Estrutural Ocular (Skeleton Premium)
    function renderSkeletons(quantity) {
        let skeletonHtml = "";
        for (let i = 0; i < quantity; i++) {
            skeletonHtml += `
                <article class="item-resultado">
                    <div class="anime-img-container skeleton"></div>
                    <div class="anime-content">
                        <div class="skeleton" style="height: 1.5rem; width: 80%; border-radius: 4px; margin-bottom: 0.8rem;"></div>
                        <div class="anime-meta">
                            <div class="skeleton" style="height: 1.5rem; width: 3rem; border-radius: 2rem;"></div>
                            <div class="skeleton" style="height: 1.5rem; width: 3rem; border-radius: 2rem;"></div>
                        </div>
                        <div class="skeleton" style="height: 4rem; width: 100%; border-radius: 4px; margin-bottom: 2rem;"></div>
                        <div class="skeleton" style="height: 2.5rem; width: 100%; border-radius: 0.5rem; margin-top: auto;"></div>
                    </div>
                </article>
            `;
        }
        section.innerHTML = skeletonHtml;
    }

    // Renderizador Sênior
    function renderizarAnimes(animes) {
        const animesLimitados = animes.slice(0, 12);
        
        const htmlElements = animesLimitados.map((anime, index) => {
            const titulo = anime.title || "Indisponível";
            // Extraindo a melhor proporção de imagem fornecida na malha do Jikan V4
            const imageUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
            const urlMyAnimeList = anime.url || "#";
            const descricao = anime.synopsis ? anime.synopsis : "Sem informações catalogadas de enredo até o momento.";
            
            const ano = anime.year || (anime.aired && anime.aired.prop && anime.aired.prop.from && anime.aired.prop.from.year) || "TBA";
            const tipo = anime.type || "TV";
            const pontuacao = anime.score ? `⭐ ${anime.score}` : "S/ Nota";

            const animationDelay = `${index * 0.05}s`;

            return `
                <article class="item-resultado" style="animation-delay: ${animationDelay}">
                    <div class="anime-img-container">
                        <img src="${imageUrl ? imageUrl : 'https://via.placeholder.com/300x400/0B0F19/F59E0B?text=Capa+Indisponível'}" alt="Capa ${titulo}" loading="lazy">
                    </div>
                    <div class="anime-content">
                        <h2>${titulo}</h2>
                        <div class="anime-meta">
                            <span class="badge">${tipo}</span>
                            <span class="badge">${ano}</span>
                            <span class="badge badge-score">${pontuacao}</span>
                        </div>
                        <p class="descricao-meta">${descricao}</p>
                        <a href="${urlMyAnimeList}" target="_blank" rel="noopener noreferrer" class="btn-link">Saber Mais</a>
                    </div>
                </article>
            `;
        });

        section.innerHTML = htmlElements.join("");
    }
});
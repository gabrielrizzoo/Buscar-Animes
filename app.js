const API_URL = "https://api.jikan.moe/v4/anime";
const LIMITE_RESULTADOS = 12;
const TIMEOUT_MS = 10000;
const PLACEHOLDER_CAPA = "https://via.placeholder.com/300x400/0B0F19/F59E0B?text=Capa+Indisponível";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("search-form");
    const input = document.getElementById("campo-pesquisa");
    const section = document.getElementById("resultados-pesquisa");

    // Busca em andamento. Uma nova busca cancela a anterior, então o resultado
    // exibido sempre corresponde ao último termo enviado.
    let buscaAtual = null;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const query = input.value.trim();

        if (!query) {
            renderEmptyState("Por favor, digite o nome de uma obra para procurar.", "🔍");
            return;
        }

        buscaAtual?.abort();
        const controller = new AbortController();
        buscaAtual = controller;

        let expirou = false;
        const timeoutId = setTimeout(() => {
            expirou = true;
            controller.abort();
        }, TIMEOUT_MS);

        renderSkeletons(LIMITE_RESULTADOS);

        let animes;
        try {
            animes = await buscarAnimes(query, controller.signal);
        } catch (error) {
            // Busca substituída por uma mais recente: a nova já está cuidando da tela.
            if (controller !== buscaAtual) return;

            console.error("Erro na Jikan API:", error);
            const { mensagem, icone } = descreverErro(error, expirou);
            renderEmptyState(mensagem, icone);
            return;
        } finally {
            clearTimeout(timeoutId);
        }

        if (controller !== buscaAtual) return;

        if (animes.length > 0) {
            renderizarAnimes(animes);
        } else {
            renderEmptyState(`Nenhuma obra encontrada para "<b>${escapeHtml(query)}</b>".`, "👻");
        }
    });

    async function buscarAnimes(query, signal) {
        const url = `${API_URL}?q=${encodeURIComponent(query)}&sfw=true&limit=${LIMITE_RESULTADOS}`;
        const response = await fetch(url, { signal });

        if (!response.ok) {
            throw new HttpError(response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data?.data)) {
            throw new Error("Resposta da API sem a lista de resultados.");
        }

        return data.data;
    }

    function descreverErro(error, expirou) {
        if (expirou) {
            return { mensagem: "A API demorou demais para responder. Tente novamente em instantes.", icone: "⏱️" };
        }
        if (error instanceof HttpError && error.status === 429) {
            return { mensagem: "Muitas requisições. O banco de dados do MyAnimeList pede para você esperar alguns segundos e tentar novamente.", icone: "⏳" };
        }
        if (error instanceof HttpError && error.status >= 500) {
            return { mensagem: "O serviço da Jikan (MyAnimeList) está instável no momento. Tente novamente mais tarde.", icone: "🛠️" };
        }
        if (error instanceof HttpError) {
            return { mensagem: "Não foi possível realizar essa busca. Revise o termo e tente novamente.", icone: "⚠️" };
        }
        // fetch rejeita com TypeError quando não há conexão com o servidor.
        if (error instanceof TypeError) {
            return { mensagem: "Problema de conexão. Verifique sua internet e tente novamente.", icone: "📡" };
        }
        return { mensagem: "A API retornou uma resposta inesperada. Tente novamente mais tarde.", icone: "⚠️" };
    }

    // `message` é inserida como HTML: qualquer texto vindo do usuário ou da API
    // precisa passar por escapeHtml antes.
    function renderEmptyState(message, icon) {
        section.innerHTML = `
            <div class="feedback-msg">
                <span class="feedback-icon">${icon}</span>
                ${message}
            </div>
        `;
    }

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

    function renderizarAnimes(animes) {
        const htmlElements = animes.slice(0, LIMITE_RESULTADOS).map((anime, index) => {
            const titulo = anime.title || "Indisponível";
            // Melhor imagem disponível na resposta da Jikan v4
            const imageUrl = urlHttps(anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url);
            const urlMyAnimeList = urlMyAnimeListSegura(anime.url) || `https://myanimelist.net/anime.php?q=${encodeURIComponent(titulo)}`;
            const descricao = anime.synopsis ? anime.synopsis : "Sem informações catalogadas de enredo até o momento.";

            const ano = anime.year || anime.aired?.prop?.from?.year || "TBA";
            const pontuacao = anime.score ? `⭐ ${anime.score}` : "S/ Nota";
            const badgeTipo = anime.type ? `<span class="badge">${escapeHtml(anime.type)}</span>` : "";

            const animationDelay = `${index * 0.05}s`;

            return `
                <article class="item-resultado" style="animation-delay: ${animationDelay}">
                    <div class="anime-img-container">
                        <img src="${escapeHtml(imageUrl || PLACEHOLDER_CAPA)}" alt="Capa ${escapeHtml(titulo)}" loading="lazy">
                    </div>
                    <div class="anime-content">
                        <h2>${escapeHtml(titulo)}</h2>
                        <div class="anime-meta">
                            ${badgeTipo}
                            <span class="badge">${escapeHtml(ano)}</span>
                            <span class="badge badge-score">${escapeHtml(pontuacao)}</span>
                        </div>
                        <p class="descricao-meta">${escapeHtml(descricao)}</p>
                        <a href="${escapeHtml(urlMyAnimeList)}" target="_blank" rel="noopener noreferrer" class="btn-link">Saber Mais</a>
                    </div>
                </article>
            `;
        });

        section.innerHTML = htmlElements.join("");
    }
});

class HttpError extends Error {
    constructor(status) {
        super(`HTTP ${status}`);
        this.name = "HttpError";
        this.status = status;
    }
}

function escapeHtml(valor) {
    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function urlHttps(url) {
    return typeof url === "string" && url.startsWith("https://") ? url : null;
}

// Só aceita links para o MyAnimeList, bloqueando esquemas como `javascript:`.
function urlMyAnimeListSegura(url) {
    return typeof url === "string" && url.startsWith("https://myanimelist.net/") ? url : null;
}

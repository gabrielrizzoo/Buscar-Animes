# Buscar Animes

[![CI](https://github.com/gabrielrizzoo/Buscar-Animes/actions/workflows/ci.yml/badge.svg)](https://github.com/gabrielrizzoo/Buscar-Animes/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)

Aplicação web para buscar animes pelo nome e ver capa, formato, ano, nota e sinopse de cada resultado. Os dados vêm da [API GraphQL do AniList](https://docs.anilist.co/), e cada card leva à página do anime no [MyAnimeList](https://myanimelist.net/) (ou no AniList, quando o anime não está no MyAnimeList).

**Demonstração:** <https://buscar-animes.vercel.app>

<p align="center">
  <img src="docs/screenshots/resultados-desktop.jpg" alt="Resultados da busca por Frieren no desktop: grade de cards com capa, nota, título, formato, ano e sinopse" width="68%" />
  &nbsp;
  <img src="docs/screenshots/resultados-mobile.jpg" alt="Resultados da busca por Frieren no celular, em lista compacta com capa à esquerda" width="22%" />
</p>

## Funcionalidades

- **Busca por nome** pelo botão "Explorar" ou pela tecla Enter, só com animes e sem conteúdo adulto (`isAdult: false`).
- **Sugestões de busca** ("Experimente: One Piece, Frieren...") para quem chega sem um título em mente.
- **Cards em formato de pôster** com capa, nota (de 0 a 10), título, formato (TV, Filme, OVA...), ano e sinopse resumida em três linhas. O card inteiro abre a página do anime.
- **Paginação** com 12 resultados por vez e botão "Carregar mais".
- **Busca na URL** (`?q=naruto`): dá para compartilhar o link de uma busca, e os botões voltar/avançar do navegador refazem as buscas anteriores.
- **Estados de interface** para carregamento (skeleton), termo vazio, nenhum resultado e erros, com mensagens específicas para tempo esgotado (10 s), limite de requisições (HTTP 429, informando quanto tempo esperar), instabilidade do serviço (HTTP 5xx), falha de conexão e resposta inesperada, além do botão "Tentar novamente".
- **Capa substituta** quando o anime não tem imagem ou ela não carrega, e capas menores no celular (`srcset`).
- **Acessibilidade:** landmarks semânticos, região de status lida por leitores de tela, links com nome descritivo, foco visível, navegação completa pelo teclado e respeito à preferência de movimento reduzido (`prefers-reduced-motion`).
- **Layout responsivo:** lista compacta no celular e grade de 2 a 4 colunas em telas maiores, de 320 px até telas largas.

<details>
<summary>Tela inicial e estado de carregamento</summary>

<p align="center">
  <img src="docs/screenshots/inicio-desktop.png" alt="Tela inicial no desktop, com o título Encontre seu próximo anime, o campo de busca e sugestões de títulos" width="68%" />
  &nbsp;
  <img src="docs/screenshots/inicio-mobile.png" alt="Tela inicial no celular, com o campo de busca e o botão Explorar empilhados" width="22%" />
</p>

![Grade de cards skeleton exibida enquanto a busca por "naruto" carrega](docs/screenshots/carregando-desktop.png)

</details>

## Tecnologias

| Ferramenta                                                                              | Uso no projeto                                                        |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [React 19](https://react.dev/)                                                          | Interface declarativa em componentes                                  |
| [TypeScript](https://www.typescriptlang.org/)                                           | Tipagem da resposta da API, que tem vários campos que podem ser nulos |
| [Vite 8](https://vite.dev/)                                                             | Servidor de desenvolvimento e build de produção                       |
| [Tailwind CSS 4](https://tailwindcss.com/)                                              | Estilos utilitários e tokens de tema (`@theme`)                       |
| [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) + jsdom | Testes de unidade, de hook e de componentes                           |
| [Oxlint](https://oxc.rs/) e [Prettier](https://prettier.io/)                            | Lint e formatação (com ordenação automática das classes Tailwind)     |
| GitHub Actions                                                                          | Lint, formatação, testes e build a cada push e pull request           |
| [Vercel](https://vercel.com/)                                                           | Hospedagem                                                            |

Não há bibliotecas de roteamento, de estado global, de requisições ou de GraphQL: o app tem uma única tela e faz uma única consulta, então `useReducer` + `fetch` resolvem o necessário.

## Decisões técnicas

- **A última busca sempre vence.** Cada requisição usa um `AbortController`. Uma nova busca, o "Carregar mais" ou a saída da tela cancelam a requisição anterior, e respostas atrasadas são descartadas. Assim o resultado exibido sempre corresponde ao termo do campo de busca ([`useAnimeSearch.ts`](src/hooks/useAnimeSearch.ts)).
- **Consulta GraphQL com `fetch`.** A busca é um `POST` com a query e as variáveis, sem cliente GraphQL. O serviço tem timeout próprio de 10 segundos, combinado com o cancelamento externo sem depender de `AbortSignal.any`, que não existe no Safari anterior ao 17.4 ([`anilist.ts`](src/services/anilist.ts)).
- **Dados validados na entrada.** A resposta passa por uma normalização que trata campos ausentes, converte a nota de 0–100 para 0–10, traduz o formato e aceita apenas capas `https` e links do MyAnimeList ou do AniList, o que bloqueia URLs como `javascript:` ([`normalizeAnime.ts`](src/utils/normalizeAnime.ts)). A sinopse do AniList pode trazer `<br>` e `<i>`; ela vira texto puro antes de ser exibida ([`plainText.ts`](src/utils/plainText.ts)). Todo texto é renderizado pelo React como texto, e o lint proíbe `dangerouslySetInnerHTML`.
- **Erros tipados** (`ApiHttpError`, `ApiResponseError`, `RequestTimeoutError`) traduzidos em mensagens claras para o usuário ([`searchErrors.ts`](src/utils/searchErrors.ts)).
- **Identidade visual em tokens.** O tema noturno com destaque âmbar, herdado da versão original, está definido como tokens do Tailwind em [`index.css`](src/index.css). O brilho do fundo usa só gradientes, sem filtros de blur pesados, e os ícones são SVGs próprios, sem biblioteca externa ([`Icon.tsx`](src/components/Icon.tsx)).
- **Card inteiro clicável sem links duplicados.** O link do título se estende sobre o card, então o clique funciona em qualquer ponto, mas o leitor de tela ouve um único link por anime.

## Estrutura

```text
src/
├── components/   # Header, SearchForm, SearchSuggestions, SearchResults, AnimeCard, Icon...
├── hooks/        # useAnimeSearch: estado da busca, paginação e cancelamento
├── services/     # anilist.ts: consulta GraphQL, timeout e erros da API
├── types/        # Tipos da resposta do AniList e do modelo exibido
├── utils/        # Normalização, texto puro, mensagens de erro, formatação e URL
├── test/         # Configuração e dados de teste
├── App.tsx
├── main.tsx
└── index.css     # Tailwind, tokens de tema e estilos base
```

## Como executar localmente

Pré-requisitos: [Node.js](https://nodejs.org/) 24 LTS (versão indicada em `.nvmrc` e no campo `engines` do `package.json`) e npm.

```bash
git clone https://github.com/gabrielrizzoo/Buscar-Animes.git
cd Buscar-Animes
npm install
npm run dev
```

Abra o endereço exibido no terminal (por padrão, <http://localhost:5173>). Não há variáveis de ambiente nem chave de API: as consultas públicas do AniList não exigem autenticação.

## Scripts

| Comando                | O que faz                                                       |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Inicia o servidor de desenvolvimento                            |
| `npm run build`        | Verifica os tipos (`tsc`) e gera o build de produção em `dist/` |
| `npm run preview`      | Serve o build de produção localmente                            |
| `npm test`             | Executa os testes uma vez                                       |
| `npm run test:watch`   | Executa os testes em modo observação                            |
| `npm run lint`         | Analisa o código com Oxlint                                     |
| `npm run format`       | Formata os arquivos com Prettier                                |
| `npm run format:check` | Confere a formatação sem alterar arquivos                       |

## Testes

Os testes usam Vitest, Testing Library e uma API do AniList simulada, então não dependem da internet. Eles cobrem:

- o corpo da consulta GraphQL e cada tipo de erro (HTTP, limite de requisições, JSON inválido, erro do GraphQL, falha de rede, timeout e cancelamento);
- a normalização dos dados, incluindo campos ausentes, conversão de nota, formatos, links, URLs inseguras e a limpeza da sinopse;
- o hook de busca: busca concorrente (a mais recente vence), "Carregar mais", nova tentativa após erro e cancelamento ao desmontar;
- os componentes e o fluxo completo: Enter, sugestões de busca, skeleton, resultados, URL e título da página, botão voltar do navegador, termo vazio, nenhum resultado, erro com nova tentativa, paginação e foco do teclado.

```bash
npm test
```

## Build e publicação

`npm run build` gera os arquivos estáticos em `dist/`. O deploy é feito pela Vercel, configurada em [`vercel.json`](vercel.json) (preset Vite, saída em `dist/`). O workflow [`ci.yml`](.github/workflows/ci.yml) roda lint, verificação de formatação, testes e build em cada pull request e em cada push na `main`.

## Limitações conhecidas

- **Limite de requisições do AniList.** A API está temporariamente limitada a 30 requisições por minuto (normalmente são 90). Ao estourar o limite, o app avisa quanto tempo esperar e permite tentar de novo.
- **Sem contagem total de resultados.** O AniList não informa um total confiável para buscas, então o app mostra quantos resultados já foram carregados e se há mais páginas.
- **Idioma dos dados.** Títulos aparecem em japonês romanizado (ou em inglês, quando é o único disponível), e as sinopses vêm em inglês, sem tradução.
- **Sem filtros.** Ainda não há filtros por formato, gênero ou ordenação.

## Próximos passos possíveis

- Filtros por formato, gênero e ordenação, usando os argumentos `format`, `genre` e `sort` da consulta `Page.media` do AniList.
- Página ou modal de detalhes do anime, com personagens e episódios.
- Opção de exibir títulos em inglês.

## Histórico

Este projeto nasceu em 2024 na **Imersão Dev Front-End com Google Gemini, da Alura**. A primeira versão buscava em uma lista fixa de três animes guardada em `dados.js` e servia para praticar lógica e manipulação do DOM.

Em 2026, o app passou a consultar a API Jikan (dados do MyAnimeList) e ganhou o visual escuro com efeito de vidro, ainda em HTML, CSS e JavaScript puros. Depois, uma auditoria corrigiu problemas de segurança e de comportamento (injeção de HTML, falta de timeout, buscas concorrentes e o resumo da sinopse), e a interface foi migrada para React, TypeScript e Tailwind CSS. A versão em JavaScript puro continua disponível no histórico do Git, na tag `v1-vanilla`.

Em outubro de 2026, a [API pública da Jikan foi descontinuada](https://github.com/jikan-me/jikan-rest/issues/613), e a busca passou a usar a API do AniList, junto com um redesign completo da interface.

## Créditos

Desenvolvido por **Gabriel Rizzo**: [LinkedIn](https://www.linkedin.com/in/gabriel-rizzo-352052266/).

Dados fornecidos pelo [AniList](https://anilist.co/), com links para o [MyAnimeList](https://myanimelist.net/). Este projeto é independente e não tem vínculo com nenhum dos dois serviços.

Sugestões e correções são bem-vindas por meio de issues e pull requests.

# 🌌 Buscar Animes
### Explore todo o universo dos animes num clique. (Versão 2.0 Premium)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) 
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) 
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Fetch API](https://img.shields.io/badge/Fetch_API-232F3E?style=for-the-badge&logo=Web&logoColor=white)

Uma aplicação robusta de consulta em tempo real projetada para proporcionar a experiência definitiva na busca pelo seu anime favorito, tudo isso em um Design Web Premium. Basta digitar o nome de um anime, gênero ou qualquer palavra-chave relacionada e a aplicação retornará título, sinopse e demais detalhes dos resultados mais relevantes.

---

## 📖 A Origem do Projeto (Imersão Alura 2024)

Este projeto tem um valor especial na minha trajetória. Ele nasceu originalmente em **2024**, desenvolvido como parte do desafio da **Imersão Dev Front-End com Google Gemini da Alura**. Em sua primeira versão (V1), a aplicação utilizava um arquivo `JSON` local para armazenar uma base de dados simples, focando nos conceitos iniciais de lógica e manipulação de DOM. A evolução contínua para esta Versão 2.0 reflete o meu amadurecimento como desenvolvedor, focado em entregar arquiteturas modernas, integrações reais de API e uma experiência de usuário (UI/UX) impecável.

---

## 🚀 Novidades da Versão 2.0 (Refatoração Profissional)
Nesta versão, abandonamos a arquitetura básica de "estudos iniciais" para entregar um real portfólio web, amadurecido com:

- 📶 **Consumo Inteligente de Web API**: Desativamos antigas simulações de arquivos de texto locais vazios. A robustez da plataforma agora interliga diretamente com a [Jikan API](https://jikan.moe/) (Base Oficial do *MyAnimeList*). Puxe capas autênticas, scores e sinopses dinâmicas dentre milhares de animes.
- 🎨 **Dark Mode & Glassmorphism Premium**: Adeus estilo chapado! Lapidação visual interativa extrema usando o "Efeito Tela de Vidro" (desfoque e iluminações de borda nativas css), em conjunto de paletas noturnas espaciais contrastadas com botão Âmbar sofisticado.
- 💀 **Skeleton Screens & Empty States**: Telas vazias irritantes já não atrapalham a navegação. Seguindo práticas de UX das grandes empresas (Netflix, YouTube): toda espera aciona *shimmering cards dinâmicos simulados* durante descargas demoradas da API, além de caixas ricas e charmosas informando mensagens de esgotamento.
- ⚡ **Antispam & Busca Ergonômica**: Responsividade de interação estendida ao permitir procura natural com submissão via **Tecla Enter**, e escudos anti-flood criados via Debouncing e controle assíncrono evitam telas mortas sob pressão massiva do usuário.

---

## 🛠️ Tecnologias e Implementações

* **Semântica HTML5**: Todo o projeto migrou estruturas frágeis por formulários flexíveis, fazendo com que o Input nativo `type="search"` suporte melhor leitores e teclados de celular em harmonia.
* **CSS3 Elegante & Rígido**: Todo o sistema constrói fluidez sob `Flexbox` e `Grid` com reações via animações base `@keyframes`. Introdução fundamental do `Aspect-Ratio` trancou os alinhamentos forçando a grade paralela que as fotos do site de anime se encaixem cirurgicamente independente do fator original.
* **JavaScript (ES6+) Vanilla Assíncrono**: As caóticas repetições foram varridas pelo mapeamento funcional (`.map`, `.slice`, `join('')`) e integração fluída nos métodos de requisições baseados fielmente entre `async / await` para gerir o Fetch API.

---

## ⚙️ Como Utilizar
Para usar ativamente as bases de dados em sua própria máquina, siga os passos mínimos:

1. **Clone o repositório**:  
   `git clone https://github.com/gabrielxsj/Buscar_Animes.git`
2. **Abra o ambiente local** no seu editor de código predileto (ex: VS Code).
3. **Execute o projeto**: Não precisa instalar NPM nem nada pesado. Apenas habilite alguma porta clicando no *Live Server* de seu editor ou abra o arquivo `index.html` diretamente em um navegador.
4. Digite "Naruto, Death Note" ou tente pesquisar sua infância e clique `Enter`!

---

## 🤝 Contribuições

Sinta-se à vontade para contribuir com o projeto! Se você encontrar algum bug, tiver sugestões de melhoria ou quiser adicionar funcionalidades, abra um pull request.

> **Aviso:** Esta aplicação está em constante desenvolvimento. Novas funcionalidades e melhorias serão adicionadas com o tempo.

---

## 👨‍💻 Créditos e Contato

Toda a arquitetura, visão de direção de arte UI/UX sofisticada e desenvolvimento em lógicas assíncronas do projeto v2.0 foram encabeçados e construídos por:

**Gabriel Rizzo**  
💼 [Reaja à publicação e se conecte comigo no LinkedIn!](https://www.linkedin.com/in/gabriel-rizzo-352052266/)
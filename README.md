# 📚 Livraria Online — Sistema Completo de E-commerce

[![GitHub license](https://img.shields.io/github/license/MatheusAbib/e-commerce-livraria)](https://github.com/MatheusAbib/e-commerce-livraria/blob/main/LICENSE)
[![Java](https://img.shields.io/badge/Java-17-blue.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-21-red.svg)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black.svg)](https://vercel.com/)
[![DigitalOcean](https://img.shields.io/badge/Backend-DigitalOcean-0080FF.svg)](https://www.digitalocean.com/)

Sistema completo de livraria online desenvolvido com **Spring Boot** no backend e **Angular** no frontend. Reúne catálogo literário, recomendações personalizadas, gerenciamento de autores, carrinho com reserva temporária de estoque, pedidos, pagamentos simulados, devoluções, cupons, avaliações, notificações, atendimento em tempo real e relatórios administrativos.

> 🔗 **Acesse o projeto online:** [Livraria Online](https://livrariaonline-gold.vercel.app/)

---

## 📋 Visão Geral

O sistema foi desenvolvido para oferecer uma experiência completa de comércio eletrônico, atendendo visitantes, clientes e administradores.

Com uma identidade visual inspirada no universo editorial, a aplicação permite explorar gêneros literários, conhecer autores, descobrir novas leituras e realizar compras por meio de uma interface responsiva.

O ambiente administrativo centraliza o gerenciamento de livros, autores, clientes, pedidos, estoque, devoluções, indicadores financeiros e histórico de operações.

### Principais características

- Interface responsiva com identidade visual editorial.
- API REST desenvolvida com Spring Boot.
- Autenticação e autorização utilizando JWT.
- Persistência de dados com MySQL e Spring Data JPA.
- Comunicação em tempo real com WebSocket e STOMP.
- Catálogo com filtros avançados e informações bibliográficas.
- Sistema interativo de recomendação literária.
- Carrinho persistente com reserva de estoque.
- Dashboard administrativo com indicadores financeiros.
- Componentes compartilhados e serviços especializados.
- Hospedagem na Vercel e DigitalOcean.

---

## 🚀 Tecnologias Utilizadas

### Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Java | 17 | Linguagem principal |
| Spring Boot | 3.5.3 | Framework principal |
| Spring Security | 3.5.x | Autenticação e autorização |
| Spring Data JPA | 3.5.x | Persistência e consultas |
| Spring WebSocket | 3.5.x | Comunicação em tempo real |
| Hibernate | Integrado ao Spring Boot | Mapeamento objeto-relacional |
| MySQL | 8.0 | Banco de dados de produção |
| JWT | 0.12.x | Tokens de autenticação |
| Maven | 3.9.x | Gerenciamento de dependências |

### Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Angular | 21.2.x | Framework com componentes standalone |
| PrimeNG | 17.18.x | Biblioteca de componentes |
| PrimeIcons | 7.0.x | Biblioteca de ícones |
| Chart.js | 4.5.x | Gráficos e indicadores |
| STOMP | 7.3.x | Comunicação WebSocket |
| RxJS | 7.8.x | Programação reativa |
| TypeScript | 5.9.x | Linguagem frontend |
| jsPDF | — | Geração de documentos PDF |
| html2canvas | — | Captura de elementos para exportação |
| HTML5 | — | Estrutura das interfaces |
| CSS3 | — | Estilização e responsividade |

### Infraestrutura

| Tecnologia | Finalidade |
|------------|------------|
| DigitalOcean | Hospedagem do backend |
| Vercel | Hospedagem do frontend |
| MySQL | Armazenamento persistente |
| PM2 | Gerenciamento do processo Java |
| Apache Maven | Compilação do backend |
| Angular CLI | Compilação do frontend |
| Git e GitHub | Versionamento do código-fonte |

---

## ✨ Funcionalidades

### 📖 Página Inicial

- Apresentação com composição dinâmica de capas de livros.
- Rotação automática de títulos e seleção diária de obras.
- Exploração do acervo por autores e gêneros literários.
- Ranking dos cinco livros mais vendidos.
- Questionário interativo de recomendação literária.
- Carrossel de autores com fotografias e links para biografias.
- Catálogo completo com filtros e ordenação.
- Cabeçalho e rodapé responsivos.

### 🧭 Descoberta Literária

Sistema de recomendação que apresenta livros compatíveis com as preferências do leitor, considerando três critérios:

| Critério | Opções |
|----------|--------|
| Gênero | Categorias disponíveis no catálogo |
| Páginas | Até 150, de 151 a 350, acima de 350 ou indiferente |
| Preço | Até R$ 30, R$ 60, R$ 100 ou sem limite |

As recomendações consideram exclusivamente livros ativos e disponíveis, priorizando os títulos mais vendidos. O questionário permite navegar entre etapas, reiniciar escolhas e consultar os detalhes das obras recomendadas.

### 👤 Para Clientes

#### Autenticação e Perfil

- Login e cadastro com validação.
- Recuperação e alteração de senha.
- Edição de informações pessoais.
- Gerenciamento de múltiplos endereços de entrega e cobrança.
- Gerenciamento de cartões para pagamentos simulados.
- Identificação de pendências cadastrais.
- Encerramento automático de sessões expiradas.

#### Catálogo de Livros

- Busca por título, autor e editora.
- Filtros por categoria, preço e avaliação.
- Ordenação por título, preço, avaliação e quantidade vendida.
- Paginação configurável.
- Visualização de sinopse e informações bibliográficas.
- Consulta de ISBN, edição, páginas, dimensões e peso.
- Exibição de avaliações e quantidade de vendas.
- Identificação de livros esgotados e com estoque baixo.

#### Favoritos e Avaliações

- Adição e remoção de livros favoritos.
- Lista personalizada de favoritos.
- Contador de favoritos no cabeçalho.
- Avaliação de livros por estrelas.
- Registro e consulta de comentários.
- Exibição da média e quantidade de avaliações.

#### Carrinho de Compras

- Adição, remoção e alteração de quantidade dos produtos.
- Persistência do carrinho no banco de dados.
- Reserva temporária de estoque por 10 minutos.
- Contagem regressiva do período de reserva.
- Validação de disponibilidade em tempo real.
- Liberação automática de reservas expiradas.
- Cálculo de frete, descontos e valores da compra.

#### Checkout e Pagamento

- Seleção de endereço de entrega.
- Simulação de pagamento com múltiplos cartões.
- Aplicação de cupons promocionais e de troca.
- Validação das informações cadastrais.
- Conversão da reserva de estoque em venda.
- Finalização do pedido.

#### Pedidos e Transações

- Histórico completo de pedidos e transações.
- Acompanhamento das etapas de processamento e entrega.
- Visualização detalhada dos produtos adquiridos.
- Consulta de códigos de rastreamento.
- Confirmação de recebimento.
- Acompanhamento de cancelamentos e devoluções.

#### Devoluções

- Solicitação de devolução parcial ou total.
- Seleção dos itens e quantidades.
- Upload de múltiplas fotografias.
- Acompanhamento do status da solicitação.
- Recebimento de cupons de troca.
- Histórico de devoluções e acompanhamento de reembolsos.

#### Cupons

- Consulta de cupons promocionais.
- Consulta de cupons de troca.
- Aplicação de cupons durante a compra.
- Validação das condições de utilização.

#### Notificações e Chat

- Notificações em tempo real via WebSocket.
- Alertas sobre pedidos, devoluções e reservas.
- Atendimento em tempo real com o vendedor.
- Histórico de conversas vinculadas aos pedidos.
- Contadores de notificações e mensagens.

---

### 🛡️ Para Administradores

#### Dashboard

- Métricas de vendas totais, mensais e diárias.
- Indicadores de faturamento e lucro.
- Gráficos de desempenho financeiro.
- Quantidade de pedidos por status.
- Ranking de produtos mais vendidos.
- Ranking de clientes por volume de compras.
- Indicadores ajustados por cancelamentos e devoluções.
- Exportação de relatórios em PDF.

#### Gerenciamento de Livros

- Cadastro, edição e exclusão de livros.
- Upload de imagens de capa.
- Gerenciamento de informações bibliográficas.
- Definição dos preços de custo e venda.
- Ativação e inativação com justificativa.
- Reposição e controle de estoque.
- Busca, filtros e paginação.

#### Gerenciamento de Autores

- Cadastro independente de autores.
- Importação de autores existentes no catálogo.
- Upload de fotografias.
- Cadastro de links externos para biografias.
- Edição, ativação e inativação de registros.
- Indicadores de cadastros completos e incompletos.
- Contagem de livros associados a cada autor.
- Busca, filtros e paginação.
- Restrição de exclusão de autores associados a livros.
- Integração com o carrossel público de autores.

#### Gerenciamento de Estoque

- Controle de estoque físico, reservado e disponível.
- Consulta das unidades reservadas em carrinhos.
- Identificação de produtos esgotados e com estoque baixo.
- Baixa de estoque durante a finalização de compras.
- Liberação de reservas expiradas.
- Reposição decorrente de cancelamentos e devoluções.
- Controle de disponibilidade em compras simultâneas.

#### Gerenciamento de Pedidos

- Visualização e detalhamento dos pedidos.
- Atualização das etapas de processamento e entrega.
- Inserção de códigos de rastreamento.
- Acompanhamento de pedidos cancelados e devolvidos.
- Consulta de produtos e valores associados às compras.

#### Gerenciamento de Clientes

- Visualização dos clientes cadastrados.
- Ativação e inativação de contas.
- Edição de informações cadastrais.
- Consulta do histórico de compras.
- Classificação por volume de compras.

#### Gestão de Devoluções

- Análise e aprovação ou reprovação de solicitações.
- Consulta das fotografias anexadas.
- Gerenciamento de devoluções parciais e totais.
- Geração de cupons de troca.
- Confirmação de recebimento dos produtos.
- Atualização do estoque e dos indicadores financeiros.

#### Relatórios e Atendimento

- Histórico de operações administrativas.
- Gráficos de vendas por período.
- Indicadores financeiros por produto.
- Apuração de quantidades efetivamente vendidas.
- Visualização e resposta às conversas dos clientes.
- Encerramento e reativação de atendimentos.
- Gerenciamento de conversas ativas e encerradas.

---

## 📦 Reserva e Controle de Estoque

O carrinho utiliza reservas temporárias persistidas no banco de dados, permitindo controlar a disponibilidade dos produtos durante compras simultâneas.

| Tipo de estoque | Descrição |
|-----------------|-----------|
| Físico | Quantidade total de unidades registradas |
| Reservado | Unidades comprometidas em carrinhos válidos |
| Disponível | Unidades que podem ser adquiridas por outros clientes |

```text
Estoque disponível = Estoque físico - Estoque reservado
```

### Funcionamento

1. O cliente adiciona o primeiro produto ao carrinho.
2. O backend valida e reserva as unidades solicitadas.
3. É iniciado um período de reserva de 10 minutos.
4. Outros clientes visualizam a disponibilidade descontando as reservas.
5. A inclusão de novos produtos não reinicia o prazo.
6. A finalização da compra converte a reserva em venda.
7. A remoção de itens ou expiração do prazo libera as unidades.

O controle transacional busca impedir vendas acima da disponibilidade e reposições duplicadas em cancelamentos e devoluções.

---

## 📊 Relatórios Financeiros e Regras de Apuração

Os relatórios administrativos consideram as vendas efetivas, descontando operações canceladas e devoluções concluídas.

- Pedidos cancelados não contribuem para os indicadores de vendas.
- Devoluções concluídas descontam os valores e quantidades correspondentes.
- Devoluções parciais afetam somente os itens envolvidos.
- O lucro considera os preços de custo e venda dos produtos.
- Os rankings utilizam as quantidades efetivamente comercializadas.
- Os cálculos são realizados no backend.
- Os relatórios podem ser exportados em PDF.

```text
Quantidade efetivamente vendida =
Quantidade vendida em pedidos válidos - Quantidade devolvida
```

---

## 🧩 Arquitetura e Componentização

A aplicação utiliza uma arquitetura cliente-servidor com separação entre interface, regras de negócio e persistência.

### Backend

- Controllers responsáveis pelos endpoints da API REST.
- Services responsáveis pelas regras de negócio.
- Repositories responsáveis pelas operações de persistência.
- Entidades e DTOs para representação e transferência de dados.
- Configurações de segurança e comunicação WebSocket.

### Frontend

- Componentes standalone do Angular.
- Páginas públicas, autenticadas e administrativas.
- Serviços especializados por domínio.
- Modelos TypeScript para tipagem dos dados.
- Interceptores de autenticação e tratamento de sessão.
- Configurações separadas por ambiente.
- Seções independentes na página inicial.

### Componentes Compartilhados

| Grupo | Componentes |
|-------|-------------|
| Botões | Botões de ação, botões de ícone e grupos de ações |
| Formulários | Campos de texto, senha, seleção, quantidade e valores monetários |
| Validação | Máscaras, mensagens de erro e indicador de força de senha |
| Arquivos | Campos de upload e pré-visualização de imagens |
| Avaliações | Componente reutilizável de avaliação por estrelas |
| Modais | Estrutura base, cabeçalho, conteúdo, rodapé e confirmação |
| Notificações | Mensagens de sucesso, erro, aviso e informação |

A componentização reduz duplicações, facilita a manutenção e mantém a consistência visual e funcional entre as interfaces.

---

## 🗄️ Estrutura do Banco de Dados

O sistema utiliza MySQL com persistência realizada por Spring Data JPA e Hibernate.

### Principais Tabelas

| Tabela | Descrição |
|--------|-----------|
| `cliente` | Dados cadastrais dos usuários |
| `livros` | Catálogo, informações bibliográficas, preços e estoque |
| `autores` | Fotografias, biografias e informações dos autores |
| `carrinhos` | Carrinhos persistentes e períodos de reserva |
| `itens_carrinho` | Produtos e quantidades reservadas |
| `pedidos` | Pedidos, status, valores e informações de entrega |
| `itens_pedido` | Produtos e quantidades de cada pedido |
| `cartao` | Cartões cadastrados para pagamentos simulados |
| `pagamentos_pedido` | Pagamentos vinculados aos pedidos |
| `carteira` | Informações financeiras e créditos |
| `endereco` | Endereços de entrega e cobrança |
| `cliente_favoritos` | Relacionamento entre clientes e livros favoritos |
| `cupons` | Cupons promocionais e de troca |
| `avaliacoes` | Avaliações e comentários dos livros |
| `logs` | Histórico de operações administrativas |
| `devolucao_fotos` | Fotografias anexadas às devoluções |
| `mensagens_chat` | Mensagens dos atendimentos |
| `notificacoes` | Notificações dos clientes |
| `icones` | Ícones armazenados no sistema |

### Catálogo Literário

O acervo contempla diferentes gêneros, autores, editoras, faixas de preço e extensões de leitura.

Entre as categorias disponíveis estão Romance, Terror, Ficção, Ficção Científica, Fantasia, Clássico, Infantil, Quadrinhos, Filosofia, Não-ficção, Suspense e Realismo Mágico.

Os registros incluem informações bibliográficas, características físicas, sinopses, imagens de capa e dados comerciais.

---

## 🔒 Autenticação e Segurança

- Autenticação JWT com tokens assinados.
- Tokens com validade de 24 horas.
- Hash de senhas utilizando BCrypt.
- Interceptor para inclusão automática do token nas requisições.
- Monitoramento da validade da sessão.
- Encerramento automático de sessões expiradas.
- Tratamento de respostas HTTP 401 e 403.
- Configuração de CORS para origens autorizadas.
- Separação de permissões por perfil.
- Validação de dados no frontend e backend.
- Consultas parametrizadas com JPA e Hibernate.
- Registro de operações administrativas.

### Perfis de Usuário

| Perfil | Permissões |
|--------|------------|
| Visitante | Catálogo, autores, recomendações e detalhes dos livros |
| CLIENTE | Compras, carrinho, pedidos, devoluções, favoritos, avaliações e perfil |
| ADMIN | Dashboard, livros, autores, estoque, pedidos, clientes, devoluções, relatórios e chats |

---

## 🛣️ Fluxos Principais

### 🛒 Fluxo de Compra

1. Cliente seleciona os livros desejados.
2. Sistema reserva as unidades por 10 minutos.
3. Cliente seleciona o endereço e os cartões.
4. Aplica cupons, quando disponíveis.
5. Finaliza o pedido e efetiva a baixa de estoque.
6. Administrador processa o pedido e registra o rastreamento.
7. Pedido é encaminhado para entrega.
8. Cliente confirma o recebimento.

### 🔄 Fluxo de Devolução

1. Cliente solicita a devolução de um pedido entregue.
2. Seleciona os itens e anexa fotografias.
3. Administrador analisa a solicitação.
4. Cliente realiza o envio dos produtos autorizados.
5. Administrador confirma o recebimento.
6. Sistema processa o cupom de troca ou reembolso.
7. Estoque e indicadores financeiros são atualizados conforme a operação.

### 💬 Fluxo de Chat

1. Cliente inicia um atendimento relacionado a um pedido.
2. Administrador visualiza a conversa.
3. As mensagens são transmitidas em tempo real via WebSocket.
4. Administrador encerra o atendimento.
5. A conversa permanece disponível no histórico e pode ser reativada.

---

## 📝 Regras de Negócio

### Livros e Autores

- A ativação dos livros é independente da disponibilidade em estoque.
- Livros ativos e esgotados podem permanecer visíveis no catálogo.
- Estoque disponível entre uma e três unidades é identificado como baixo.
- A inativação manual exige justificativa.
- Recomendações consideram apenas livros ativos e disponíveis.
- Autores precisam estar ativos e possuir fotografia e biografia para exibição pública.
- Autores associados a livros possuem restrições de exclusão.

### Clientes

- Senha com no mínimo oito caracteres, incluindo letras maiúsculas, minúsculas e caracteres especiais.
- Preenchimento dos dados cadastrais necessários para realizar compras.
- Endereços de entrega e cobrança cadastrados.
- Classificação baseada no histórico de compras.

### Carrinho e Vendas

- Reserva de estoque com duração de 10 minutos.
- Limite de três unidades por produto no carrinho.
- Novos itens não reiniciam o prazo da reserva.
- Apenas um cupom promocional por compra.
- Pagamento pode ser dividido entre múltiplos cartões.
- Valor mínimo de R$ 10,00 por cartão.
- Devoluções destinadas a pedidos entregues.
- Reposição de estoque sem duplicação de operações.

---

## 🐛 Tratamento de Erros

- Validação de formulários e máscaras de entrada.
- Mensagens de retorno via Toast.
- Indicadores de carregamento e estados vazios.
- Tratamento de imagens indisponíveis.
- Tratamento de sessões expiradas.
- Validação de disponibilidade e reservas.
- Tratamento de exceções no backend.
- Registro de operações relevantes.

---

## 📱 Responsividade

A aplicação possui interfaces adaptadas para computadores, tablets e celulares.

- Cabeçalho com menu responsivo.
- Catálogo com quantidade dinâmica de colunas.
- Filtros adaptados à largura da tela.
- Carrosséis com navegação horizontal.
- Formulários e modais responsivos.
- Tipografia e espaçamentos adaptáveis.
- Componentes de interface padronizados.

---

## 🌐 Arquitetura de Produção

```text
                   USUÁRIO
                      |
                      v
              FRONTEND ANGULAR
                    VERCEL
                      |
                      | HTTPS / API REST
                      | WEBSOCKET
                      v
              BACKEND SPRING BOOT
                  DIGITALOCEAN
                      |
                      | SPRING DATA JPA
                      | HIBERNATE
                      v
                    MYSQL
                  biblioteca
```

O frontend é hospedado na Vercel, enquanto o backend é executado em um servidor DigitalOcean, utilizando PM2 para gerenciamento do processo Java e MySQL para persistência dos dados.

---

## 📌 Sobre o Projeto

Projeto desenvolvido para demonstrar a implementação de um sistema de comércio eletrônico completo, explorando desenvolvimento full stack, arquitetura de software, persistência relacional, comunicação em tempo real, componentização e regras de negócio.

Os preços, estoques e pagamentos possuem finalidade demonstrativa. O sistema não utiliza uma integração certificada para processamento de pagamentos reais.

---

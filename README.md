
# 📚 Livraria Online - Sistema Completo de E-commerce

[![GitHub license](https://img.shields.io/github/license/MatheusAbib/e-commerce-livraria)](https://github.com/MatheusAbib/e-commerce-livraria/blob/main/LICENSE)
[![Java](https://img.shields.io/badge/Java-17-blue.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-21-red.svg)](https://angular.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black.svg)](https://vercel.com/)
[![DigitalOcean](https://img.shields.io/badge/Backend-DigitalOcean-0080FF.svg)](https://www.digitalocean.com/)

Sistema completo de livraria online desenvolvido com **Spring Boot** no backend e **Angular** no frontend. Permite gerenciar catálogo de livros, carrinho de compras, pedidos, pagamentos, devoluções, cupons de desconto, avaliações, notificações, atendimento em tempo real e relatórios administrativos.

> 🔗 **Acesse o projeto online:** (https://livrariaonline-gold.vercel.app/)

---

## 📋 Visão Geral

O sistema foi desenvolvido para oferecer uma experiência completa de e-commerce, atendendo tanto clientes quanto administradores.

Com uma interface responsiva, permite navegação pelo catálogo, gerenciamento de compras, acompanhamento de pedidos, solicitação de devoluções e comunicação entre clientes e administradores.

A aplicação também oferece um ambiente administrativo com gerenciamento de produtos, clientes, pedidos, estoque, devoluções, relatórios financeiros, indicadores de vendas e histórico de operações.

O projeto utiliza uma arquitetura separada entre frontend, backend e banco de dados, com comunicação por API REST e WebSocket.

### Principais características

- Interface responsiva desenvolvida com Angular.
- API REST construída com Spring Boot.
- Autenticação e autorização utilizando JWT.
- Persistência de dados com MySQL e Spring Data JPA.
- Comunicação em tempo real com WebSocket e STOMP.
- Gerenciamento de pedidos, pagamentos, cupons e devoluções.
- Dashboard administrativo com indicadores financeiros.
- Relatórios de vendas considerando cancelamentos e devoluções.
- Sistema de notificações e atendimento por chat.
- Hospedagem do frontend na Vercel e backend na DigitalOcean.

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
| MySQL | 8.0 | Banco de dados relacional |
| JWT | 0.12.x | Tokens de autenticação |
| Maven | 3.9.x | Gerenciamento de dependências |

### Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Angular | 21 | Framework frontend com componentes standalone |
| PrimeNG | 17.18.x | Biblioteca de componentes UI |
| PrimeIcons | 7.0.x | Biblioteca de ícones |
| Chart.js | 4.5.x | Gráficos e visualizações |
| STOMP | 7.3.x | Protocolo de comunicação WebSocket |
| RxJS | 7.8.x | Programação reativa |
| TypeScript | 5.9.x | Linguagem frontend |
| HTML5 | — | Estrutura das interfaces |
| CSS3 | — | Estilização e responsividade |

### Infraestrutura

| Tecnologia | Finalidade |
|------------|------------|
| DigitalOcean | Hospedagem do backend Spring Boot |
| Vercel | Hospedagem do frontend Angular |
| MySQL | Armazenamento persistente dos dados |
| PM2 | Gerenciamento do processo Java no servidor |
| Apache Maven | Compilação e empacotamento do backend |
| Angular CLI | Compilação do frontend para produção |
| Git e GitHub | Versionamento do código-fonte |

---

## ✨ Funcionalidades

### 👤 Para Clientes

#### Autenticação e Perfil

- ✅ Login e cadastro com validação.
- ✅ Recuperação de senha.
- ✅ Edição de perfil, incluindo nome, telefone e dados pessoais.
- ✅ Alteração de senha criptografada.
- ✅ Gerenciamento de múltiplos endereços de entrega.
- ✅ Gerenciamento de múltiplos cartões de crédito.

#### Catálogo de Livros

- ✅ Navegação por categoria.
- ✅ Busca por título, autor e editora.
- ✅ Filtros por preço e categoria.
- ✅ Paginação de resultados.
- ✅ Visualização de detalhes do livro.
- ✅ Avaliações e comentários de clientes.
- ✅ Consulta de disponibilidade e estoque.

#### Favoritos

- ✅ Adicionar e remover livros dos favoritos.
- ✅ Visualização da lista de favoritos.
- ✅ Badge com contador no cabeçalho.

#### Carrinho de Compras

- ✅ Adicionar e remover itens.
- ✅ Ajuste de quantidade.
- ✅ Validação de estoque em tempo real.
- ✅ Cálculo automático de frete.
- ✅ Aplicação de cupons de desconto.
- ✅ Atualização dos valores da compra.

#### Checkout e Pagamento

- ✅ Seleção de endereço de entrega.
- ✅ Pagamento com múltiplos cartões.
- ✅ Aplicação de cupons promocionais.
- ✅ Utilização de cupons de troca.
- ✅ Finalização de pedido.
- ✅ Cálculo dos valores da compra.

#### Pedidos

- ✅ Histórico completo de pedidos.
- ✅ Acompanhamento de status em tempo real.
- ✅ Detalhamento de cada pedido.
- ✅ Consulta de informações de entrega.
- ✅ Acompanhamento de devoluções vinculadas aos pedidos.

#### Devoluções

- ✅ Solicitação de devolução parcial ou total.
- ✅ Upload de múltiplas fotos na devolução.
- ✅ Acompanhamento do status da solicitação.
- ✅ Recebimento de cupom de troca.
- ✅ Consulta do histórico de devoluções.
- ✅ Acompanhamento do processo de recebimento e reembolso.

#### Cupons

- ✅ Cupons promocionais para clientes.
- ✅ Cupons de troca gerados automaticamente.
- ✅ Visualização de cupons disponíveis.
- ✅ Aplicação de cupons durante a compra.

#### Notificações

- ✅ Notificações em tempo real via WebSocket.
- ✅ Alertas sobre pedidos e devoluções.
- ✅ Badge com contador de notificações.

#### Chat

- ✅ Chat em tempo real com o vendedor.
- ✅ Histórico de conversas.
- ✅ Notificação de novas mensagens.
- ✅ Comunicação vinculada ao atendimento de pedidos.

---

### 🛡️ Para Administradores

#### Dashboard

- ✅ Métricas de vendas totais, mensais e diárias.
- ✅ Indicadores de faturamento e lucro.
- ✅ Gráficos de desempenho financeiro.
- ✅ Quantidade de pedidos por status.
- ✅ Produtos mais vendidos.
- ✅ Clientes com maior volume de compras.
- ✅ Acompanhamento dos resultados comerciais.
- ✅ Indicadores ajustados para considerar cancelamentos e devoluções concluídas.

#### Gerenciamento de Livros (CRUD)

- ✅ Cadastro de novos livros.
- ✅ Upload de imagem de capa.
- ✅ Edição de dados do livro.
- ✅ Ativação e inativação com justificativa.
- ✅ Reposição de estoque.
- ✅ Busca e filtros avançados.
- ✅ Exclusão de livros.
- ✅ Controle de disponibilidade dos produtos.

#### Gerenciamento de Pedidos

- ✅ Visualização de todos os pedidos.
- ✅ Atualização de status: Em Processamento → Em Trânsito → Entregue.
- ✅ Inserção de código de rastreamento de envio.
- ✅ Inserção de código de rastreamento de devolução.
- ✅ Detalhamento completo do pedido.
- ✅ Acompanhamento de pedidos cancelados e devolvidos.

#### Gerenciamento de Clientes

- ✅ Visualização de todos os clientes.
- ✅ Ativação e inativação de clientes.
- ✅ Edição de dados do cliente.
- ✅ Visualização de histórico de compras.

#### Gestão de Devoluções

- ✅ Visualização de solicitações de devolução.
- ✅ Aprovação ou reprovação de devoluções.
- ✅ Geração automática de cupom de troca.
- ✅ Confirmação de recebimento dos itens.
- ✅ Gerenciamento de fotos de devolução.
- ✅ Acompanhamento das etapas de devolução.
- ✅ Tratamento de devoluções parciais e totais.

#### Relatórios e Análises

- ✅ Log completo de operações de inserção e alteração.
- ✅ Ranking de clientes por compras.
- ✅ Gráficos de vendas por período.
- ✅ Análise de produtos mais vendidos.
- ✅ Indicadores financeiros por produto.
- ✅ Apuração de quantidades efetivamente vendidas.
- ✅ Cálculo de lucro considerando cancelamentos e devoluções concluídas.
- ✅ Consolidação de informações para acompanhamento administrativo.

#### Chats

- ✅ Visualização de todas as conversas.
- ✅ Resposta a mensagens dos clientes.
- ✅ Encerramento e reativação de atendimentos.
- ✅ Histórico de conversas.
- ✅ Gerenciamento de atendimentos ativos e encerrados.

---

## 📊 Relatórios Financeiros e Regras de Apuração

O sistema possui relatórios administrativos destinados ao acompanhamento das vendas, do desempenho dos produtos e dos resultados financeiros.

Os cálculos foram ajustados para diferenciar pedidos efetivamente vendidos de operações canceladas ou devolvidas.

### Cancelamentos

Pedidos originais cancelados não devem contribuir para os indicadores de vendas efetivas.

A exclusão desses pedidos dos cálculos evita que operações não concluídas sejam contabilizadas como receita ou quantidade vendida.

### Devoluções

O sistema considera as devoluções concluídas e vinculadas aos pedidos originais.

Quando uma devolução é concluída, os valores e as quantidades correspondentes são descontados dos indicadores aplicáveis.

Esse tratamento permite considerar devoluções parciais, nas quais apenas determinados itens ou quantidades são devolvidos.

### Quantidade efetivamente vendida

A quantidade efetivamente vendida considera os itens de pedidos válidos e desconta as unidades associadas a devoluções concluídas.

Dessa forma, os rankings e relatórios de produtos podem refletir melhor o volume de vendas após os ajustes.

### Lucro e resultados

Os relatórios financeiros foram ajustados para:

- Desconsiderar pedidos originais cancelados.
- Identificar devoluções concluídas vinculadas aos pedidos.
- Descontar os valores correspondentes às devoluções.
- Evitar a contabilização integral de produtos parcialmente devolvidos.
- Manter a consistência entre quantidade vendida e indicadores financeiros.

Essas regras são aplicadas na camada de backend, por meio das consultas de persistência e dos serviços responsáveis pelos relatórios.

---

## 🗄️ Estrutura do Banco de Dados

O sistema utiliza MySQL como banco de dados relacional, com persistência realizada por Spring Data JPA e Hibernate.

### Principais Tabelas

| Tabela | Descrição |
|--------|-----------|
| `cliente` | Dados dos usuários, incluindo nome, e-mail, senha, CPF e perfil |
| `livros` | Catálogo de livros, incluindo título, autor, preço, estoque e disponibilidade |
| `pedidos` | Pedidos realizados pelos clientes, incluindo status, valores e informações de entrega |
| `itens_pedido` | Itens de cada pedido, incluindo livro, quantidade, preço unitário e status |
| `cartao` | Cartões cadastrados pelos clientes |
| `pagamentos_pedido` | Pagamentos vinculados aos pedidos, incluindo cartões utilizados e valores |
| `carteira` | Informações financeiras e créditos associados aos clientes |
| `endereco` | Endereços de entrega e cobrança dos clientes |
| `cliente_favoritos` | Relacionamento entre clientes e seus livros favoritos |
| `cupons` | Cupons promocionais e de troca |
| `avaliacoes` | Avaliações e comentários dos livros realizados pelos clientes |
| `logs` | Histórico de operações e atividades administrativas |
| `devolucao_fotos` | Fotos anexadas às solicitações de devolução |
| `mensagens_chat` | Mensagens e informações dos atendimentos em tempo real |
| `notificacoes` | Notificações enviadas aos clientes |
| `icones` | Ícones armazenados no sistema, incluindo seus formatos e conteúdos |

### Relacionamentos e persistência

O banco de dados mantém os relacionamentos necessários para representar clientes, pedidos, produtos, pagamentos, avaliações, devoluções e atendimentos.

Entre as principais relações estão:

- Clientes e seus endereços.
- Clientes e seus cartões.
- Clientes e seus pedidos.
- Pedidos e seus respectivos itens.
- Livros e suas avaliações.
- Pedidos e processos de devolução.
- Devoluções e fotos anexadas.
- Clientes e mensagens de atendimento.


## 🔒 Autenticação e Perfis

### JWT Token

- Tokens com expiração de 24 horas.
- Armazenamento local no frontend.
- Interceptor para adicionar o token automaticamente às requisições.
- Controle de acesso de acordo com o perfil do usuário.

### Perfis de Usuário

| Perfil | Permissões |
|--------|------------|
| **CLIENTE** | Catálogo, carrinho, pedidos, devoluções, favoritos e perfil |
| **ADMIN** | Dashboard, gestão de livros, pedidos, clientes, devoluções, logs, rankings e chats |

---

## 🛣️ Fluxos Principais

### 🛒 Fluxo de Compra

1. Cliente navega pelo catálogo.
2. Adiciona livros ao carrinho.
3. Seleciona o endereço de entrega.
4. Adiciona cartões de crédito.
5. Aplica cupons de desconto.
6. Finaliza o pedido (`EM_PROCESSAMENTO`).
7. Administrador aprova e altera o status para `EM_TRANSPORTE`.
8. Administrador insere o código de rastreamento.
9. Cliente confirma o recebimento (`ENTREGUE`).

### 🔄 Fluxo de Devolução

1. Cliente solicita a devolução do pedido (`DEVOLUCAO`).
2. Seleciona os itens envolvidos na solicitação.
3. Anexa fotos para documentar a devolução.
4. Administrador analisa e autoriza (`DEVOLUCAO_AUTORIZADA`).
5. Administrador gera um cupom de troca, quando aplicável.
6. Cliente envia o pacote com código de rastreamento.
7. Administrador confirma o recebimento (`DEVOLVIDO`).
8. Cliente confirma o reembolso.

### 💬 Fluxo de Chat

1. Cliente inicia uma conversa sobre um pedido.
2. Administrador visualiza os chats pendentes.
3. Cliente e administrador trocam mensagens em tempo real via **WebSocket**.
4. Administrador encerra o atendimento e o chat é arquivado.
5. Cliente pode reabrir o chat.

---

## 🐛 Tratamento de Erros

- ✅ Validações em formulários.
- ✅ Mensagens amigáveis via **Toast (PrimeNG)**.
- ✅ Logs das ações importantes.
- ✅ Fallbacks para situações de erro.
- ✅ Tratamento global de exceções no backend.
- ✅ Validação das operações antes da persistência.
- ✅ Tratamento de respostas da API no frontend.

---

## 🔐 Segurança

- 🔑 Autenticação **JWT** com tokens assinados.
- 🔒 Senhas criptografadas com **BCrypt**.
- 🌐 **CORS** configurado para origens autorizadas.
- 📋 Logs de operações de escrita.
- ✅ Validação de dados nas diferentes camadas da aplicação.
- 🛡️ Utilização de **JPA/Hibernate** para persistência e consultas parametrizadas.
- 🧹 Tratamento e sanitização de entradas no frontend.
- 🔐 Separação de permissões entre clientes e administradores.

---

## 📝 Regras de Negócio

### 📚 Livros

- Dados obrigatórios: **autor, categoria, ano, título, editora, edição, ISBN, páginas, sinopse, dimensões e código de barras**.
- Inativação automática de livros sem estoque.
- Justificativa obrigatória para inativação manual.

### 👤 Clientes

- Senha com no mínimo **8 caracteres**, contendo:
  - Letras maiúsculas.
  - Letras minúsculas.
  - Caracteres especiais.
- Pelo menos um endereço de **cobrança** e um de **entrega**.
- Ranking numérico baseado no perfil de compras.

### 💰 Vendas

- Apenas **um cupom promocional** por compra.
- Pagamento pode ser dividido entre múltiplos cartões.
- Valor mínimo de **R$ 10,00 por cartão**.
- Troca permitida apenas para pedidos com status `ENTREGUE`.
- Cupom de troca gerado automaticamente após o recebimento da devolução.

### 📊 Relatórios

- Pedidos cancelados não são considerados vendas efetivas.
- Devoluções concluídas são descontadas dos indicadores financeiros aplicáveis.
- Devoluções parciais devem descontar apenas os itens e quantidades correspondentes.
- Quantidades efetivamente vendidas consideram os ajustes por devolução.
- Os cálculos são realizados no backend para manter a consistência dos relatórios.

---

### Arquitetura de Produção

```text
                   USUÁRIO
                      |
                      v
              FRONTEND ANGULAR
                    VERCEL
                      |
                      | HTTP / API REST
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

---
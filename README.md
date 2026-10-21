# 📚 Livraria Online - Sistema Completo de E-commerce

[![GitHub license](https://img.shields.io/github/license/MatheusAbib/e-commerce-livraria)](https://github.com/MatheusAbib/e-commerce-livraria/blob/main/LICENSE)
[![Java](https://img.shields.io/badge/Java-17-blue.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-21-red.svg)](https://angular.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)

Sistema completo de livraria online desenvolvido com **Spring Boot** (backend) e **Angular** (frontend). Permite gerenciar catálogo de livros, carrinho de compras, pedidos, devoluções, cupons de desconto e muito mais.

> 🔗 **Acesse online:** (https://livrariaonline-gold.vercel.app)

---

## 📋 Visão Geral

O sistema foi desenvolvido para oferecer uma experiência completa de e-commerce, atendendo tanto clientes quanto administradores. Com uma interface moderna e responsiva, permite navegação intuitiva, compras seguras e gestão eficiente do negócio.

---

## 🚀 Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Java | 17 | Linguagem principal |
| Spring Boot | 3.5.x | Framework principal |
| Spring Security | 3.5.x | Autenticação e autorização |
| Spring Data JPA | 3.5.x | ORM e persistência |
| Spring WebSocket | 3.5.x | Comunicação em tempo real |
| MySQL | 8.0 | Banco de dados relacional |
| JWT | 0.12.x | Tokens de autenticação |
| Maven | 3.9.x | Gerenciador de dependências |

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Angular | 21 | Framework frontend (standalone) |
| PrimeNG | 17.18.x | Biblioteca de componentes UI |
| PrimeIcons | 7.0.x | Ícones |
| Chart.js | 4.5.x | Gráficos e visualizações |
| STOMP | 7.3.x | Protocolo WebSocket |
| RxJS | 7.8.x | Programação reativa |
| TypeScript | 5.9.x | Linguagem frontend |

---

## ✨ Funcionalidades

### 👤 Para Clientes

#### Autenticação e Perfil
- ✅ Login e cadastro com validação
- ✅ Recuperação de senha
- ✅ Edição de perfil (nome, telefone, dados pessoais)
- ✅ Alteração de senha criptografada
- ✅ Gerenciamento de múltiplos endereços de entrega
- ✅ Gerenciamento de múltiplos cartões de crédito

#### Catálogo de Livros
- ✅ Navegação por categoria
- ✅ Busca por título, autor e editora
- ✅ Filtros por preço e categoria
- ✅ Paginação de resultados
- ✅ Visualização de detalhes do livro
- ✅ Avaliações e comentários de clientes

#### Favoritos
- ✅ Adicionar/remover livros dos favoritos
- ✅ Visualização de lista de favoritos
- ✅ Badge com contador no header

#### Carrinho de Compras
- ✅ Adicionar/remover itens
- ✅ Ajuste de quantidade
- ✅ Validação de estoque em tempo real
- ✅ Cálculo automático de frete
- ✅ Aplicação de cupons de desconto

#### Checkout e Pagamento
- ✅ Seleção de endereço de entrega
- ✅ Pagamento com múltiplos cartões
- ✅ Aplicação de cupons promocionais
- ✅ Finalização de pedido

#### Pedidos
- ✅ Histórico completo de pedidos
- ✅ Acompanhamento de status em tempo real
- ✅ Detalhamento de cada pedido

#### Devoluções
- ✅ Solicitação de devolução (parcial ou total)
- ✅ Upload de fotos na devolução
- ✅ Acompanhamento do status da devolução
- ✅ Recebimento de cupom de troca

#### Cupons
- ✅ Cupons promocionais para clientes
- ✅ Cupons de troca gerados automaticamente
- ✅ Visualização de cupons disponíveis

#### Notificações
- ✅ Notificações em tempo real via WebSocket
- ✅ Alertas sobre pedidos e devoluções
- ✅ Badge com contador de notificações

#### Chat
- ✅ Chat em tempo real com o vendedor
- ✅ Histórico de conversas
- ✅ Notificação de novas mensagens

---

### 🛡️ Para Administradores

#### Dashboard
- ✅ Métricas de vendas (total, mensal, diário)
- ✅ Gráficos de lucro e faturamento
- ✅ Quantidade de pedidos por status
- ✅ Produtos mais vendidos
- ✅ Clientes com maior volume de compras

#### Gerenciamento de Livros (CRUD)
- ✅ Cadastro de novos livros
- ✅ Upload de imagem de capa
- ✅ Edição de dados do livro
- ✅ Ativação e inativação com justificativa
- ✅ Reposição de estoque
- ✅ Busca e filtros avançados
- ✅ Exclusão de livros

#### Gerenciamento de Pedidos
- ✅ Visualização de todos os pedidos
- ✅ Atualização de status (Em Processamento → Em Trânsito → Entregue)
- ✅ Inserção de código de rastreamento de envio
- ✅ Inserção de código de rastreamento de devolução
- ✅ Detalhamento completo do pedido

#### Gerenciamento de Clientes
- ✅ Visualização de todos os clientes
- ✅ Ativação e inativação de clientes
- ✅ Edição de dados do cliente
- ✅ Visualização de histórico de compras

#### Gestão de Devoluções
- ✅ Visualização de solicitações de devolução
- ✅ Aprovação ou reprovação de devoluções
- ✅ Geração automática de cupom de troca
- ✅ Confirmação de recebimento dos itens
- ✅ Gerenciamento de fotos de devolução

#### Relatórios e Análises
- ✅ Log completo de operações (inserção/alteração)
- ✅ Ranking de clientes por compras
- ✅ Gráficos de vendas por período
- ✅ Análise de produtos mais vendidos

#### Chats
- ✅ Visualização de todas as conversas
- ✅ Resposta a mensagens dos clientes
- ✅ Encerramento e reativação de atendimentos
- ✅ Histórico de conversas

---

## 🗄️ Estrutura do Banco de Dados

### Principais Tabelas

| Tabela | Descrição |
|--------|-----------|
| `clientes` | Dados dos usuários (nome, email, senha, CPF) |
| `livros` | Catálogo de livros (título, autor, preço, estoque) |
| `pedidos` | Pedidos realizados pelos clientes |
| `itens_pedido` | Itens de cada pedido (livro, quantidade, preço) |
| `cartoes` | Cartões de crédito dos clientes |
| `enderecos` | Endereços de entrega dos clientes |
| `cupons` | Cupons de desconto e troca |
| `avaliacoes` | Avaliações e comentários dos livros |
| `logs` | Histórico de ações do sistema |
| `devolucao_fotos` | Fotos anexadas nas devoluções |
| `mensagens_chat` | Mensagens do chat em tempo real |

---

## 📡 Endpoints Principais da API

### Livros
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/livros` | Listar todos os livros |
| GET | `/api/livros/ativos` | Listar livros ativos |
| GET | `/api/livros/{id}` | Buscar livro por ID |
| POST | `/api/livros/com-imagem` | Criar livro com imagem |
| PUT | `/api/livros/{id}/com-imagem` | Atualizar livro com imagem |
| DELETE | `/api/livros/{id}` | Excluir livro |
| PUT | `/api/livros/{id}/inativar` | Inativar livro |
| PUT | `/api/livros/{id}/ativar` | Ativar livro |
| GET | `/api/livros/consulta` | Consulta com filtros |

### Clientes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/clientes` | Cadastrar cliente |
| POST | `/api/clientes/login` | Login |
| GET | `/api/clientes/{id}` | Buscar cliente |
| PUT | `/api/clientes/{id}` | Atualizar cliente |
| PUT | `/api/clientes/{id}/senha` | Alterar senha |
| POST | `/api/clientes/{id}/favoritos` | Adicionar favorito |
| DELETE | `/api/clientes/{id}/favoritos/{livroId}` | Remover favorito |
| GET | `/api/clientes/{id}/favoritos` | Listar favoritos |

### Pedidos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/pedidos` | Criar pedido |
| GET | `/api/pedidos/cliente/{id}` | Pedidos do cliente |
| GET | `/api/pedidos/{id}` | Buscar pedido |
| PUT | `/api/pedidos/{id}/status` | Atualizar status |
| POST | `/api/pedidos/{id}/devolucao` | Solicitar devolução |
| PUT | `/api/pedidos/{id}/confirmar-entrega` | Confirmar entrega |

### Avaliações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/avaliacoes` | Criar avaliação |
| GET | `/api/avaliacoes/livro/{id}` | Avaliações do livro |
| GET | `/api/avaliacoes/livro/{id}/resumo` | Resumo de avaliações |

---

## 🔒 Autenticação e Perfis

### JWT Token
- Tokens com expiração de 24h
- Armazenamento local no frontend
- Interceptor para adicionar token automaticamente

### Perfis de Usuário

| Perfil | Permissões |
|--------|------------|
| **CLIENTE** | Catálogo, carrinho, pedidos, devoluções, favoritos, perfil |
| **ADMIN** | Dashboard, gestão de livros, pedidos, clientes, devoluções, logs, ranking, chats |

---


## 🛣️ Fluxos Principais

### 🛒 Fluxo de Compra

1. Cliente navega pelo catálogo
2. Adiciona livros ao carrinho
3. Seleciona endereço de entrega
4. Adiciona cartões de crédito
5. Aplica cupons de desconto
6. Finaliza o pedido (`EM_PROCESSAMENTO`)
7. Admin aprova e altera o status para `EM_TRANSPORTE`
8. Admin insere o código de rastreamento
9. Cliente confirma o recebimento (`ENTREGUE`)

### 🔄 Fluxo de Devolução

1. Cliente solicita a devolução do pedido (`DEVOLUCAO`)
2. Cliente anexa fotos
3. Admin analisa e autoriza (`DEVOLUCAO_AUTORIZADA`)
4. Admin gera cupom de troca (opcional)
5. Cliente envia o pacote com código de rastreamento
6. Admin confirma o recebimento (`DEVOLVIDO`)
7. Cliente confirma o reembolso

### 💬 Fluxo de Chat

1. Cliente inicia uma conversa sobre um pedido
2. Admin visualiza os chats pendentes
3. Cliente e Admin trocam mensagens em tempo real via **WebSocket**
4. Admin encerra o atendimento e o chat é arquivado
5. Cliente pode reabrir o chat

---

## 🐛 Tratamento de Erros

- ✅ Validações em todos os formulários
- ✅ Mensagens amigáveis via **Toast (PrimeNG)**
- ✅ Logs de todas as ações importantes
- ✅ Fallbacks para situações de erro
- ✅ Tratamento global de exceções no backend

---

## 🔐 Segurança

- 🔑 Autenticação **JWT** com tokens assinados
- 🔒 Senhas criptografadas com **BCrypt**
- 🌐 **CORS** configurado apenas para origens confiáveis
- 📋 Logs completos de todas as operações de escrita
- ✅ Validação de dados em todas as camadas
- 🛡️ Proteção contra injeção SQL utilizando **JPA/Hibernate**
- 🧹 Sanitização de entradas no frontend

---

## 📝 Regras de Negócio

### 📚 Livros

- Dados obrigatórios: **autor, categoria, ano, título, editora, edição, ISBN, páginas, sinopse, dimensões e código de barras**
- Inativação automática de livros sem estoque
- Justificativa obrigatória para inativação manual

### 👤 Clientes

- Senha com no mínimo **8 caracteres**, contendo:
  - Letras maiúsculas
  - Letras minúsculas
  - Caracteres especiais
- Pelo menos um endereço de **cobrança** e um de **entrega**
- Ranking numérico baseado no perfil de compras

### 💰 Vendas

- Apenas **um cupom promocional** por compra
- Pagamento pode ser dividido entre múltiplos cartões
- Valor mínimo de **R$ 10,00 por cartão**
- Troca permitida apenas para pedidos com status `ENTREGUE`
- Cupom de troca gerado automaticamente após o recebimento da devolução

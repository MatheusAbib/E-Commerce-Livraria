package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.model.Livro;
import com.biblioteca.biblioteca_online.model.Log;
import com.biblioteca.biblioteca_online.repository.LivroRepository;
import com.biblioteca.biblioteca_online.specs.LivroSpecification;

import jakarta.persistence.EntityManager;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeMap;

@Service
@Transactional(isolation = Isolation.READ_COMMITTED)
public class LivroService {

    private final LivroRepository livroRepository;
    private final LogService logService;
    private final EstoqueReservaService estoqueReservaService;
    private final EntityManager entityManager;
    private final AutorService autorService;

    public LivroService(
            LivroRepository livroRepository,
            LogService logService,
            EstoqueReservaService estoqueReservaService,
            EntityManager entityManager,
            AutorService autorService) {

        this.livroRepository = livroRepository;
        this.logService = logService;
        this.estoqueReservaService = estoqueReservaService;
        this.entityManager = entityManager;
        this.autorService = autorService;
    }

    @Transactional(readOnly = true)
    public List<Livro> listarTodos() {
        return preencherInformacoesEstoque(
                livroRepository.findAll()
        );
    }

    public Livro salvar(Livro livro) {
        if (livro.getId() != null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Utilize a operação de atualização para livros existentes."
            );
        }

        validarPrecoCusto(livro.getPrecoCusto());

        if (livro.getEstoque() == null || livro.getEstoque() <= 0) {
            throw new IllegalArgumentException(
                    "Quantidade em estoque deve ser maior que zero."
            );
        }

        if (livro.getDataEntrada() == null) {
            livro.setDataEntrada(LocalDate.now());
        }

        calcularPrecoVenda(livro, new BigDecimal("0.10"));

        atualizarStatusPorEstoque(livro);

        var autorCadastrado = autorService.garantirAutor(livro.getAutor());

        if (autorCadastrado != null) {
            livro.setAutor(autorCadastrado.getNome());
        }

        Livro salvo = livroRepository.saveAndFlush(livro);

        registrarLog(
                "livro_adicionado",
                "Livro \"" + salvo.getTitulo()
                        + "\" adicionado. Estoque: "
                        + salvo.getEstoque()
                        + ", Preço: R$ "
                        + salvo.getPrecoVenda(),
                "info"
        );

        return preencherInformacoesEstoque(salvo);
    }

    @Transactional(readOnly = true)
    public Optional<Livro> buscarPorId(Long id) {
        return livroRepository.findById(id)
                .map(this::preencherInformacoesEstoque);
    }

    public Livro atualizar(Long id, Livro novoLivro) {
        return atualizarLivro(
                id,
                novoLivro,
                false,
                null
        );
    }

    public Livro atualizarComImagem(
            Long id,
            Livro novoLivro,
            String novaImagemUrl) {

        return atualizarLivro(
                id,
                novoLivro,
                true,
                novaImagemUrl
        );
    }

    private Livro atualizarLivro(
            Long id,
            Livro novoLivro,
            boolean atualizarCamposCompletos,
            String novaImagemUrl) {

        Livro existente = estoqueReservaService.bloquearLivro(id);

        validarEstoqueFisico(
                existente,
                novoLivro.getEstoque()
        );

        validarPrecoCusto(novoLivro.getPrecoCusto());

        String tituloAntigo = existente.getTitulo();
        Integer estoqueAntigo = existente.getEstoque();
        BigDecimal precoAntigo = existente.getPrecoVenda();

        existente.setTitulo(novoLivro.getTitulo());
        var autorCadastrado = autorService.garantirAutor(novoLivro.getAutor());

        existente.setAutor(
                autorCadastrado == null
                        ? novoLivro.getAutor()
                        : autorCadastrado.getNome()
        );
        existente.setEditora(novoLivro.getEditora());
        existente.setCategoria(novoLivro.getCategoria());
        existente.setPrecoCusto(novoLivro.getPrecoCusto());
        existente.setEstoque(novoLivro.getEstoque());
        existente.setDataEntrada(novoLivro.getDataEntrada());

        if (atualizarCamposCompletos) {
            existente.setEdicao(novoLivro.getEdicao());
            existente.setIsbn(novoLivro.getIsbn());
            existente.setPaginas(novoLivro.getPaginas());
            existente.setSinopse(novoLivro.getSinopse());
            existente.setAltura(novoLivro.getAltura());
            existente.setLargura(novoLivro.getLargura());
            existente.setProfundidade(novoLivro.getProfundidade());
            existente.setPeso(novoLivro.getPeso());
            existente.setCodigoBarras(novoLivro.getCodigoBarras());

            if (novaImagemUrl != null) {
                existente.setImagemUrl(novaImagemUrl);
            }

            calcularPrecoVenda(
                    existente,
                    new BigDecimal("0.10")
            );
        } else {
            calcularPrecoVenda(
                    existente,
                    new BigDecimal("0.25")
            );
        }

        atualizarStatusPorEstoque(existente);

        Livro salvo = livroRepository.saveAndFlush(existente);

        StringBuilder detalhes = new StringBuilder();

        detalhes.append("Livro \"")
                .append(tituloAntigo)
                .append("\" editado: ");

        if (!Objects.equals(tituloAntigo, salvo.getTitulo())) {
            detalhes.append("Título: ")
                    .append(tituloAntigo)
                    .append(" → ")
                    .append(salvo.getTitulo())
                    .append("; ");
        }

        if (!Objects.equals(estoqueAntigo, salvo.getEstoque())) {
            detalhes.append("Estoque: ")
                    .append(estoqueAntigo)
                    .append(" → ")
                    .append(salvo.getEstoque())
                    .append("; ");
        }

        if (precoAntigo != null
                && salvo.getPrecoVenda() != null
                && precoAntigo.compareTo(salvo.getPrecoVenda()) != 0) {

            detalhes.append("Preço: R$ ")
                    .append(precoAntigo)
                    .append(" → R$ ")
                    .append(salvo.getPrecoVenda())
                    .append("; ");
        }

        registrarLog(
                "livro_editado",
                detalhes.toString(),
                "info"
        );

        return preencherInformacoesEstoque(salvo);
    }

    public Livro atualizarImagem(Long id, String imagemUrl) {
        Livro livro = estoqueReservaService.bloquearLivro(id);

        livro.setImagemUrl(imagemUrl);

        Livro salvo = livroRepository.saveAndFlush(livro);

        registrarLog(
                "livro_editado",
                "Imagem do livro \"" + salvo.getTitulo()
                        + "\" atualizada.",
                "info"
        );

        return preencherInformacoesEstoque(salvo);
    }

    public void inativar(Long id, String motivo) {
        alterarStatus(id, false, motivo);
    }

    public void ativar(Long id, String motivo) {
        alterarStatus(id, true, motivo);
    }

    public void alterarStatus(
            Long id,
            boolean ativo,
            String motivo) {

        if (motivo == null || motivo.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o motivo da alteração de status."
            );
        }

        Livro livro = estoqueReservaService.bloquearLivro(id);

        if (!ativo) {
            validarAusenciaDeReservas(livro);

            livro.setAtivo(false);
            livro.setMotivoInativacao(motivo);
            livro.setMotivoAtivacao(null);
        } else {
            if (estoqueReservaService.obterEstoqueFisico(livro) <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Não é possível ativar um livro com estoque zerado."
                );
            }

            livro.setAtivo(true);
            livro.setMotivoAtivacao(motivo);
            livro.setMotivoInativacao(null);
        }

        livroRepository.saveAndFlush(livro);

        registrarLog(
                ativo ? "livro_ativado" : "livro_inativado",
                "Livro \"" + livro.getTitulo() + "\" "
                        + (ativo ? "ativado" : "inativado")
                        + ". Motivo: " + motivo,
                ativo ? "success" : "warning"
        );
    }

    @Transactional(readOnly = true)
    public List<Livro> listarAtivos() {
        return preencherInformacoesEstoque(
                livroRepository.findByAtivo(true)
        );
    }

    @Transactional(readOnly = true)
    public List<Livro> consultarComFiltros(
            String autor,
            String editora,
            String categoria,
            String ordenarPor,
            String direcao) {

        Specification<Livro> spec = Specification.allOf(
                LivroSpecification.autorContem(autor),
                LivroSpecification.editoraContem(editora),
                LivroSpecification.categoriaContem(categoria)
        );

        Sort.Direction ordem = "desc".equalsIgnoreCase(direcao)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Sort sort = Sort.by(
                ordem,
                ordenarPor != null ? ordenarPor : "id"
        );

        return preencherInformacoesEstoque(
                livroRepository.findAll(spec, sort)
        );
    }

    public void excluir(Long id) {
        excluirERetornarImagem(id);
    }

    public String excluirERetornarImagem(Long id) {
        Livro livro = estoqueReservaService.bloquearLivro(id);

        validarAusenciaDeReservas(livro);

        Long quantidadeItensCarrinho = entityManager.createQuery(
                """
                SELECT COUNT(i)
                FROM ItemCarrinho i
                WHERE i.livro.id = :livroId
                """,
                Long.class
        )
                .setParameter("livroId", id)
                .getSingleResult();

        if (quantidadeItensCarrinho > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Aguarde a limpeza das reservas expiradas antes de excluir este livro."
            );
        }

        String imagemUrl = livro.getImagemUrl();

        livroRepository.delete(livro);
        livroRepository.flush();

        return imagemUrl;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> consultarComFiltrosComContagem(
            String titulo,
            String autor,
            String editora,
            String isbn,
            String categoria,
            BigDecimal precoMin,
            BigDecimal precoMax,
            Integer estoqueMin,
            Integer estoqueMax,
            String status,
            String ordenarPor,
            String direcao) {

        Specification<Livro> spec = Specification.allOf(
                LivroSpecification.tituloContem(titulo),
                LivroSpecification.autorContem(autor),
                LivroSpecification.editoraContem(editora),
                LivroSpecification.isbnContem(isbn),
                LivroSpecification.categoriaContem(categoria),
                LivroSpecification.precoVendaEntre(precoMin, precoMax),
                LivroSpecification.estoqueEntre(estoqueMin, estoqueMax),
                LivroSpecification.statusIgual(status)
        );

        Sort.Direction ordem = "desc".equalsIgnoreCase(direcao)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Sort sort = Sort.by(
                ordem,
                ordenarPor != null ? ordenarPor : "id"
        );

        List<Livro> livrosFiltrados = preencherInformacoesEstoque(
                livroRepository.findAll(spec, sort)
        );

        long countFiltered = livrosFiltrados.size();
        long countTotal = livroRepository.count();

        Map<String, Object> resultado = new HashMap<>();

        resultado.put("countFiltered", countFiltered);
        resultado.put("countTotal", countTotal);
        resultado.put("livros", livrosFiltrados);

        return resultado;
    }

    public void processarCompra(List<Map<String, Object>> itens) {
        if (itens == null || itens.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A lista de itens está vazia."
            );
        }

        Map<Long, Integer> quantidadesPorLivro = new TreeMap<>();

        for (Map<String, Object> item : itens) {
            Long livroId = Long.valueOf(
                    item.get("id").toString()
            );

            Integer quantidade = Integer.valueOf(
                    item.get("quantidade").toString()
            );

            validarQuantidadePositiva(quantidade);

            quantidadesPorLivro.merge(
                    livroId,
                    quantidade,
                    Math::addExact
            );
        }

        for (Map.Entry<Long, Integer> entrada :
                quantidadesPorLivro.entrySet()) {

            processarCompra(
                    entrada.getKey(),
                    entrada.getValue()
            );
        }
    }

    public void processarCompra(
            Long livroId,
            Integer quantidade) {

        validarQuantidadePositiva(quantidade);

        Livro livro = estoqueReservaService.bloquearLivro(livroId);

        estoqueReservaService.validarDisponibilidade(
                livro,
                null,
                quantidade,
                Instant.now()
        );

        descontarEstoqueFisico(livro, quantidade);
    }

    @Transactional(
            propagation = org.springframework.transaction.annotation.Propagation.MANDATORY
    )
    public void consumirEstoqueReservado(
            Livro livro,
            Integer quantidade) {

        validarQuantidadePositiva(quantidade);

        if (livro == null || livro.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Livro inválido."
            );
        }

        Livro livroBloqueado = estoqueReservaService.bloquearLivro(
                livro.getId()
        );

        descontarEstoqueFisico(
                livroBloqueado,
                quantidade
        );
    }

    private void descontarEstoqueFisico(
            Livro livro,
            Integer quantidade) {

        int estoqueAtual = estoqueReservaService
                .obterEstoqueFisico(livro);

        if (quantidade > estoqueAtual) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Estoque insuficiente para o livro: "
                            + livro.getTitulo()
            );
        }

        livro.setEstoque(estoqueAtual - quantidade);

        atualizarStatusPorEstoque(livro);

        livroRepository.saveAndFlush(livro);
    }

    public Livro reporEstoque(
            Long livroId,
            Integer quantidade,
            String motivo) {

        validarQuantidadePositiva(quantidade);

        Livro livro = estoqueReservaService.bloquearLivro(livroId);

        int estoqueAntigo = estoqueReservaService
                .obterEstoqueFisico(livro);

        int novoEstoque = Math.addExact(
                estoqueAntigo,
                quantidade
        );

        livro.setEstoque(novoEstoque);

        atualizarStatusPorEstoque(livro);

        Livro livroSalvo = livroRepository.saveAndFlush(livro);

        registrarLog(
                "livro_reposicao_estoque",
                "Livro \"" + livro.getTitulo()
                        + "\" teve estoque reposto. Antes: "
                        + estoqueAntigo
                        + ", Depois: "
                        + livroSalvo.getEstoque()
                        + ". Motivo: "
                        + motivo,
                "info"
        );

        return preencherInformacoesEstoque(livroSalvo);
    }

    @Transactional(readOnly = true)
    public List<String> listarCategorias() {
        return livroRepository.findDistinctCategorias();
    }

    private Livro preencherInformacoesEstoque(Livro livro) {
        Instant agora = Instant.now();

        int estoqueFisico = estoqueReservaService
                .obterEstoqueFisico(livro);

        int estoqueReservado = estoqueReservaService
                .obterEstoqueReservado(
                        livro.getId(),
                        agora
                );

        livro.setEstoqueReservado(estoqueReservado);

        livro.setEstoqueDisponivel(
                Math.max(
                        0,
                        estoqueFisico - estoqueReservado
                )
        );

        return livro;
    }

    private List<Livro> preencherInformacoesEstoque(
            List<Livro> livros) {

        if (livros.isEmpty()) {
            return livros;
        }

        Map<Long, Integer> reservas = estoqueReservaService
                .obterReservasPorLivro(Instant.now());

        for (Livro livro : livros) {
            int estoqueFisico = estoqueReservaService
                    .obterEstoqueFisico(livro);

            int estoqueReservado = reservas.getOrDefault(
                    livro.getId(),
                    0
            );

            livro.setEstoqueReservado(estoqueReservado);

            livro.setEstoqueDisponivel(
                    Math.max(
                            0,
                            estoqueFisico - estoqueReservado
                    )
            );
        }

        return livros;
    }

    private void validarEstoqueFisico(
            Livro livro,
            Integer novoEstoque) {

        if (novoEstoque == null || novoEstoque < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O estoque não pode ser negativo."
            );
        }

        int estoqueReservado = estoqueReservaService
                .obterEstoqueReservado(
                        livro.getId(),
                        Instant.now()
                );

        if (novoEstoque < estoqueReservado) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Não é possível reduzir o estoque para "
                            + novoEstoque
                            + ". Existem "
                            + estoqueReservado
                            + " unidades reservadas no momento."
            );
        }
    }

    private void validarAusenciaDeReservas(Livro livro) {
        int estoqueReservado = estoqueReservaService
                .obterEstoqueReservado(
                        livro.getId(),
                        Instant.now()
                );

        if (estoqueReservado > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Este livro possui "
                            + estoqueReservado
                            + " unidades reservadas. Aguarde a conclusão ou expiração das reservas."
            );
        }
    }

    private void validarQuantidadePositiva(Integer quantidade) {
        if (quantidade == null || quantidade <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A quantidade deve ser maior que zero."
            );
        }
    }

    private void validarPrecoCusto(BigDecimal precoCusto) {
        if (precoCusto == null
                || precoCusto.compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Preço de custo deve ser maior que zero."
            );
        }
    }

    private void calcularPrecoVenda(
            Livro livro,
            BigDecimal margemLucro) {

        BigDecimal precoVenda = livro.getPrecoCusto()
                .multiply(
                        BigDecimal.ONE.add(margemLucro)
                );

        livro.setPrecoVenda(
                precoVenda.setScale(
                        2,
                        RoundingMode.HALF_UP
                )
        );
    }

    private void atualizarStatusPorEstoque(Livro livro) {
        if (livro.getEstoque() == null || livro.getEstoque() <= 0) {
            if (livro.isAtivo()
                    || livro.getMotivoInativacao() == null
                    || livro.getMotivoInativacao().isBlank()) {

                livro.setMotivoInativacao("Estoque zerado.");
            }

            livro.setAtivo(false);
            livro.setMotivoAtivacao(null);
        } else {
            boolean foiInativadoPorEstoque =
                    "Estoque zerado.".equals(
                            livro.getMotivoInativacao()
                    );

            if (!livro.isAtivo() && foiInativadoPorEstoque) {
                livro.setAtivo(true);

                livro.setMotivoAtivacao(
                        "Estoque reposto, produto reativado automaticamente."
                );

                livro.setMotivoInativacao(null);
            }
        }
    }

    private void registrarLog(
            String action,
            String details,
            String level) {

        Log log = new Log();

        log.setUserId(null);
        log.setUserName("Sistema");
        log.setAction(action);
        log.setDetails(details);
        log.setLevel(level);

        logService.salvarLog(log);
    }
}
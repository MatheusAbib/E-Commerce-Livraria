package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.model.Livro;
import com.biblioteca.biblioteca_online.service.LivroService;
import com.biblioteca.biblioteca_online.service.FileStorageService;
import com.biblioteca.biblioteca_online.service.MaisVendidosService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.Set;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/livros")
public class LivroController {

    private static final Logger logger =
            LoggerFactory.getLogger(LivroController.class);

    private final LivroService livroService;
    private final MaisVendidosService maisVendidosService;

    @Autowired
    private FileStorageService fileStorageService;

    public LivroController(
            LivroService livroService,
            MaisVendidosService maisVendidosService) {

        this.livroService = livroService;
        this.maisVendidosService = maisVendidosService;
    }

    private Livro preencherQuantidadeVendida(
            Livro livro,
            Map<Long, Long> quantidadesVendidas) {

        livro.setQuantidadeVendida(
                quantidadesVendidas.getOrDefault(
                        livro.getId(),
                        0L
                )
        );

        return livro;
    }

    private List<Livro> preencherQuantidadesVendidas(
            List<Livro> livros) {

        Map<Long, Long> quantidadesVendidas =
                maisVendidosService.buscarQuantidadesVendidas();

        livros.forEach(livro ->
                preencherQuantidadeVendida(
                        livro,
                        quantidadesVendidas
                )
        );

        return livros;
    }

    private Livro preencherQuantidadeVendida(Livro livro) {
        return preencherQuantidadeVendida(
                livro,
                maisVendidosService.buscarQuantidadesVendidas()
        );
    }

    @PostMapping
    public ResponseEntity<Livro> salvar(
            @RequestBody Livro livro) {

        Livro livroSalvo = livroService.salvar(livro);

        return ResponseEntity.ok(
                preencherQuantidadeVendida(livroSalvo)
        );
    }

    @PostMapping("/com-imagem")
    public ResponseEntity<?> salvarComImagem(
            @RequestPart("livro") Livro livro,
            @RequestPart(
                    value = "imagem",
                    required = false
            ) MultipartFile imagem) {

        String nomeArquivo = null;
        Livro livroSalvo;

        try {
            if (imagem != null && !imagem.isEmpty()) {
                nomeArquivo = fileStorageService.storeFile(imagem);
                livro.setImagemUrl(nomeArquivo);
            }

            livroSalvo = livroService.salvar(livro);

        } catch (ResponseStatusException e) {
            excluirImagemComSeguranca(nomeArquivo);
            throw e;

        } catch (Exception e) {
            excluirImagemComSeguranca(nomeArquivo);

            return ResponseEntity.badRequest().body(
                    "Erro ao salvar livro: " + mensagemAmigavel(e)
            );
        }

        return ResponseEntity.ok(
                preencherQuantidadeVendida(livroSalvo)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Livro> atualizar(
            @PathVariable Long id,
            @RequestBody Livro livro) {

        Livro livroAtualizado = livroService.atualizar(
                id,
                livro
        );

        return ResponseEntity.ok(
                preencherQuantidadeVendida(livroAtualizado)
        );
    }

    @PutMapping("/{id}/com-imagem")
    public ResponseEntity<?> atualizarComImagem(
            @PathVariable Long id,
            @RequestPart("livro") Livro livro,
            @RequestPart(
                    value = "imagem",
                    required = false
            ) MultipartFile imagem) {

        Optional<Livro> livroExistente =
                livroService.buscarPorId(id);

        if (livroExistente.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String imagemAnterior =
                livroExistente.get().getImagemUrl();

        String novaImagem = null;
        Livro livroAtualizado;

        try {
            if (imagem != null && !imagem.isEmpty()) {
                novaImagem = fileStorageService.storeFile(imagem);
            }

            livroAtualizado = livroService.atualizarComImagem(
                    id,
                    livro,
                    novaImagem
            );

        } catch (ResponseStatusException e) {
            excluirImagemComSeguranca(novaImagem);
            throw e;

        } catch (Exception e) {
            excluirImagemComSeguranca(novaImagem);

            return ResponseEntity.badRequest().body(
                    "Erro ao atualizar livro: " + mensagemAmigavel(e)
            );
        }

        if (novaImagem != null
                && !Objects.equals(imagemAnterior, novaImagem)) {

            excluirImagemComSeguranca(imagemAnterior);
        }

        return ResponseEntity.ok(
                preencherQuantidadeVendida(livroAtualizado)
        );
    }

    @PostMapping("/{id}/imagem")
    public ResponseEntity<?> uploadImagem(
            @PathVariable Long id,
            @RequestParam("imagem") MultipartFile imagem) {

        Optional<Livro> livroExistente =
                livroService.buscarPorId(id);

        if (livroExistente.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (imagem == null || imagem.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    "Selecione uma imagem válida."
            );
        }

        String imagemAnterior =
                livroExistente.get().getImagemUrl();

        String novaImagem = null;
        Livro livroAtualizado;

        try {
            novaImagem = fileStorageService.storeFile(imagem);

            livroAtualizado = livroService.atualizarImagem(
                    id,
                    novaImagem
            );

        } catch (ResponseStatusException e) {
            excluirImagemComSeguranca(novaImagem);
            throw e;

        } catch (Exception e) {
            excluirImagemComSeguranca(novaImagem);

            return ResponseEntity.badRequest().body(
                    "Erro ao fazer upload da imagem: "
                            + e.getMessage()
            );
        }

        if (!Objects.equals(imagemAnterior, novaImagem)) {
            excluirImagemComSeguranca(imagemAnterior);
        }

        return ResponseEntity.ok(
                preencherQuantidadeVendida(livroAtualizado)
        );
    }

    private String mensagemAmigavel(Exception e) {
        if (e instanceof org.springframework.dao.DataIntegrityViolationException) {
            String original = ((org.springframework.dao.DataIntegrityViolationException) e).getMostSpecificCause().getMessage();
            if (original != null) {
                java.util.regex.Matcher matcher = java.util.regex.Pattern
                        .compile("Column '(\\w+)' cannot be null")
                        .matcher(original);
                if (matcher.find()) {
                    return "O campo " + rotuloColuna(matcher.group(1)) + " é obrigatório.";
                }
                if (original.contains("Duplicate entry")) {
                    return "Já existe um registro com esses dados.";
                }
            }
            return "Dados inválidos. Verifique os campos e tente novamente.";
        }
        return "Não foi possível concluir a operação. Verifique os dados e tente novamente.";
    }

    private String rotuloColuna(String coluna) {
        return switch (coluna) {
            case "edicao" -> "Edição";
            case "paginas" -> "Páginas";
            case "altura" -> "Altura";
            case "largura" -> "Largura";
            case "profundidade" -> "Profundidade";
            case "peso" -> "Peso";
            case "preco_custo" -> "Preço de custo";
            case "preco_venda" -> "Preço de venda";
            case "estoque" -> "Estoque";
            case "data_entrada" -> "Data de entrada";
            case "titulo" -> "Título";
            case "autor" -> "Autor";
            case "isbn" -> "ISBN";
            case "codigo_barras" -> "Código de barras";
            default -> coluna;
        };
    }
    private void excluirImagemComSeguranca(String imagemUrl) {
        if (imagemUrl == null || imagemUrl.isBlank()) {
            return;
        }

        try {
            fileStorageService.deleteFile(imagemUrl);
        } catch (Exception e) {
            logger.warn(
                    "Não foi possível excluir a imagem {}.",
                    imagemUrl,
                    e
            );
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @PathVariable Long id) {

        String imagemUrl =
                livroService.excluirERetornarImagem(id);

        excluirImagemComSeguranca(imagemUrl);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/inativar")
    public ResponseEntity<Void> inativar(
            @PathVariable Long id,
            @RequestParam String motivo) {

        livroService.inativar(id, motivo);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/ativar")
    public ResponseEntity<Void> ativar(
            @PathVariable Long id,
            @RequestParam String motivo) {

        livroService.ativar(id, motivo);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ativos")
    public ResponseEntity<List<Livro>> listarAtivos() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(
                        preencherQuantidadesVendidas(
                                livroService.listarAtivos()
                        )
                );
    }

    @GetMapping("/mais-vendidos")
    public ResponseEntity<List<Livro>> listarMaisVendidos() {
        List<Long> idsMaisVendidos =
                maisVendidosService.buscarIdsMaisVendidos();

        List<Livro> livrosDisponiveis = livroService
                .listarAtivos()
                .stream()
                .filter(livro ->
                        livro.getEstoqueDisponivel() != null
                                && livro.getEstoqueDisponivel() > 0
                )
                .toList();

        Map<Long, Livro> livrosPorId = livrosDisponiveis
                .stream()
                .collect(Collectors.toMap(
                        Livro::getId,
                        Function.identity(),
                        (primeiro, segundo) -> primeiro
                ));

        List<Livro> resultado = new ArrayList<>();
        Set<Long> idsSelecionados = new HashSet<>();

        for (Long id : idsMaisVendidos) {
            Livro livro = livrosPorId.get(id);

            if (livro != null && idsSelecionados.add(id)) {
                resultado.add(livro);
            }

            if (resultado.size() == 5) {
                break;
            }
        }

        if (resultado.size() < 5) {
            livrosDisponiveis.stream()
                    .filter(livro ->
                            !idsSelecionados.contains(livro.getId())
                    )
                    .sorted(
                            Comparator.comparing(Livro::getId)
                    )
                    .limit(5 - resultado.size())
                    .forEach(livro -> {
                        resultado.add(livro);
                        idsSelecionados.add(livro.getId());
                    });
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(
                        preencherQuantidadesVendidas(resultado)
                );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Livro> buscarPorId(
            @PathVariable Long id) {

        Map<Long, Long> quantidadesVendidas =
                maisVendidosService.buscarQuantidadesVendidas();

        return livroService.buscarPorId(id)
                .map(livro ->
                        preencherQuantidadeVendida(
                                livro,
                                quantidadesVendidas
                        )
                )
                .map(livro ->
                        ResponseEntity.ok()
                                .cacheControl(CacheControl.noStore())
                                .body(livro)
                )
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    @GetMapping("/consulta")
    public ResponseEntity<Map<String, Object>> consultaComContagem(
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) String autor,
            @RequestParam(required = false) String editora,
            @RequestParam(required = false) String isbn,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) BigDecimal precoMin,
            @RequestParam(required = false) BigDecimal precoMax,
            @RequestParam(required = false) Integer estoqueMin,
            @RequestParam(required = false) Integer estoqueMax,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String ordenarPor,
            @RequestParam(required = false) String direcao) {

        Map<String, Object> resultado =
                livroService.consultarComFiltrosComContagem(
                        titulo,
                        autor,
                        editora,
                        isbn,
                        categoria,
                        precoMin,
                        precoMax,
                        estoqueMin,
                        estoqueMax,
                        status,
                        ordenarPor,
                        direcao
                );

        Map<Long, Long> quantidadesVendidas =
                maisVendidosService.buscarQuantidadesVendidas();

        Object livros = resultado.get("livros");

        if (livros instanceof List<?> lista) {
            for (Object item : lista) {
                if (item instanceof Livro livro) {
                    preencherQuantidadeVendida(
                            livro,
                            quantidadesVendidas
                    );
                }
            }
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(resultado);
    }

    @PostMapping("/change-status/{id}")
    public ResponseEntity<?> changeStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        Object ativoInformado = payload.get("ativo");
        Object motivoInformado = payload.get("motivo");

        if (!(ativoInformado instanceof Boolean ativo)
                || !(motivoInformado instanceof String motivo)
                || motivo.isBlank()) {

            return ResponseEntity.badRequest().body(
                    "Campos 'ativo' e 'motivo' são obrigatórios."
            );
        }

        livroService.alterarStatus(
                id,
                ativo,
                motivo
        );

        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/repor-estoque")
    public ResponseEntity<Livro> reporEstoque(
            @PathVariable Long id,
            @RequestParam Integer quantidade,
            @RequestParam String motivo) {

        if (quantidade == null || quantidade <= 0) {
            return ResponseEntity.badRequest().body(null);
        }

        Livro livroAtualizado = livroService.reporEstoque(
                id,
                quantidade,
                motivo
        );

        return ResponseEntity.ok(
                preencherQuantidadeVendida(livroAtualizado)
        );
    }

    @PutMapping("/{id}/repor-estoque-json")
    public ResponseEntity<Livro> reporEstoqueJson(
            @PathVariable Long id,
            @RequestBody ReporEstoqueRequest request) {

        if (request.getQuantidade() == null
                || request.getQuantidade() <= 0) {

            return ResponseEntity.badRequest().body(null);
        }

        Livro livroAtualizado = livroService.reporEstoque(
                id,
                request.getQuantidade(),
                request.getMotivo()
        );

        return ResponseEntity.ok(
                preencherQuantidadeVendida(livroAtualizado)
        );
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<String>> listarCategorias() {
        return ResponseEntity.ok(
                livroService.listarCategorias()
        );
    }

    @GetMapping
    public ResponseEntity<List<Livro>> listarTodos() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(
                        preencherQuantidadesVendidas(
                                livroService.listarTodos()
                        )
                );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> tratarErro(
            ResponseStatusException exception) {

        String mensagem = exception.getReason() == null
                ? "Não foi possível realizar a operação."
                : exception.getReason();

        return ResponseEntity
                .status(exception.getStatusCode())
                .body(Map.of(
                        "mensagem", mensagem,
                        "status", exception.getStatusCode().value()
                ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> tratarDadosInvalidos(
            IllegalArgumentException exception) {

        String mensagem = exception.getMessage() == null
                ? "Dados inválidos."
                : exception.getMessage();

        return ResponseEntity.badRequest().body(
                Map.of(
                        "mensagem", mensagem,
                        "status", 400
                )
        );
    }

    public static class ReporEstoqueRequest {

        private Integer quantidade;
        private String motivo;

        public Integer getQuantidade() {
            return quantidade;
        }

        public void setQuantidade(Integer quantidade) {
            this.quantidade = quantidade;
        }

        public String getMotivo() {
            return motivo;
        }

        public void setMotivo(String motivo) {
            this.motivo = motivo;
        }
    }
}
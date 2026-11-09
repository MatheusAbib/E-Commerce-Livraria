
package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.model.Livro;
import com.biblioteca.biblioteca_online.repository.LivroRepository;
import com.biblioteca.biblioteca_online.service.LivroService;
import com.biblioteca.biblioteca_online.service.FileStorageService;
import com.biblioteca.biblioteca_online.service.MaisVendidosService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/livros")
public class LivroController {

    private final LivroService livroService;
    private final MaisVendidosService maisVendidosService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private LivroRepository livroRepository;

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
                quantidadesVendidas.getOrDefault(livro.getId(), 0L)
        );
        return livro;
    }

    private List<Livro> preencherQuantidadesVendidas(List<Livro> livros) {
        Map<Long, Long> quantidadesVendidas =
                maisVendidosService.buscarQuantidadesVendidas();

        livros.forEach(livro ->
                preencherQuantidadeVendida(livro, quantidadesVendidas)
        );

        return livros;
    }

    @PostMapping
    public ResponseEntity<Livro> salvar(@RequestBody Livro livro) {
        Livro livroSalvo = livroService.salvar(livro);
        return ResponseEntity.ok(
                preencherQuantidadeVendida(
                        livroSalvo,
                        maisVendidosService.buscarQuantidadesVendidas()
                )
        );
    }

    @PostMapping("/com-imagem")
    public ResponseEntity<?> salvarComImagem(
            @RequestPart("livro") Livro livro,
            @RequestPart(value = "imagem", required = false) MultipartFile imagem) {

        try {
            if (imagem != null && !imagem.isEmpty()) {
                String nomeArquivo = fileStorageService.storeFile(imagem);
                livro.setImagemUrl(nomeArquivo);
            }

            Livro livroSalvo = livroService.salvar(livro);
            return ResponseEntity.ok(
                    preencherQuantidadeVendida(
                            livroSalvo,
                            maisVendidosService.buscarQuantidadesVendidas()
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao salvar livro: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Livro> atualizar(@PathVariable Long id, @RequestBody Livro livro) {
        Livro livroAtualizado = livroService.atualizar(id, livro);

        return ResponseEntity.ok(
                preencherQuantidadeVendida(
                        livroAtualizado,
                        maisVendidosService.buscarQuantidadesVendidas()
                )
        );
    }

    @PutMapping("/{id}/com-imagem")
    public ResponseEntity<?> atualizarComImagem(
            @PathVariable Long id,
            @RequestPart("livro") Livro livro,
            @RequestPart(value = "imagem", required = false) MultipartFile imagem) {

        try {
            Optional<Livro> livroExistente = livroService.buscarPorId(id);
            if (livroExistente.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Livro livroAtual = livroExistente.get();

            atualizarCamposLivro(livroAtual, livro);

            if (imagem != null && !imagem.isEmpty()) {
                if (livroAtual.getImagemUrl() != null) {
                    try {
                        fileStorageService.deleteFile(livroAtual.getImagemUrl());
                    } catch (Exception e) {
                    }
                }

                String nomeArquivo = fileStorageService.storeFile(imagem);
                livroAtual.setImagemUrl(nomeArquivo);
            }

            Livro livroAtualizado = livroService.salvar(livroAtual);

            return ResponseEntity.ok(
                    preencherQuantidadeVendida(
                            livroAtualizado,
                            maisVendidosService.buscarQuantidadesVendidas()
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao atualizar livro: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/imagem")
    public ResponseEntity<?> uploadImagem(
            @PathVariable Long id,
            @RequestParam("imagem") MultipartFile imagem) {

        try {
            Optional<Livro> livro = livroService.buscarPorId(id);
            if (livro.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Livro livroAtual = livro.get();

            if (livroAtual.getImagemUrl() != null) {
                try {
                    fileStorageService.deleteFile(livroAtual.getImagemUrl());
                } catch (Exception e) {
                }
            }

            String nomeArquivo = fileStorageService.storeFile(imagem);
            livroAtual.setImagemUrl(nomeArquivo);

            Livro livroAtualizado = livroService.salvar(livroAtual);

            return ResponseEntity.ok(
                    preencherQuantidadeVendida(
                            livroAtualizado,
                            maisVendidosService.buscarQuantidadesVendidas()
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao fazer upload da imagem: " + e.getMessage());
        }
    }

    private void atualizarCamposLivro(Livro livroAtual, Livro livroNovo) {
        livroAtual.setTitulo(livroNovo.getTitulo());
        livroAtual.setAutor(livroNovo.getAutor());
        livroAtual.setEditora(livroNovo.getEditora());
        livroAtual.setCategoria(livroNovo.getCategoria());
        livroAtual.setEdicao(livroNovo.getEdicao());
        livroAtual.setIsbn(livroNovo.getIsbn());
        livroAtual.setPaginas(livroNovo.getPaginas());
        livroAtual.setSinopse(livroNovo.getSinopse());
        livroAtual.setAltura(livroNovo.getAltura());
        livroAtual.setLargura(livroNovo.getLargura());
        livroAtual.setProfundidade(livroNovo.getProfundidade());
        livroAtual.setPeso(livroNovo.getPeso());
        livroAtual.setCodigoBarras(livroNovo.getCodigoBarras());
        livroAtual.setPrecoCusto(livroNovo.getPrecoCusto());
        livroAtual.setPrecoVenda(livroNovo.getPrecoVenda());
        livroAtual.setEstoque(livroNovo.getEstoque());
        livroAtual.setDataEntrada(livroNovo.getDataEntrada());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        Optional<Livro> livro = livroService.buscarPorId(id);

        if (livro.isPresent() && livro.get().getImagemUrl() != null) {
            try {
                fileStorageService.deleteFile(livro.get().getImagemUrl());
            } catch (Exception e) {
            }
        }

        livroService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/inativar")
    public ResponseEntity<Void> inativar(@PathVariable Long id, @RequestParam String motivo) {
        livroService.inativar(id, motivo);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/ativar")
    public ResponseEntity<Void> ativar(@PathVariable Long id, @RequestParam String motivo) {
        livroService.ativar(id, motivo);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ativos")
    public ResponseEntity<List<Livro>> listarAtivos() {
        return ResponseEntity.ok(
                preencherQuantidadesVendidas(livroService.listarAtivos())
        );
    }

    @GetMapping("/mais-vendidos")
    public ResponseEntity<List<Livro>> listarMaisVendidos() {
        List<Long> idsMaisVendidos = maisVendidosService.buscarIdsMaisVendidos();

        List<Livro> livrosDisponiveis = livroService.listarAtivos()
                .stream()
                .filter(livro -> livro.getEstoque() != null && livro.getEstoque() > 0)
                .toList();

        Map<Long, Livro> livrosPorId = livrosDisponiveis.stream()
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

            if (resultado.size() == 3) {
                break;
            }
        }

        if (resultado.size() < 3) {
            livrosDisponiveis.stream()
                    .filter(livro -> !idsSelecionados.contains(livro.getId()))
                    .sorted(Comparator.comparing(Livro::getId))
                    .limit(3 - resultado.size())
                    .forEach(livro -> {
                        resultado.add(livro);
                        idsSelecionados.add(livro.getId());
                    });
        }

        return ResponseEntity.ok(
                preencherQuantidadesVendidas(resultado)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Livro> buscarPorId(@PathVariable Long id) {
        Map<Long, Long> quantidadesVendidas =
                maisVendidosService.buscarQuantidadesVendidas();

        return livroService.buscarPorId(id)
                .map(livro -> preencherQuantidadeVendida(livro, quantidadesVendidas))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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

        Map<String, Object> resultado = livroService.consultarComFiltrosComContagem(
                titulo, autor, editora, isbn, categoria, precoMin, precoMax,
                estoqueMin, estoqueMax, status, ordenarPor, direcao
        );

        Map<Long, Long> quantidadesVendidas =
                maisVendidosService.buscarQuantidadesVendidas();

        Object livros = resultado.get("livros");

        if (livros instanceof List<?> lista) {
            for (Object item : lista) {
                if (item instanceof Livro livro) {
                    preencherQuantidadeVendida(livro, quantidadesVendidas);
                }
            }
        }

        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/change-status/{id}")
    public ResponseEntity<?> changeStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<Livro> livroOpt = livroRepository.findById(id);

        if (!livroOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Livro livro = livroOpt.get();

        Boolean ativo = (Boolean) payload.get("ativo");
        String motivo = (String) payload.get("motivo");

        if (ativo == null || motivo == null || motivo.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Campos 'ativo' e 'motivo' são obrigatórios.");
        }

        livro.setAtivo(ativo);

        if (ativo) {
            livro.setMotivoAtivacao(motivo);
            livro.setMotivoInativacao(null);
        } else {
            livro.setMotivoInativacao(motivo);
            livro.setMotivoAtivacao(null);
        }

        livroRepository.save(livro);

        return ResponseEntity.ok().build();
    }



@PostMapping("/processar-pedido")
public ResponseEntity<?> processarPedido(@RequestBody Map<String, Object> payload) {
    try {
        Object dados = payload.get("itens");

        if (!(dados instanceof List<?> lista)) {
            return ResponseEntity.badRequest().body("Lista de itens inválida.");
        }

        List<Map<String, Object>> itens = new ArrayList<>();

        for (Object item : lista) {
            if (!(item instanceof Map<?, ?> mapa)) {
                return ResponseEntity.badRequest().body("Item do pedido inválido.");
            }

            Map<String, Object> itemConvertido = new java.util.HashMap<>();

            for (Map.Entry<?, ?> entrada : mapa.entrySet()) {
                if (!(entrada.getKey() instanceof String chave)) {
                    return ResponseEntity.badRequest().body("Chave do item inválida.");
                }

                itemConvertido.put(chave, entrada.getValue());
            }

            itens.add(itemConvertido);
        }

        livroService.processarCompra(itens);
        return ResponseEntity.ok().build();

    } catch (RuntimeException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}



    @PutMapping("/{id}/repor-estoque")
    public ResponseEntity<Livro> reporEstoque(
            @PathVariable Long id,
            @RequestParam Integer quantidade,
            @RequestParam String motivo) {

        if (quantidade == null || quantidade <= 0) {
            return ResponseEntity.badRequest().body(null);
        }

        try {
            Livro livroAtualizado = livroService.reporEstoque(id, quantidade, motivo);

            return ResponseEntity.ok(
                    preencherQuantidadeVendida(
                            livroAtualizado,
                            maisVendidosService.buscarQuantidadesVendidas()
                    )
            );
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/repor-estoque-json")
    public ResponseEntity<Livro> reporEstoqueJson(
            @PathVariable Long id,
            @RequestBody ReporEstoqueRequest request) {

        if (request.getQuantidade() == null || request.getQuantidade() <= 0) {
            return ResponseEntity.badRequest().body(null);
        }

        try {
            Livro livroAtualizado = livroService.reporEstoque(
                    id,
                    request.getQuantidade(),
                    request.getMotivo()
            );

            return ResponseEntity.ok(
                    preencherQuantidadeVendida(
                            livroAtualizado,
                            maisVendidosService.buscarQuantidadesVendidas()
                    )
            );
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<String>> listarCategorias() {
        return ResponseEntity.ok(livroService.listarCategorias());
    }

    @GetMapping
    public ResponseEntity<List<Livro>> listarTodos() {
        return ResponseEntity.ok(
                preencherQuantidadesVendidas(livroService.listarTodos())
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

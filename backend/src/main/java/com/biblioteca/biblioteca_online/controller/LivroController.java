package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.model.Livro;
import com.biblioteca.biblioteca_online.repository.LivroRepository;
import com.biblioteca.biblioteca_online.service.LivroService;
import com.biblioteca.biblioteca_online.service.FileStorageService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/livros")
public class LivroController {

    private final LivroService livroService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private LivroRepository livroRepository;

    public LivroController(LivroService livroService) {
        this.livroService = livroService;
    }

    @PostMapping
    public ResponseEntity<Livro> salvar(@RequestBody Livro livro) {
        return ResponseEntity.ok(livroService.salvar(livro));
    }

    // NOVO ENDPOINT PARA SALVAR COM IMAGEM
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
            return ResponseEntity.ok(livroSalvo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao salvar livro: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Livro> atualizar(@PathVariable Long id, @RequestBody Livro livro) {
        return ResponseEntity.ok(livroService.atualizar(id, livro));
    }

    // NOVO ENDPOINT PARA ATUALIZAR COM IMAGEM
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
            return ResponseEntity.ok(livroAtualizado);
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

            // Salva nova imagem
            String nomeArquivo = fileStorageService.storeFile(imagem);
            livroAtual.setImagemUrl(nomeArquivo);

            Livro livroAtualizado = livroService.salvar(livroAtual);
            return ResponseEntity.ok(livroAtualizado);
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
        return ResponseEntity.ok(livroService.listarAtivos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Livro> buscarPorId(@PathVariable Long id) {
        return livroService.buscarPorId(id)
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
                titulo, autor, editora, isbn, categoria, precoMin, precoMax, estoqueMin, estoqueMax, status, ordenarPor,
                direcao);
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
            List<Map<String, Object>> itens = (List<Map<String, Object>>) payload.get("itens");
            livroService.processarCompra(itens);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/repor-estoque")
    public ResponseEntity<Livro> reporEstoque(@PathVariable Long id, @RequestParam Integer quantidade,
            @RequestParam String motivo) {
        if (quantidade == null || quantidade <= 0) {
            return ResponseEntity.badRequest().body(null);
        }

        try {
            Livro livroAtualizado = livroService.reporEstoque(id, quantidade, motivo);
            return ResponseEntity.ok(livroAtualizado);
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
            Livro livroAtualizado = livroService.reporEstoque(id, request.getQuantidade(), request.getMotivo());
            return ResponseEntity.ok(livroAtualizado);
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
        return ResponseEntity.ok(livroService.listarTodos());
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

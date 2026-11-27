package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.model.Autor;
import com.biblioteca.biblioteca_online.service.AutorService;
import com.biblioteca.biblioteca_online.service.FileStorageService;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/autores")
public class AutorController {

    private static final Logger logger =
            LoggerFactory.getLogger(AutorController.class);

    private final AutorService autorService;
    private final FileStorageService fileStorageService;

    public AutorController(
            AutorService autorService,
            FileStorageService fileStorageService) {
        this.autorService = autorService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/publicos")
    public ResponseEntity<List<Autor>> listarPublicos() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(autorService.listarPublicos());
    }

    @GetMapping
    public ResponseEntity<List<Autor>> listarTodos() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(autorService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Autor> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(autorService.buscarPorId(id));
    }

    @GetMapping("/{id}/imagem")
    public ResponseEntity<byte[]> obterImagem(@PathVariable Long id) {
        Autor autor = autorService.buscarPorId(id);

        if (autor.getImagem() == null || autor.getImagem().length == 0) {
            return ResponseEntity.notFound().build();
        }

        byte[] bytes = autor.getImagem();

        org.springframework.http.MediaType tipo;
        if (bytes.length >= 2 && bytes[0] == (byte) 0x89 && bytes[1] == (byte) 0x50) {
            tipo = org.springframework.http.MediaType.IMAGE_PNG;
        } else {
            tipo = org.springframework.http.MediaType.IMAGE_JPEG;
        }

        return ResponseEntity.ok()
                .contentType(tipo)
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)))
                .body(bytes);
    }
    @PostMapping("/importar")
    public ResponseEntity<Map<String, Integer>> importar() {
        return ResponseEntity.ok(
                Map.of("importados", autorService.importarAutores())
        );
    }

    @PostMapping
    public ResponseEntity<Autor> cadastrar(
            @RequestPart("autor") AutorRequest dados,
            @RequestPart(value = "imagem", required = false)
            MultipartFile imagem) {

        byte[] bytesImagem = armazenarImagem(imagem);

        try {
            Autor autor = autorService.cadastrar(
                    dados.nome(),
                    dados.biografiaUrl(),
                    bytesImagem,
                    dados.ativo()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(autor);
        } catch (RuntimeException e) {
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Autor> atualizar(
            @PathVariable Long id,
            @RequestPart("autor") AutorRequest dados,
            @RequestPart(value = "imagem", required = false)
            MultipartFile imagem) {

        

        byte[] novaImagem = armazenarImagem(imagem);

        Autor autor;

        try {
            autor = autorService.atualizar(
                    id,
                    dados.nome(),
                    dados.biografiaUrl(),
                    novaImagem,
                    dados.ativo()
            );
        } catch (RuntimeException e) {
            throw e;
        }

        

        return ResponseEntity.ok(autor);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Autor> alterarStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest dados) {

        if (dados.ativo() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o status do autor."
            );
        }

        return ResponseEntity.ok(
                autorService.alterarStatus(id, dados.ativo())
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        autorService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    private byte[] armazenarImagem(MultipartFile imagem) {
        if (imagem == null || imagem.isEmpty()) {
            return null;
        }

        if (imagem.getSize() > 5L * 1024 * 1024) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A fotografia deve possuir até 5 MB."
            );
        }

        String nome = imagem.getOriginalFilename();

        if (nome == null || !nome.contains(".")) {
            throw imagemInvalida();
        }

        String extensao = nome.substring(nome.lastIndexOf('.') + 1)
                .toLowerCase(Locale.ROOT);

        if (!Set.of("jpg", "jpeg", "png").contains(extensao)) {
            throw imagemInvalida();
        }

        try (ImageInputStream entrada = ImageIO.createImageInputStream(
                imagem.getInputStream())) {

            if (entrada == null) {
                throw imagemInvalida();
            }

            Iterator<ImageReader> leitores = ImageIO.getImageReaders(entrada);

            if (!leitores.hasNext()) {
                throw imagemInvalida();
            }

            ImageReader leitor = leitores.next();

            try {
                leitor.setInput(entrada, true, true);

                String formato = leitor.getFormatName()
                        .toLowerCase(Locale.ROOT);

                boolean jpeg = formato.equals("jpeg")
                        && Set.of("jpg", "jpeg").contains(extensao);

                boolean png = formato.equals("png")
                        && extensao.equals("png");

                int largura = leitor.getWidth(0);
                int altura = leitor.getHeight(0);

                if ((!jpeg && !png)
                        || largura <= 0
                        || altura <= 0
                        || largura > 6000
                        || altura > 6000
                        || (long) largura * altura > 16000000L) {
                    throw imagemInvalida();
                }

                leitor.read(0);
            } finally {
                leitor.dispose();
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw imagemInvalida();
        }

        try {
            return imagem.getBytes();
        } catch (Exception e) {
            throw imagemInvalida();
        }
    }

    private ResponseStatusException imagemInvalida() {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Selecione uma fotografia JPG ou PNG válida."
        );
    }

    private void excluirImagemComSeguranca(String nome) {
        if (nome == null || nome.isBlank()) {
            return;
        }

        if (!nome.matches(
                "(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|jpeg|png)"
        )) {
            return;
        }

        try {
            fileStorageService.deleteFile(nome);
        } catch (Exception e) {
            logger.warn("Não foi possível excluir a fotografia.", e);
        }
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> tratarErro(
            ResponseStatusException exception) {

        String mensagem = exception.getReason() == null
                ? "Não foi possível realizar a operação."
                : exception.getReason();

        return ResponseEntity.status(exception.getStatusCode())
                .body(Map.of(
                        "mensagem", mensagem,
                        "status", exception.getStatusCode().value()
                ));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> tratarConflito() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of(
                        "mensagem", "O cadastro possui dados duplicados ou conflitantes.",
                        "status", 409
                ));
    }

    public record AutorRequest(
            String nome,
            String biografiaUrl,
            Boolean ativo
    ) {}

    public record StatusRequest(Boolean ativo) {}
}

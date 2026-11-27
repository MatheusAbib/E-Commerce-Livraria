package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.model.Autor;
import com.biblioteca.biblioteca_online.model.Livro;
import com.biblioteca.biblioteca_online.repository.AutorRepository;
import com.biblioteca.biblioteca_online.repository.LivroRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional
public class AutorService {

    private final AutorRepository autorRepository;
    private final LivroRepository livroRepository;

    public AutorService(
            AutorRepository autorRepository,
            LivroRepository livroRepository) {
        this.autorRepository = autorRepository;
        this.livroRepository = livroRepository;
    }

    public Autor garantirAutor(String nome) {
        if (nome == null || nome.isBlank()) {
            return null;
        }

        String nomeLimpo = limparNome(nome);
        String chave = gerarChave(nomeLimpo);

        return autorRepository.findByChaveNome(chave)
                .orElseGet(() -> {
                    Autor autor = new Autor();
                    autor.setNome(nomeLimpo);
                    autor.setChaveNome(chave);
                    autor.setAtivo(true);
                    return autorRepository.saveAndFlush(autor);
                });
    }

    public int importarAutores() {
        List<String> nomes = livroRepository.findDistinctAutores();

        Map<String, Autor> existentes = new HashMap<>();

        for (Autor autor : autorRepository.findAll()) {
            existentes.put(autor.getChaveNome(), autor);
        }

        int importados = 0;

        for (String nome : nomes) {
            if (nome == null || nome.isBlank()) {
                continue;
            }

            String nomeLimpo = limparNome(nome);
            String chave = gerarChave(nomeLimpo);

            if (existentes.containsKey(chave)) {
                continue;
            }

            Autor autor = new Autor();
            autor.setNome(nomeLimpo);
            autor.setChaveNome(chave);
            autor.setAtivo(true);

            Autor salvo = autorRepository.save(autor);

            existentes.put(chave, salvo);
            importados++;
        }

        autorRepository.flush();

        return importados;
    }

    @Transactional(readOnly = true)
    public List<Autor> listarTodos() {
        return preencherContagens(
                autorRepository.findAllByOrderByNomeAsc()
        );
    }

    @Transactional(readOnly = true)
    public List<Autor> listarPublicos() {
        return preencherContagens(
                autorRepository.findByAtivoTrueOrderByNomeAsc()
                        .stream()
                        .filter(Autor::isCompleto)
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    public Autor buscarPorId(Long id) {
        return preencherContagens(
                List.of(buscarAutor(id))
        ).get(0);
    }

    public Autor cadastrar(
            String nome,
            String biografiaUrl,
            byte[] imagem,
            Boolean ativo) {

        String nomeLimpo = limparNome(nome);
        String chave = gerarChave(nomeLimpo);

        validarDuplicidade(chave, null);

        Autor autor = new Autor();

        autor.setNome(nomeLimpo);
        autor.setChaveNome(chave);
        autor.setBiografiaUrl(validarBiografia(biografiaUrl));
        autor.setImagem(imagem);
        autor.setAtivo(ativo == null || ativo);

        return preencherContagens(
                List.of(autorRepository.saveAndFlush(autor))
        ).get(0);
    }

    public Autor atualizar(
            Long id,
            String nome,
            String biografiaUrl,
            byte[] novaImagem,
            Boolean ativo) {

        Autor autor = buscarAutor(id);

        String nomeLimpo = limparNome(nome);
        String novaChave = gerarChave(nomeLimpo);
        String chaveAnterior = autor.getChaveNome();
        String linkValidado = validarBiografia(biografiaUrl);

        validarDuplicidade(novaChave, id);

        if (!autor.getNome().equals(nomeLimpo)) {
            List<Livro> livros = livroRepository.findAll()
                    .stream()
                    .filter(livro -> correspondeAutor(livro, chaveAnterior))
                    .toList();

            for (Livro livro : livros) {
                livro.setAutor(nomeLimpo);
            }

            livroRepository.saveAll(livros);
        }

        autor.setNome(nomeLimpo);
        autor.setChaveNome(novaChave);
        autor.setBiografiaUrl(linkValidado);

        if (novaImagem != null && novaImagem.length > 0) {
            autor.setImagem(novaImagem);
        }

        if (ativo != null) {
            autor.setAtivo(ativo);
        }

        return preencherContagens(
                List.of(autorRepository.saveAndFlush(autor))
        ).get(0);
    }

    public Autor alterarStatus(Long id, boolean ativo) {
        Autor autor = buscarAutor(id);

        autor.setAtivo(ativo);

        return preencherContagens(
                List.of(autorRepository.saveAndFlush(autor))
        ).get(0);
    }

    public void excluir(Long id) {
        Autor autor = buscarAutor(id);

        boolean possuiLivros = livroRepository.findAll()
                .stream()
                .anyMatch(livro ->
                        correspondeAutor(livro, autor.getChaveNome())
                );

        if (possuiLivros) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Este autor possui livros associados. Inative o cadastro em vez de excluí-lo."
            );
        }

                autorRepository.delete(autor);
        autorRepository.flush();

            }

    private Autor buscarAutor(Long id) {
        return autorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Autor não encontrado."
                ));
    }

    private void validarDuplicidade(String chave, Long id) {
        autorRepository.findByChaveNome(chave)
                .ifPresent(autor -> {
                    if (!autor.getId().equals(id)) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Já existe um autor cadastrado com esse nome."
                        );
                    }
                });
    }

    private List<Autor> preencherContagens(List<Autor> autores) {
        Map<String, Long> contagens = new HashMap<>();

        for (String nome : livroRepository.findNomesAutores()) {
            if (nome != null && !nome.isBlank()) {
                contagens.merge(gerarChave(nome), 1L, Long::sum);
            }
        }

        for (Autor autor : autores) {
            autor.setQuantidadeLivros(
                    contagens.getOrDefault(autor.getChaveNome(), 0L)
            );
        }

        return autores;
    }

    private boolean correspondeAutor(Livro livro, String chave) {
        return livro.getAutor() != null
                && !livro.getAutor().isBlank()
                && gerarChave(livro.getAutor()).equals(chave);
    }

    private String limparNome(String nome) {
        if (nome == null || nome.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o nome do autor."
            );
        }

        String resultado = nome.strip().replaceAll("\\s+", " ");

        if (resultado.length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O nome deve possuir até 255 caracteres."
            );
        }

        return resultado;
    }

    private String gerarChave(String nome) {
        String normalizado = Normalizer.normalize(
                nome.strip().replaceAll("\\s+", " "),
                Normalizer.Form.NFD
        ).replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);

        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(normalizado.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private String validarBiografia(String endereco) {
        if (endereco == null || endereco.isBlank()) {
            return null;
        }

        String valor = endereco.strip();

        try {
            URI uri = URI.create(valor);

            boolean protocoloValido =
                    "https".equalsIgnoreCase(uri.getScheme())
                    || "http".equalsIgnoreCase(uri.getScheme());

            if (!protocoloValido
                    || uri.getHost() == null
                    || uri.getUserInfo() != null
                    || valor.length() > 2048) {
                throw new IllegalArgumentException();
            }

            return valor;
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um endereço válido de biografia."
            );
        }
    }
}
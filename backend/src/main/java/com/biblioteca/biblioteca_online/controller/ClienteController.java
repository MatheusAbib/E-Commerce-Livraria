package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.model.Cliente;
import com.biblioteca.biblioteca_online.model.Endereco;
import com.biblioteca.biblioteca_online.model.Livro;
import com.biblioteca.biblioteca_online.model.Log;
import com.biblioteca.biblioteca_online.service.ClienteService;
import com.biblioteca.biblioteca_online.service.EnderecoService;
import com.biblioteca.biblioteca_online.service.LogService;

import jakarta.servlet.http.HttpSession;

import com.biblioteca.biblioteca_online.dto.ClienteRankingDTO;
import com.biblioteca.biblioteca_online.dto.LoginRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.biblioteca.biblioteca_online.repository.LivroRepository;
import com.biblioteca.biblioteca_online.service.JwtService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private EnderecoService enderecoService;

    @Autowired
    private LivroRepository livroRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private LogService logService;

    @GetMapping
    public List<Cliente> listarClientes() {
        return clienteService.listarClientes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> buscarCliente(@PathVariable Long id) {
        Optional<Cliente> cliente = clienteService.buscarPorId(id);
        return cliente.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/enderecos")
    public ResponseEntity<List<Endereco>> listarEnderecos(@PathVariable Long id) {
        List<Endereco> enderecos = enderecoService.listarPorCliente(id);
        return ResponseEntity.ok(enderecos);
    }

@PostMapping
public ResponseEntity<?> salvarCliente(@RequestBody Cliente cliente) {
    try {
        Cliente salvo = clienteService.salvarClienteComEnderecos(cliente);
        return ResponseEntity.ok(salvo);
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of("message", "Erro interno do servidor"));
    }
}

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarCliente(@PathVariable Long id, @RequestBody Cliente cliente) {
        try {
            Cliente atualizado = clienteService.atualizarDadosPessoais(id, cliente);
            return ResponseEntity.ok(atualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erro interno do servidor");
        }
    }

    @PostMapping("/change-status/{id}")
    public ResponseEntity<?> changeStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Boolean ativo = (Boolean) payload.get("ativo");
            String motivo = (String) payload.get("motivo");

            if (ativo == null || motivo == null || motivo.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Campos 'ativo' e 'motivo' são obrigatórios.");
            }

            clienteService.mudarStatusCliente(id, ativo, motivo);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> alterarSenha(@PathVariable Long id, @RequestBody Map<String, String> senhas) {
        try {
            String senha = senhas.get("senha");
            String confirmacaoSenha = senhas.get("confirmacaoSenha");
            clienteService.alterarSenha(id, senha, confirmacaoSenha);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/consulta")
    public ResponseEntity<List<Cliente>> consultarClientes(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String cpf,
            @RequestParam(required = false) String telefone,
            @RequestParam(required = false) String tipoTelefone,
            @RequestParam(required = false) String genero,
            @RequestParam(required = false) Boolean ativo) {

        List<Cliente> clientes = clienteService.filtrarClientes(
                nome, email, cpf, telefone, tipoTelefone, genero, ativo);

        return ResponseEntity.ok(clientes);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluirCliente(@PathVariable Long id) {
        try {
            clienteService.excluirCliente(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

@PostMapping("/login")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.POST, RequestMethod.OPTIONS})
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    try {
        Cliente cliente = clienteService.login(request.getEmail(), request.getSenha());

        if (cliente == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Email ou senha inválidos"));
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", cliente.getId());
        claims.put("perfil", cliente.getPerfil());
        claims.put("nome", cliente.getNome());

        String token = jwtService.generateToken(cliente.getEmail(), claims);

        cliente.setSenha(null);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", cliente);
        response.put("expiresIn", 86400000);

        Log log = new Log();
        log.setUserId(cliente.getId());
        log.setUserName(cliente.getNome());
        log.setAction("login");
        log.setDetails("Login realizado com sucesso");
        log.setLevel("success");
        logService.salvarLog(log);

        return ResponseEntity.ok(response);
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of("message", "Erro no servidor: " + e.getMessage()));
    }
}

@PostMapping("/{id}/favoritos")
public ResponseEntity<?> adicionarFavorito(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
    try {
        
        Long livroId = payload.get("livroId");
        
        Cliente cliente = clienteService.buscarPorId(id)
            .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
        

        if (!cliente.getFavoritos().contains(livroId)) {
            cliente.getFavoritos().add(livroId);
            clienteService.salvarFavoritos(cliente);
        }
        
        return ResponseEntity.ok(Map.of("mensagem", "Adicionado aos favoritos"));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
    }
}

    @DeleteMapping("/{id}/favoritos/{livroId}")
    public ResponseEntity<?> removerFavorito(@PathVariable Long id, @PathVariable Long livroId) {
        try {
            Cliente cliente = clienteService.buscarPorId(id)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

            cliente.getFavoritos().remove(livroId);
            clienteService.salvarFavoritos(cliente);
            return ResponseEntity.ok(Map.of("mensagem", "Removido dos favoritos"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

@GetMapping("/{id}/favoritos")
public ResponseEntity<?> listarFavoritos(@PathVariable Long id) {
    try {
        Cliente cliente = clienteService.buscarPorId(id)
            .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        cliente.setSenha(null);

        List<Long> ids = cliente.getFavoritos();
        if (ids.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Livro> livros = livroRepository.findAllById(ids);
        return ResponseEntity.ok(livros);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
    }
}

@GetMapping("/ranking")
public ResponseEntity<?> buscarRankingClientes() {
    try {
        List<ClienteRankingDTO> ranking = clienteService.obterRankingClientes();
        return ResponseEntity.ok(ranking);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erro ao buscar ranking: " + e.getMessage());
        }
    }

    @GetMapping("/logado")
    public ResponseEntity<?> obterClienteLogado(HttpSession session) {
        Cliente clienteLogado = (Cliente) session.getAttribute("clienteLogado");

        if (clienteLogado == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Cliente não está logado.");
        }

        return ResponseEntity.ok(clienteLogado);
    }
}

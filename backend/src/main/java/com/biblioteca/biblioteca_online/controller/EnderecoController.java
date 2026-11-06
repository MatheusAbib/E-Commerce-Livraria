package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.model.Endereco;
import com.biblioteca.biblioteca_online.model.Log;
import com.biblioteca.biblioteca_online.service.EnderecoService;
import com.biblioteca.biblioteca_online.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enderecos")
public class EnderecoController {

    @Autowired
    private EnderecoService enderecoService;

    @Autowired
    private LogService logService;

    @GetMapping("/cliente/{clienteId}")
    public List<Endereco> listarPorCliente(@PathVariable Long clienteId) {
        return enderecoService.listarPorCliente(clienteId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Endereco> buscarEnderecoPorId(@PathVariable Long id) {
        Endereco endereco = enderecoService.buscarPorId(id);
        if (endereco != null) {
            return ResponseEntity.ok(endereco);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Endereco> criarEndereco(@RequestBody Endereco endereco) {
        try {
            if (endereco.getCliente() == null || endereco.getCliente().getId() == null) {
                return ResponseEntity.badRequest().body(null);
            }
            Endereco enderecoSalvo = enderecoService.salvarEndereco(endereco);
            return ResponseEntity.ok(enderecoSalvo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Endereco> atualizarEndereco(
        @PathVariable Long id,
        @RequestBody Endereco enderecoAtualizado) {

        Endereco enderecoExistente = enderecoService.buscarPorId(id);
        if (enderecoExistente == null) {
            return ResponseEntity.notFound().build();
        }

        String nomeAntigo = enderecoExistente.getNomeEndereco();
        String ruaAntiga = enderecoExistente.getRua();
        String numeroAntigo = enderecoExistente.getNumero();
        String bairroAntigo = enderecoExistente.getBairro();
        String cidadeAntiga = enderecoExistente.getCidade();
        String estadoAntigo = enderecoExistente.getEstado();
        String cepAntigo = enderecoExistente.getCep();

        enderecoExistente.setCep(enderecoAtualizado.getCep());
        enderecoExistente.setRua(enderecoAtualizado.getRua());
        enderecoExistente.setNumero(enderecoAtualizado.getNumero());
        enderecoExistente.setComplemento(enderecoAtualizado.getComplemento());
        enderecoExistente.setBairro(enderecoAtualizado.getBairro());
        enderecoExistente.setCidade(enderecoAtualizado.getCidade());
        enderecoExistente.setEstado(enderecoAtualizado.getEstado());
        enderecoExistente.setPais(enderecoAtualizado.getPais());

        enderecoExistente.setTipo(enderecoAtualizado.getTipo());

        if (enderecoAtualizado.getNomeEndereco() != null && !enderecoAtualizado.getNomeEndereco().isEmpty()) {
            enderecoExistente.setNomeEndereco(enderecoAtualizado.getNomeEndereco());
        }

        Endereco enderecoSalvo = enderecoService.salvarEndereco(enderecoExistente);

        StringBuilder detalhes = new StringBuilder();
        detalhes.append("Endereço \"").append(nomeAntigo).append("\" editado: ");
        if (!ruaAntiga.equals(enderecoSalvo.getRua())) {
            detalhes.append("Rua: ").append(ruaAntiga).append(" → ").append(enderecoSalvo.getRua()).append("; ");
        }
        if (!numeroAntigo.equals(enderecoSalvo.getNumero())) {
            detalhes.append("Número: ").append(numeroAntigo).append(" → ").append(enderecoSalvo.getNumero()).append("; ");
        }
        if (!bairroAntigo.equals(enderecoSalvo.getBairro())) {
            detalhes.append("Bairro: ").append(bairroAntigo).append(" → ").append(enderecoSalvo.getBairro()).append("; ");
        }
        if (!cidadeAntiga.equals(enderecoSalvo.getCidade())) {
            detalhes.append("Cidade: ").append(cidadeAntiga).append(" → ").append(enderecoSalvo.getCidade()).append("; ");
        }
        if (!estadoAntigo.equals(enderecoSalvo.getEstado())) {
            detalhes.append("Estado: ").append(estadoAntigo).append(" → ").append(enderecoSalvo.getEstado()).append("; ");
        }
        if (!cepAntigo.equals(enderecoSalvo.getCep())) {
            detalhes.append("CEP: ").append(cepAntigo).append(" → ").append(enderecoSalvo.getCep()).append("; ");
        }

        if (enderecoSalvo.getCliente() != null) {
            Log log = new Log();
            log.setUserId(enderecoSalvo.getCliente().getId());
            log.setUserName(enderecoSalvo.getCliente().getNome());
            log.setAction("endereco_editado");
            log.setDetails(detalhes.toString());
            log.setLevel("info");
            logService.salvarLog(log);
        }

        return ResponseEntity.ok(enderecoSalvo);
    }

    @DeleteMapping("/cliente/{clienteId}")
    public void removerEnderecosDoCliente(@PathVariable Long clienteId) {
        enderecoService.removerEnderecosDoCliente(clienteId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerEndereco(@PathVariable Long id) {
        try {
            Endereco endereco = enderecoService.buscarPorId(id);
            if (endereco == null) {
                return ResponseEntity.notFound().build();
            }
            enderecoService.excluir(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{enderecoId}/nome")
    public ResponseEntity<?> atualizarNomeEndereco(
        @PathVariable Long enderecoId,
        @RequestBody Map<String, String> payload) {

        String novoNome = payload.get("nomeEndereco");
        if (novoNome == null || novoNome.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Nome do endereço não pode ser vazio");
        }

        boolean atualizado = enderecoService.atualizarNomeEndereco(enderecoId, novoNome.trim());

        if (atualizado) {
            return ResponseEntity.ok("Nome do endereço atualizado com sucesso");
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}

package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.command.AtualizarStatusCommand;
import com.biblioteca.biblioteca_online.command.CancelarPedidoCommand;
import com.biblioteca.biblioteca_online.command.Command;
import com.biblioteca.biblioteca_online.command.CommandInvoker;
import com.biblioteca.biblioteca_online.command.ConfirmarReembolsoCommand;
import com.biblioteca.biblioteca_online.dto.AtualizarStatusDTO;
import com.biblioteca.biblioteca_online.dto.CriarPedidoDTO;
import com.biblioteca.biblioteca_online.dto.DevolucaoParcialDTO;
import com.biblioteca.biblioteca_online.dto.PagamentoDTO;

import java.util.ArrayList;

import com.biblioteca.biblioteca_online.model.DevolucaoFoto;
import com.biblioteca.biblioteca_online.model.ItemDevolucao;
import com.biblioteca.biblioteca_online.model.Pedido;
import com.biblioteca.biblioteca_online.model.StatusPedido;
import com.biblioteca.biblioteca_online.repository.PedidoRepository;
import com.biblioteca.biblioteca_online.service.PedidoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.biblioteca.biblioteca_online.service.LogService;
import com.biblioteca.biblioteca_online.service.CupomService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.biblioteca.biblioteca_online.repository.DevolucaoFotoRepository;
import java.io.File;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;
    private final LogService logService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    private CupomService cupomService;

    @Autowired
    private CommandInvoker commandInvoker;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DevolucaoFotoRepository devolucaoFotoRepository;

    public PedidoController(PedidoService pedidoService,
                           LogService logService,
                           SimpMessagingTemplate messagingTemplate) {
        this.pedidoService = pedidoService;
        this.logService = logService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/todos")
    public ResponseEntity<List<Pedido>> listarTodosPedidos() {
        return ResponseEntity.ok(pedidoService.listarTodosPedidos());
    }

    @GetMapping
    public ResponseEntity<List<Pedido>> listarPedidosPorCliente(@RequestParam Long clienteId) {
        return ResponseEntity.ok(pedidoService.listarPedidosPorCliente(clienteId));
    }

    @PostMapping
    public ResponseEntity<?> criarPedido(@RequestBody CriarPedidoDTO pedidoDTO) {
        try {
            Long cartaoId = null;
            List<Long> cartoesAdicionais = null;

            if (pedidoDTO.getPagamentos() != null && !pedidoDTO.getPagamentos().isEmpty()) {
                cartaoId = pedidoDTO.getPagamentos().get(0).getCartaoId();
                cartoesAdicionais = pedidoDTO.getPagamentos().stream()
                    .skip(1)
                    .map(PagamentoDTO::getCartaoId)
                    .toList();
            }

            String primeiroCupom = null;

            Pedido pedido = pedidoService.criarPedido(
                pedidoDTO.getClienteId(),
                pedidoDTO.getItens(),
                pedidoDTO.getEnderecoId(),
                cartaoId,
                cartoesAdicionais,
                pedidoDTO.getValorDesconto(),
                primeiroCupom,
                pedidoDTO.getValorSubtotal()
            );

            return ResponseEntity.ok(pedido);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("mensagem", e.getMessage(), "status", "erro")
            );
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Pedido> atualizarStatus(
        @PathVariable Long id,
        @RequestBody AtualizarStatusDTO statusDTO) {

        Command command = new AtualizarStatusCommand(
            pedidoService,
            cupomService,
            logService,
            messagingTemplate,
            id,
            statusDTO
        );

        Pedido pedido = (Pedido) commandInvoker.executar(command);

        return ResponseEntity.ok(pedido);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pedido> buscarPedido(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.buscarPorId(id));
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarPedido(@PathVariable Long id) {
        try {
            Command command = new CancelarPedidoCommand(pedidoService, id);
            String mensagem = (String) commandInvoker.executar(command);
            return ResponseEntity.ok(Map.of("mensagem", mensagem));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("mensagem", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("mensagem", "Erro ao cancelar pedido: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluirPedido(@PathVariable Long id) {
        try {
            Optional<Pedido> pedidoOpt = pedidoService.buscarPorIdOptional(id);
            if (pedidoOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensagem", "Pedido não encontrado com ID: " + id));
            }

            Pedido pedido = pedidoOpt.get();

            if (pedido.getStatus() != StatusPedido.CANCELADO) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "Apenas pedidos cancelados podem ser excluídos"));
            }

            pedidoRepository.deleteById(id);

            return ResponseEntity.ok(Map.of("mensagem", "Pedido excluído com sucesso"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("mensagem", "Erro ao excluir pedido: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/confirmar-reembolso")
    public ResponseEntity<?> confirmarReembolso(@PathVariable Long id) {
        try {
            Command command = new ConfirmarReembolsoCommand(pedidoService, id);
            Pedido pedido = (Pedido) commandInvoker.executar(command);
            return ResponseEntity.ok(pedido);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    @GetMapping("/historico/{clienteId}")
    public ResponseEntity<List<Map<String, Object>>> getHistoricoLivros(@PathVariable Long clienteId) {

        List<Pedido> pedidos = pedidoService.listarPedidosPorCliente(clienteId);

        List<StatusPedido> statusValidos = Arrays.asList(
            StatusPedido.ENTREGUE,
            StatusPedido.EM_TRANSITO
        );

        List<Map<String, Object>> historico = pedidos.stream()
            .filter(p -> statusValidos.contains(p.getStatus()))
            .flatMap(p -> p.getItens().stream())
            .map(item -> {
                Map<String, Object> dados = new HashMap<>();
                dados.put("titulo", item.getLivro().getTitulo());
                dados.put("autor", item.getLivro().getAutor());
                dados.put("categoria", item.getLivro().getCategoria());
                dados.put("quantidade", item.getQuantidade());
                dados.put("dataCompra", item.getPedido().getDataPedido());
                dados.put("status", item.getPedido().getStatus().toString());
                return dados;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(historico);
    }

    @PostMapping("/{id}/devolucao")
    public ResponseEntity<?> solicitarDevolucao(
        @PathVariable Long id,
        @RequestParam("motivo") String motivo,
        @RequestParam("itens") String itensJson,
        @RequestParam(value = "fotos", required = false) List<MultipartFile> fotos) {

        try {
            ObjectMapper mapper = new ObjectMapper();
            List<DevolucaoParcialDTO.ItemDevolucaoDTO> itensDTO =
                mapper.readValue(itensJson, new TypeReference<List<DevolucaoParcialDTO.ItemDevolucaoDTO>>() {});

            Pedido pedidoOriginal = pedidoService.buscarPorId(id);

            if (pedidoOriginal.getStatus() != StatusPedido.ENTREGUE) {
                return ResponseEntity.badRequest().body(
                    Map.of("mensagem", "Só é possível devolver pedidos entregues")
                );
            }

            List<ItemDevolucao> itensDevolucao = new ArrayList<>();
            for (DevolucaoParcialDTO.ItemDevolucaoDTO itemDTO : itensDTO) {
                ItemDevolucao item = new ItemDevolucao();
                item.setItemPedidoId(itemDTO.getItemPedidoId());
                item.setQuantidade(itemDTO.getQuantidade());
                itensDevolucao.add(item);
            }

            pedidoService.solicitarDevolucao(id, motivo, itensDevolucao);

            Pedido pedidoDevolucao = pedidoService.criarPedidoDevolucao(
                id,
                motivo,
                itensDevolucao
            );

            if (fotos != null && !fotos.isEmpty()) {
                for (MultipartFile foto : fotos) {
                    if (foto != null && !foto.isEmpty()) {
                        String nomeArquivo = UUID.randomUUID().toString() + obterExtensaoSegura(foto.getOriginalFilename());

                        String uploadDir = System.getProperty("user.dir") + "/uploads/devolucoes/";
                        File directory = new File(uploadDir);
                        if (!directory.exists()) {
                            directory.mkdirs();
                        }

                        String caminhoCompleto = uploadDir + nomeArquivo;
                        File arquivo = new File(caminhoCompleto);

                        foto.transferTo(arquivo);

                        DevolucaoFoto devolucaoFoto = new DevolucaoFoto();
                        devolucaoFoto.setPedidoDevolucao(pedidoDevolucao);
                        devolucaoFoto.setNomeArquivo(nomeArquivo);
                        devolucaoFoto.setCaminho("uploads/devolucoes/" + nomeArquivo);
                        devolucaoFotoRepository.save(devolucaoFoto);
                    }
                }
            }

            messagingTemplate.convertAndSend("/topic/pedidos", pedidoDevolucao);
            messagingTemplate.convertAndSend("/topic/pedidos", pedidoOriginal);

            return ResponseEntity.ok(Map.of(
                "mensagem", "Devolução solicitada com sucesso",
                "pedidoDevolucao", pedidoDevolucao
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("mensagem", e.getMessage())
            );
        }
    }

    private String obterExtensaoSegura(String nomeOriginal) {
        if (nomeOriginal == null || !nomeOriginal.contains(".")) {
            return ".bin";
        }
        String ext = nomeOriginal.substring(nomeOriginal.lastIndexOf("."));
        if (ext.matches("\\.[a-zA-Z0-9]{1,5}")) {
            return ext.toLowerCase();
        }
        return ".bin";
    }
}
package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.dto.AdicionarItemCarrinhoDTO;
import com.biblioteca.biblioteca_online.dto.AtualizarItemCarrinhoDTO;
import com.biblioteca.biblioteca_online.dto.CarrinhoResponseDTO;
import com.biblioteca.biblioteca_online.service.CarrinhoService;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/carrinho")
public class CarrinhoController {

    private final CarrinhoService carrinhoService;

    public CarrinhoController(CarrinhoService carrinhoService) {
        this.carrinhoService = carrinhoService;
    }

    @GetMapping
    public ResponseEntity<CarrinhoResponseDTO> obterCarrinho() {
        return responder(carrinhoService.obterCarrinho());
    }

    @PostMapping("/itens")
    public ResponseEntity<CarrinhoResponseDTO> adicionarItem(
        @RequestBody AdicionarItemCarrinhoDTO dto
    ) {
        return responder(carrinhoService.adicionarItem(dto));
    }

    @PutMapping("/itens/{livroId}")
    public ResponseEntity<CarrinhoResponseDTO> atualizarQuantidade(
        @PathVariable Long livroId,
        @RequestBody AtualizarItemCarrinhoDTO dto
    ) {
        return responder(
            carrinhoService.atualizarQuantidade(livroId, dto)
        );
    }

    @DeleteMapping("/itens/{livroId}")
    public ResponseEntity<CarrinhoResponseDTO> removerItem(
        @PathVariable Long livroId,
        @RequestParam Long carrinhoId,
        @RequestParam Long revisao
    ) {
        return responder(
            carrinhoService.removerItem(
                livroId,
                carrinhoId,
                revisao
            )
        );
    }

    @DeleteMapping
    public ResponseEntity<CarrinhoResponseDTO> limparCarrinho(
        @RequestParam Long carrinhoId,
        @RequestParam Long revisao
    ) {
        return responder(
            carrinhoService.limparCarrinho(
                carrinhoId,
                revisao
            )
        );
    }

    private ResponseEntity<CarrinhoResponseDTO> responder(
        CarrinhoResponseDTO carrinho
    ) {
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(carrinho);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> tratarErro(
        ResponseStatusException exception
    ) {
        String mensagem = exception.getReason() == null
            ? "Não foi possível realizar a operação no carrinho."
            : exception.getReason();

        return ResponseEntity
            .status(exception.getStatusCode())
            .cacheControl(CacheControl.noStore())
            .body(Map.of(
                "mensagem", mensagem,
                "status", exception.getStatusCode().value()
            ));
    }
}
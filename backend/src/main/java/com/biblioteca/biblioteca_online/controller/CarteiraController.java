package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.model.Carteira;
import com.biblioteca.biblioteca_online.service.CarteiraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/carteiras")
@RequiredArgsConstructor
public class CarteiraController {

    private final CarteiraService carteiraService;

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<Carteira> buscarPorCliente(@PathVariable Long clienteId) {
        return ResponseEntity.ok(carteiraService.buscarPorCliente(clienteId));
    }

    @PostMapping("/cliente/{clienteId}/creditar")
    public ResponseEntity<Carteira> creditar(
            @PathVariable Long clienteId,
            @RequestParam BigDecimal valor) {
        return ResponseEntity.ok(carteiraService.creditar(clienteId, valor));
    }

    @PostMapping("/cliente/{clienteId}/debitar")
    public ResponseEntity<Carteira> debitar(
            @PathVariable Long clienteId,
            @RequestParam BigDecimal valor) {
        return ResponseEntity.ok(carteiraService.debitar(clienteId, valor));
    }

    @PostMapping("/cliente/{clienteId}/cashback")
    public ResponseEntity<Carteira> registrarCashback(
            @PathVariable Long clienteId,
            @RequestParam BigDecimal valorCompra) {
        return ResponseEntity.ok(carteiraService.registrarCashback(clienteId, valorCompra));
    }
}
package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.model.Carteira;
import com.biblioteca.biblioteca_online.model.Cliente;
import com.biblioteca.biblioteca_online.repository.CarteiraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CarteiraService {

    private final CarteiraRepository carteiraRepository;

    @Transactional
    public Carteira criarParaCliente(Cliente cliente) {
        if (carteiraRepository.existsByClienteId(cliente.getId())) {
            throw new IllegalStateException("Cliente já possui carteira");
        }

        Carteira carteira = Carteira.builder()
                .cliente(cliente)
                .saldo(BigDecimal.ZERO)
                .cashbackAcumulado(BigDecimal.ZERO)
                .totalGasto(BigDecimal.ZERO)
                .ativa(true)
                .build();

        return carteiraRepository.save(carteira);
    }

    public Carteira buscarPorCliente(Long clienteId) {
        return carteiraRepository.findByClienteId(clienteId)
                .orElseThrow(() -> new IllegalArgumentException("Carteira não encontrada para o cliente " + clienteId));
    }

    @Transactional
    public Carteira creditar(Long clienteId, BigDecimal valor) {
        Carteira carteira = buscarPorCliente(clienteId);
        carteira.creditar(valor);
        return carteiraRepository.save(carteira);
    }

    @Transactional
    public Carteira debitar(Long clienteId, BigDecimal valor) {
        Carteira carteira = buscarPorCliente(clienteId);
        carteira.debitar(valor);
        return carteiraRepository.save(carteira);
    }

    @Transactional
    public Carteira registrarCashback(Long clienteId, BigDecimal valorCompra) {
        Carteira carteira = buscarPorCliente(clienteId);
        carteira.acumularCashback(valorCompra);
        return carteiraRepository.save(carteira);
    }
}
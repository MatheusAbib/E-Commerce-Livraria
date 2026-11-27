package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.repository.CarrinhoRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class CarrinhoExpirationService {

    private static final Logger logger =
        LoggerFactory.getLogger(CarrinhoExpirationService.class);

    private final CarrinhoRepository carrinhoRepository;
    private final CarrinhoService carrinhoService;

    public CarrinhoExpirationService(
        CarrinhoRepository carrinhoRepository,
        CarrinhoService carrinhoService
    ) {
        this.carrinhoRepository = carrinhoRepository;
        this.carrinhoService = carrinhoService;
    }

    @Scheduled(fixedDelay = 5000, initialDelay = 5000)
    public void removerCarrinhosExpirados() {
        Instant agora = Instant.now();

        List<Long> idsExpirados;

        try {
            idsExpirados = carrinhoRepository.buscarIdsExpirados(agora);
        } catch (Exception e) {
            logger.error(
                "Erro ao consultar carrinhos expirados.",
                e
            );
            return;
        }

        if (idsExpirados.isEmpty()) {
            return;
        }

        int quantidadeRemovida = 0;

        for (Long carrinhoId : idsExpirados) {
            try {
                boolean removido = carrinhoService
                    .removerCarrinhoExpirado(carrinhoId);

                if (removido) {
                    quantidadeRemovida++;
                }
            } catch (Exception e) {
                logger.error(
                    "Erro ao remover o carrinho expirado {}.",
                    carrinhoId,
                    e
                );
            }
        }

        if (quantidadeRemovida > 0) {
            logger.info(
                "{} carrinho(s) expirado(s) removido(s).",
                quantidadeRemovida
            );
        }
    }
}
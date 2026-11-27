package com.biblioteca.biblioteca_online.config;

import com.biblioteca.biblioteca_online.service.AutorService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class AutorInicializador implements ApplicationRunner {

    private static final Logger logger =
            LoggerFactory.getLogger(AutorInicializador.class);

    private final AutorService autorService;

    public AutorInicializador(AutorService autorService) {
        this.autorService = autorService;
    }

    @Override
    public void run(ApplicationArguments args) {
        int quantidade = autorService.importarAutores();

        logger.info(
                "Importação de autores concluída. Novos cadastros: {}",
                quantidade
        );
    }
}
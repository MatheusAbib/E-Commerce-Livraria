package com.biblioteca.biblioteca_online;

import com.biblioteca.biblioteca_online.model.Cliente;
import com.biblioteca.biblioteca_online.repository.ClienteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDate;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner initAdmin(ClienteRepository clienteRepository) {
        return args -> {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            
            Cliente admin = clienteRepository.findByEmail("admin@livros.com");
            if (admin == null) {
                admin = new Cliente();
                admin.setNome("Administrador");
                admin.setEmail("admin@livros.com");
                admin.setSenha(encoder.encode("admin123"));
                admin.setPerfil("ADMIN");
                admin.setAtivo(true);
                admin.setDataCadastro(LocalDate.now());
                clienteRepository.save(admin);
            } else {
                String senhaAtual = admin.getSenha();
                if (senhaAtual == null || senhaAtual.isEmpty()) {
                    admin.setSenha(encoder.encode("admin123"));
                    clienteRepository.save(admin);
                }
            }
        };
    }
}

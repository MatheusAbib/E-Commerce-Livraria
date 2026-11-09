
package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.model.Pedido;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PedidoAccessService {

    public String obterEmailAutenticado() {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getPrincipal() == null
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "É necessário estar autenticado"
            );
        }

        String email = authentication.getName();

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuário autenticado inválido"
            );
        }

        return email;
    }

    public void validarProprietario(Pedido pedido) {
        String emailAutenticado = obterEmailAutenticado();

        if (pedido == null
                || pedido.getCliente() == null
                || pedido.getCliente().getEmail() == null
                || !pedido.getCliente().getEmail()
                        .equalsIgnoreCase(emailAutenticado)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não tem permissão para acessar este pedido"
            );
        }
    }

    public void validarProprietario(Long clienteId, Pedido pedido) {
        if (clienteId == null
                || pedido == null
                || pedido.getCliente() == null
                || !clienteId.equals(pedido.getCliente().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não tem permissão para acessar este pedido"
            );
        }

        validarProprietario(pedido);
    }
}

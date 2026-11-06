package com.biblioteca.biblioteca_online.command;

import org.springframework.stereotype.Component;

@Component
public class CommandInvoker {

    public Object executar(Command command) {
        command.executar();
        return command.getResultado();
    }
}
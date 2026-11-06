package com.biblioteca.biblioteca_online.command;

public interface Command {

    void executar();

    Object getResultado();
}
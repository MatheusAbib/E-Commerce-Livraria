package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.model.Log;
import com.biblioteca.biblioteca_online.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LogService {

    @Autowired
    private LogRepository logRepository;

    public Log salvarLog(Log log) {
        return logRepository.save(log);
    }

    public List<Log> listarLogs() {
        return logRepository.findAll();
    }

    public List<Log> listarLogsPorUsuario(Long userId) {
        return logRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    public void limparLogsAntigos() {
        logRepository.deleteAll();
    }

    public void adicionarNotificacaoParaCliente(Long clienteId, String titulo, String mensagem, String tipo) {
        try {
            Log log = new Log();
            log.setUserId(clienteId);
            log.setAction("notificacao");
            log.setDetails(titulo + ": " + mensagem);
            log.setLevel(tipo);
            log.setTimestamp(LocalDateTime.now());
            logRepository.save(log);
        } catch (Exception e) {
        }
    }
}

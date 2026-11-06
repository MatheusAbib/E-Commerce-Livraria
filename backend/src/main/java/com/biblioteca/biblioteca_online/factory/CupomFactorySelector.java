package com.biblioteca.biblioteca_online.factory;

import com.biblioteca.biblioteca_online.model.TipoCupom;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class CupomFactorySelector {

    private final Map<TipoCupom, CupomFactory> factories = new EnumMap<>(TipoCupom.class);

    public CupomFactorySelector(List<CupomFactory> factoriesList) {
        for (CupomFactory factory : factoriesList) {
            factories.put(factory.getTipo(), factory);
        }
    }

    public CupomFactory getFactory(TipoCupom tipo) {
        CupomFactory factory = factories.get(tipo);
        if (factory == null) {
            throw new IllegalArgumentException("Tipo de cupom não suportado: " + tipo);
        }
        return factory;
    }
}
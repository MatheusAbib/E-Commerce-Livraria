package com.biblioteca.biblioteca_online.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http)
        throws Exception {

        http
            .cors(cors -> cors.configurationSource(
                corsConfigurationSource()
            ))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    HttpMethod.OPTIONS,
                    "/**"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/clientes/login",
                    "/api/clientes"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/livros",
                    "/api/livros/**",
                    "/api/avaliacoes/livro/**"
                ).permitAll()
                .requestMatchers(
                    "/api/icones/**",
                    "/uploads/**",
                    "/error"
                ).permitAll()
                .requestMatchers(
                    "/api/carrinho",
                    "/api/carrinho/**"
                ).authenticated()
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/livros/processar-pedido"
                ).denyAll()
                .requestMatchers(
                    "/api/livros",
                    "/api/livros/**"
                ).hasAnyAuthority("ADMIN", "ROLE_ADMIN")
                .requestMatchers(
                    "/api/notificacoes/**"
                ).authenticated()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/autores/*/imagem"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/autores/publicos"
                ).permitAll()
                .requestMatchers(
                    "/api/autores",
                    "/api/autores/**"
                ).hasAnyAuthority("ADMIN", "ROLE_ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200",
            "https://livrariaonline-gold.vercel.app"
        ));

        configuration.setAllowedMethods(Arrays.asList(
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ));

        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(
        AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }
}
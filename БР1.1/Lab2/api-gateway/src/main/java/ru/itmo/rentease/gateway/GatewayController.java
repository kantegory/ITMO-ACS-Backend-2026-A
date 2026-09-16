package ru.itmo.rentease.gateway;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import ru.itmo.rentease.common.ApiDtos;
import ru.itmo.rentease.common.AppException;

import java.net.URI;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Set;
import java.util.UUID;

@RestController
public class GatewayController {
    private static final Set<String> HOP_BY_HOP_HEADERS = Set.of(
            "host", "content-length", "connection", "transfer-encoding", "accept-encoding");

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate(new JdkClientHttpRequestFactory());
    private final String identityServiceUrl;
    private final String propertyServiceUrl;
    private final String bookingServiceUrl;
    private final String contractServiceUrl;
    private final String communicationServiceUrl;
    private final String reviewServiceUrl;

    public GatewayController(ObjectMapper objectMapper,
                             @Value("${identity-service.url:http://localhost:8081}") String identityServiceUrl,
                             @Value("${property-service.url:http://localhost:8082}") String propertyServiceUrl,
                             @Value("${booking-service.url:http://localhost:8083}") String bookingServiceUrl,
                             @Value("${contract-service.url:http://localhost:8084}") String contractServiceUrl,
                             @Value("${communication-service.url:http://localhost:8085}") String communicationServiceUrl,
                             @Value("${review-service.url:http://localhost:8086}") String reviewServiceUrl) {
        this.objectMapper = objectMapper;
        this.identityServiceUrl = identityServiceUrl;
        this.propertyServiceUrl = propertyServiceUrl;
        this.bookingServiceUrl = bookingServiceUrl;
        this.contractServiceUrl = contractServiceUrl;
        this.communicationServiceUrl = communicationServiceUrl;
        this.reviewServiceUrl = reviewServiceUrl;
    }

    @GetMapping("/api/v1/health")
    ApiDtos.HealthResponse health() {
        return new ApiDtos.HealthResponse("healthy", "api-gateway");
    }

    @RequestMapping(value = {"/api/v1", "/api/v1/**"},
            method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH,
                    RequestMethod.PUT, RequestMethod.DELETE})
    ResponseEntity<byte[]> proxy(HttpServletRequest request,
                                 @RequestBody(required = false) byte[] body) {
        String path = request.getRequestURI();
        if ("/api/v1/health".equals(path)) {
            throw AppException.notFound("Route not found");
        }
        String serviceUrl = route(path);
        String query = request.getQueryString();
        String target = trimTrailingSlash(serviceUrl) + path + (query == null ? "" : "?" + query);

        HttpHeaders headers = copyRequestHeaders(request);
        HttpEntity<byte[]> entity = new HttpEntity<>(body == null ? new byte[0] : body, headers);
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(URI.create(target),
                    HttpMethod.valueOf(request.getMethod()), entity, byte[].class);
            return ResponseEntity.status(response.getStatusCode())
                    .headers(copyResponseHeaders(response.getHeaders()))
                    .body(response.getBody());
        } catch (HttpStatusCodeException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .headers(copyResponseHeaders(ex.getResponseHeaders()))
                    .body(ex.getResponseBodyAsByteArray());
        } catch (ResourceAccessException ex) {
            return unavailable(request);
        }
    }

    private String route(String path) {
        if (path.startsWith("/api/v1/auth/") || path.equals("/api/v1/auth")
                || path.startsWith("/api/v1/users/") || path.equals("/api/v1/users")) {
            return identityServiceUrl;
        }
        if (path.startsWith("/api/v1/properties") || path.startsWith("/api/v1/favorites")) {
            return propertyServiceUrl;
        }
        if (path.startsWith("/api/v1/bookings")) return bookingServiceUrl;
        if (path.startsWith("/api/v1/contracts")) return contractServiceUrl;
        if (path.startsWith("/api/v1/messages") || path.startsWith("/api/v1/dialogs")) {
            return communicationServiceUrl;
        }
        if (path.startsWith("/api/v1/reviews")) return reviewServiceUrl;
        throw AppException.notFound("Route not found");
    }

    private HttpHeaders copyRequestHeaders(HttpServletRequest request) {
        HttpHeaders headers = new HttpHeaders();
        Enumeration<String> names = request.getHeaderNames();
        if (names == null) names = Collections.emptyEnumeration();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            if (HOP_BY_HOP_HEADERS.contains(name.toLowerCase())) continue;
            Enumeration<String> values = request.getHeaders(name);
            while (values.hasMoreElements()) headers.add(name, values.nextElement());
        }
        if (!headers.containsKey("X-Request-Id")) {
            headers.set("X-Request-Id", UUID.randomUUID().toString());
        }
        return headers;
    }

    private HttpHeaders copyResponseHeaders(HttpHeaders source) {
        HttpHeaders headers = new HttpHeaders();
        if (source == null) return headers;
        source.forEach((name, values) -> {
            if (!HOP_BY_HOP_HEADERS.contains(name.toLowerCase())) {
                headers.put(name, values);
            }
        });
        return headers;
    }

    private ResponseEntity<byte[]> unavailable(HttpServletRequest request) {
        try {
            String traceId = request.getHeader("X-Request-Id");
            if (traceId == null || traceId.isBlank()) traceId = UUID.randomUUID().toString();
            byte[] payload = objectMapper.writeValueAsBytes(
                    new ApiDtos.ErrorResponse("DEPENDENCY_UNAVAILABLE", "Target service is unavailable", traceId));
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .contentType(MediaType.APPLICATION_JSON).body(payload);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}

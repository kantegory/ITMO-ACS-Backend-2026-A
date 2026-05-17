package org.renting.rentingservice.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.EnabledIfDockerAvailable;
import org.renting.rentingservice.TestcontainersConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
@EnabledIfDockerAvailable
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void authListingBookingPaymentFlow() throws Exception {
        registerUser("guest@test.com", "guest1", "+79001111111", "secret12");
        registerUser("owner@test.com", "owner1", "+79002222222", "secret12");

        String ownerToken = login("owner@test.com", "secret12");
        String guestToken = login("guest@test.com", "secret12");

        long listingId = createDailyListing(ownerToken);

        String bookingBody = """
                {"listingId":%d,"startDate":"2026-06-01","endDate":"2026-06-05"}
                """.formatted(listingId);

        MvcResult bookingResult = mockMvc.perform(post("/bookings")
                        .header("Authorization", "Bearer " + guestToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingBody))
                .andExpect(status().isCreated())
                .andReturn();

        long bookingId = objectMapper.readTree(bookingResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/bookings/{id}/payments", bookingId)
                        .header("Authorization", "Bearer " + guestToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentMethod\":\"CARD\"}"))
                .andExpect(status().isCreated());

        MvcResult bookingAfterPay = mockMvc.perform(get("/bookings/{id}", bookingId)
                        .header("Authorization", "Bearer " + guestToken))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(objectMapper.readTree(bookingAfterPay.getResponse().getContentAsString()).get("status").asText())
                .isEqualTo("ACCEPTED");
    }

    @Test
    void bookingDateConflictReturns409() throws Exception {
        registerUser("g2@test.com", "guest2", "+79003333333", "secret12");
        registerUser("o2@test.com", "owner2", "+79004444444", "secret12");
        String ownerToken = login("o2@test.com", "secret12");
        String guestToken = login("g2@test.com", "secret12");
        long listingId = createDailyListing(ownerToken);

        String body = """
                {"listingId":%d,"startDate":"2026-07-01","endDate":"2026-07-04"}
                """.formatted(listingId);

        mockMvc.perform(post("/bookings")
                        .header("Authorization", "Bearer " + guestToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/bookings")
                        .header("Authorization", "Bearer " + guestToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void chatUniqueness() throws Exception {
        registerUser("a@test.com", "userA", "+79005555555", "secret12");
        registerUser("b@test.com", "userB", "+79006666666", "secret12");
        String tokenA = login("a@test.com", "secret12");
        long userBId = objectMapper.readTree(mockMvc.perform(get("/users/me")
                        .header("Authorization", "Bearer " + login("b@test.com", "secret12")))
                .andReturn().getResponse().getContentAsString()).get("id").asLong();

        String chatBody = "{\"otherUserId\":" + userBId + "}";
        mockMvc.perform(post("/chats")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/chats")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody))
                .andExpect(status().isCreated());
    }

    private void registerUser(String email, String username, String phone, String password) throws Exception {
        String body = """
                {"email":"%s","username":"%s","phone":"%s","password":"%s"}
                """.formatted(email, username, phone, password);
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

    private String login(String email, String password) throws Exception {
        String body = "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password);
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("accessToken").asText();
    }

    private long createDailyListing(String ownerToken) throws Exception {
        String body = """
                {
                  "rentMode":"DAILY",
                  "title":"Cozy studio",
                  "description":"Nice place",
                  "address":"Nevsky 1, Saint Petersburg",
                  "latitude":59.9343,
                  "longitude":30.3351,
                  "houseType":"STUDIO",
                  "daily":{"pricePerNight":100.00,"minNights":1}
                }
                """;
        MvcResult result = mockMvc.perform(post("/listings")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }
}

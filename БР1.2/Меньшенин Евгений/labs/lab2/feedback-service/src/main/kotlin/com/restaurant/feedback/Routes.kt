package com.restaurant.feedback

import com.restaurant.shared.events.EventTypes
import com.restaurant.shared.events.EventBus
import com.restaurant.shared.events.reviewPayload
import com.restaurant.shared.models.CreateReviewRequest
import com.restaurant.shared.models.LegacyErrorResponse
import com.restaurant.shared.models.ReviewResponse
import com.restaurant.shared.models.ReviewWithUserResponse
import com.restaurant.shared.models.ReviewsListResponse
import com.restaurant.shared.models.UpdateReviewRequest
import com.restaurant.shared.plugins.requestId
import com.restaurant.shared.plugins.requireUser
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDateTime

fun Route.feedbackRoutes(clients: ServiceClients, eventBus: EventBus) {
    route("/api/reviews") {
        get("/restaurant/{restaurantId}") {
            val restaurantId = call.parameters["restaurantId"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid restaurant id"))
                return@get
            }
            val rows = transaction {
                Reviews.select(
                    Reviews.id, Reviews.userId, Reviews.restaurantId, Reviews.rating, Reviews.comment,
                ).where { (Reviews.restaurantId eq restaurantId) and (Reviews.active eq true) }
                    .orderBy(Reviews.id to SortOrder.DESC)
                    .map { row ->
                        ReviewWithUserResponse(
                            row[Reviews.id].value, row[Reviews.userId], row[Reviews.restaurantId],
                            row[Reviews.rating], row[Reviews.comment], null,
                        )
                    }
            }
            val userIds = rows.map { it.userId }.distinct()
            val users = runBlocking { clients.batchUsers(userIds, call.requestId()).users }
                .associateBy { it.id }
            val enriched = rows.map { r ->
                r.copy(userName = users[r.userId]?.fullName)
            }
            call.respond(ReviewsListResponse(enriched))
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@get
            }
            val review = transaction {
                Reviews.select(
                    Reviews.id, Reviews.userId, Reviews.restaurantId, Reviews.rating, Reviews.comment,
                ).where { (Reviews.id eq id) and (Reviews.active eq true) }
                    .map { ReviewResponse(it[Reviews.id].value, it[Reviews.userId], it[Reviews.restaurantId], it[Reviews.rating], it[Reviews.comment]) }
                    .singleOrNull()
            }
            if (review == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Review not found"))
                return@get
            }
            call.respond(review)
        }

        post {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@post
            }
            val request = call.receive<CreateReviewRequest>()
            if (request.rating < 1 || request.rating > 5) {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Rating must be between 1 and 5"))
                return@post
            }
            val requestId = call.requestId()
            val restaurant = runBlocking { clients.getRestaurant(request.restaurantId, requestId) }
            if (restaurant == null || !restaurant.active) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Restaurant not found"))
                return@post
            }
            val existing = transaction {
                Reviews.select(Reviews.id).where {
                    (Reviews.userId eq user.userId) and (Reviews.restaurantId eq request.restaurantId) and (Reviews.active eq true)
                }.singleOrNull()
            }
            if (existing != null) {
                call.respond(HttpStatusCode.Conflict, LegacyErrorResponse("You have already reviewed this restaurant"))
                return@post
            }
            val id = transaction {
                Reviews.insert {
                    it[userId] = user.userId
                    it[restaurantId] = request.restaurantId
                    it[rating] = request.rating
                    it[comment] = request.comment
                    it[createdAt] = LocalDateTime.now().toString()
                    it[updatedAt] = LocalDateTime.now().toString()
                } get Reviews.id
            }
            val stats = ratingStats(request.restaurantId)
            runBlocking {
                clients.updateRestaurantRating(request.restaurantId, stats.first, stats.second, requestId)
            }
            eventBus.publish(
                EventTypes.REVIEW_CREATED,
                buildJsonObject {
                    put("reviewId", id.value)
                    put("restaurantId", request.restaurantId)
                    put("userId", user.userId)
                    put("rating", request.rating)
                    put("averageRating", stats.first)
                    put("reviewsCount", stats.second)
                },
            )
            call.respond(HttpStatusCode.Created, ReviewResponse(id.value, user.userId, request.restaurantId, request.rating, request.comment))
        }

        patch("/{id}") {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@patch
            }
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@patch
            }
            val review = transaction {
                Reviews.select(Reviews.id, Reviews.userId, Reviews.restaurantId, Reviews.rating).where {
                    (Reviews.id eq id) and (Reviews.userId eq user.userId) and (Reviews.active eq true)
                }.singleOrNull()
            }
            if (review == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Review not found or access denied"))
                return@patch
            }
            val request = call.receive<UpdateReviewRequest>()
            val newRating = request.rating
            if (newRating != null && (newRating < 1 || newRating > 5)) {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Rating must be between 1 and 5"))
                return@patch
            }
            transaction {
                Reviews.update({ Reviews.id eq id }) {
                    newRating?.let { v -> it[rating] = v }
                    request.comment?.let { v -> it[comment] = v }
                    it[updatedAt] = LocalDateTime.now().toString()
                }
            }
            val restaurantId = review[Reviews.restaurantId]
            val stats = ratingStats(restaurantId)
            val requestId = call.requestId()
            runBlocking { clients.updateRestaurantRating(restaurantId, stats.first, stats.second, requestId) }
            eventBus.publish(
                EventTypes.REVIEW_UPDATED,
                buildJsonObject {
                    put("reviewId", id)
                    put("restaurantId", restaurantId)
                    put("userId", user.userId)
                    put("rating", newRating ?: review[Reviews.rating])
                    put("averageRating", stats.first)
                    put("reviewsCount", stats.second)
                },
            )
            val updated = transaction {
                Reviews.select(Reviews.id, Reviews.userId, Reviews.restaurantId, Reviews.rating, Reviews.comment)
                    .where { Reviews.id eq id }.map {
                        ReviewResponse(it[Reviews.id].value, it[Reviews.userId], it[Reviews.restaurantId], it[Reviews.rating], it[Reviews.comment])
                    }.single()
            }
            call.respond(updated)
        }

        delete("/{id}") {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@delete
            }
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@delete
            }
            val review = transaction {
                Reviews.select(Reviews.id, Reviews.userId, Reviews.restaurantId).where {
                    (Reviews.id eq id) and (Reviews.userId eq user.userId) and (Reviews.active eq true)
                }.singleOrNull()
            }
            if (review == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Review not found or access denied"))
                return@delete
            }
            val restaurantId = review[Reviews.restaurantId]
            transaction {
                Reviews.update({ Reviews.id eq id }) {
                    it[active] = false
                    it[updatedAt] = LocalDateTime.now().toString()
                }
            }
            val stats = ratingStats(restaurantId)
            val requestId = call.requestId()
            runBlocking { clients.updateRestaurantRating(restaurantId, stats.first, stats.second, requestId) }
            eventBus.publish(
                EventTypes.REVIEW_DELETED,
                buildJsonObject {
                    put("reviewId", id)
                    put("restaurantId", restaurantId)
                    put("userId", user.userId)
                    put("averageRating", stats.first)
                    put("reviewsCount", stats.second)
                },
            )
            call.respond(HttpStatusCode.NoContent)
        }
    }
}

private fun ratingStats(restaurantId: Int): Pair<Double, Int> = transaction {
    val ratings = Reviews.select(Reviews.rating).where {
        (Reviews.restaurantId eq restaurantId) and (Reviews.active eq true)
    }.map { it[Reviews.rating] }
    if (ratings.isEmpty()) 0.0 to 0
    else BigDecimal(ratings.average()).setScale(1, RoundingMode.HALF_UP).toDouble() to ratings.size
}

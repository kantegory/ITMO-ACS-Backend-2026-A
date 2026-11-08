package com.mezhendosina.routes

import com.mezhendosina.database.*
import com.mezhendosina.database.Restaurants
import com.mezhendosina.database.Reviews
import com.mezhendosina.database.Users
import io.ktor.http.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
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

fun Route.reviewRoutes() {
    route("/reviews") {
        get("/restaurant/{restaurantId}") {
            val restaurantId = call.parameters["restaurantId"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid restaurant id"))
                return@get
            }

            val reviews = transaction {
                Reviews.select(
                    Reviews.id, Reviews.userId, Reviews.restaurantId,
                    Reviews.rating, Reviews.comment,
                ).where { Reviews.restaurantId eq restaurantId }
                    .orderBy(Reviews.id to SortOrder.DESC)
                    .map { row ->
                        val user = Users.select(Users.firstName, Users.lastName)
                            .where { Users.id eq row[Reviews.userId] }
                            .singleOrNull()
                        ReviewWithUserResponse(
                            id = row[Reviews.id].value,
                            userId = row[Reviews.userId],
                            restaurantId = row[Reviews.restaurantId],
                            rating = row[Reviews.rating],
                            comment = row[Reviews.comment],
                            userName = user?.let { "${it[Users.firstName]} ${it[Users.lastName]}" },
                        )
                    }
            }

            call.respond(ReviewsListResponse(reviews = reviews))
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                return@get
            }

            val review = transaction {
                Reviews.select(
                    Reviews.id, Reviews.userId, Reviews.restaurantId,
                    Reviews.rating, Reviews.comment,
                ).where { Reviews.id eq id }.map { row ->
                    ReviewResponse(
                        id = row[Reviews.id].value,
                        userId = row[Reviews.userId],
                        restaurantId = row[Reviews.restaurantId],
                        rating = row[Reviews.rating],
                        comment = row[Reviews.comment],
                    )
                }.singleOrNull()
            }

            if (review == null) {
                call.respond(HttpStatusCode.NotFound, ErrorResponse("Review not found"))
                return@get
            }

            call.respond(review)
        }

        authenticate("auth-jwt") {
            post {
                val userId = call.principalUserId()!!
                val request = call.receive<CreateReviewRequest>()

                val restaurant = transaction {
                    Restaurants.select(Restaurants.id)
                        .where { Restaurants.id eq request.restaurantId }
                        .singleOrNull()
                }

                if (restaurant == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Restaurant not found"))
                    return@post
                }

                if (request.rating < 1 || request.rating > 5) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Rating must be between 1 and 5"))
                    return@post
                }

                val existingReview = transaction {
                    Reviews.select(Reviews.id).where {
                        (Reviews.userId eq userId) and (Reviews.restaurantId eq request.restaurantId)
                    }.singleOrNull()
                }

                if (existingReview != null) {
                    call.respond(HttpStatusCode.Conflict, ErrorResponse("You have already reviewed this restaurant"))
                    return@post
                }

                val id = transaction {
                    Reviews.insert {
                        it[Reviews.userId] = userId
                        it[restaurantId] = request.restaurantId
                        it[rating] = request.rating
                        it[comment] = request.comment
                        it[createdAt] = LocalDateTime.now().toString()
                        it[updatedAt] = LocalDateTime.now().toString()
                    } get Reviews.id
                }

                updateRestaurantRating(request.restaurantId)

                call.respond(
                    HttpStatusCode.Created,
                    ReviewResponse(
                        id = id.value,
                        userId = userId,
                        restaurantId = request.restaurantId,
                        rating = request.rating,
                        comment = request.comment,
                    )
                )
            }

            patch("/{id}") {
                val userId = call.principalUserId()!!
                val id = call.parameters["id"]?.toIntOrNull() ?: run {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                    return@patch
                }

                val review = transaction {
                    Reviews.select(Reviews.id, Reviews.userId, Reviews.restaurantId, Reviews.rating).where {
                        (Reviews.id eq id) and (Reviews.userId eq userId)
                    }.singleOrNull()
                }

                if (review == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Review not found or access denied"))
                    return@patch
                }

                val request = call.receive<UpdateReviewRequest>()

                if (request.rating != null && (request.rating < 1 || request.rating > 5)) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Rating must be between 1 and 5"))
                    return@patch
                }

                val oldRating = review[Reviews.rating]

                transaction {
                    Reviews.update({ Reviews.id eq id }) {
                        request.rating?.let { v -> it[rating] = v }
                        request.comment?.let { v -> it[comment] = v }
                        it[updatedAt] = LocalDateTime.now().toString()
                    }
                }

                if (request.rating != null && request.rating != oldRating) {
                    updateRestaurantRating(review[Reviews.restaurantId])
                }

                val updated = transaction {
                    Reviews.select(
                        Reviews.id, Reviews.userId, Reviews.restaurantId,
                        Reviews.rating, Reviews.comment,
                    ).where { Reviews.id eq id }.map { row ->
                        ReviewResponse(
                            id = row[Reviews.id].value,
                            userId = row[Reviews.userId],
                            restaurantId = row[Reviews.restaurantId],
                            rating = row[Reviews.rating],
                            comment = row[Reviews.comment],
                        )
                    }.single()
                }

                call.respond(updated)
            }

            delete("/{id}") {
                val userId = call.principalUserId()!!
                val id = call.parameters["id"]?.toIntOrNull() ?: run {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                    return@delete
                }

                val review = transaction {
                    Reviews.select(Reviews.id, Reviews.userId, Reviews.restaurantId).where {
                        (Reviews.id eq id) and (Reviews.userId eq userId)
                    }.singleOrNull()
                }

                if (review == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Review not found or access denied"))
                    return@delete
                }

                val restaurantId = review[Reviews.restaurantId]

                transaction {
                    Reviews.deleteWhere { Reviews.id eq id }
                }

                updateRestaurantRating(restaurantId)

                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}

private fun updateRestaurantRating(restaurantId: Int) {
    transaction {
        val reviews = Reviews.select(Reviews.rating).where { Reviews.restaurantId eq restaurantId }.map { it[Reviews.rating] }

        val newRating = if (reviews.isEmpty()) {
            BigDecimal.ZERO
        } else {
            BigDecimal(reviews.average()).setScale(1, RoundingMode.HALF_UP)
        }

        Restaurants.update({ Restaurants.id eq restaurantId }) {
            it[rating] = newRating
        }
    }
}

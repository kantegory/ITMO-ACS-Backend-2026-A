package com.restaurant.shared.events

import org.slf4j.LoggerFactory
import redis.clients.jedis.Jedis
import redis.clients.jedis.JedisPubSub
import java.net.URI
import java.util.UUID
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class RedisEventBus(
    redisUrl: String,
    private val serviceName: String,
) {
    private val log = LoggerFactory.getLogger(RedisEventBus::class.java)
    private val enabled = System.getenv("REDIS_DISABLED") != "true"
    private val redisUri = runCatching { URI.create(redisUrl) }.getOrNull()
    private val channel = "restaurant.events"
    private val subscriberThread = Executors.newSingleThreadExecutor()
    private val running = AtomicBoolean(false)
    private val handlers = CopyOnWriteArrayList<(DomainEvent) -> Unit>()

    fun publish(event: DomainEvent) {
        if (!enabled || redisUri == null) {
            log.debug("Redis disabled, skip publish {}", event.type)
            return
        }
        runCatching {
            Jedis(redisUri).use { jedis ->
                val body = eventJson.encodeToString(DomainEvent.serializer(), event)
                jedis.publish(channel, body)
            }
            log.info("Published event {} id={}", event.type, event.eventId)
        }.onFailure { log.warn("Failed to publish event {}: {}", event.type, it.message) }
    }

    fun publish(type: String, payload: kotlinx.serialization.json.JsonObject) {
        publish(
            buildEvent(
                type = type,
                eventId = UUID.randomUUID().toString(),
                occurredAt = java.time.Instant.now().toString(),
                payload = payload,
            ),
        )
    }

    fun subscribe(handler: (DomainEvent) -> Unit) {
        handlers.add(handler)
        if (!enabled || redisUri == null) {
            log.warn("Redis disabled, event subscription is inactive for {}", serviceName)
            return
        }
        if (running.compareAndSet(false, true)) {
            subscriberThread.execute {
                runCatching {
                    Jedis(redisUri).use { jedis ->
                        jedis.subscribe(
                            object : JedisPubSub() {
                                override fun onMessage(ch: String, message: String) {
                                    if (ch != channel) return
                                    runCatching {
                                        val event = eventJson.decodeFromString(DomainEvent.serializer(), message)
                                        if (isProcessed(event.eventId)) return
                                        handlers.forEach { it(event) }
                                        markProcessed(event.eventId)
                                    }.onFailure { e ->
                                        log.error("Failed to handle event: {}", e.message)
                                    }
                                }
                            },
                            channel,
                        )
                    }
                }.onFailure { log.error("Redis subscriber stopped: {}", it.message) }
            }
        }
    }

    private fun processedKey(eventId: String) = "processed:$serviceName:$eventId"

    private fun isProcessed(eventId: String): Boolean =
        runCatching { Jedis(redisUri).use { it.exists(processedKey(eventId)) } }.getOrDefault(false)

    private fun markProcessed(eventId: String) {
        runCatching { Jedis(redisUri).use { it.setex(processedKey(eventId), 86_400, "1") } }
    }
}

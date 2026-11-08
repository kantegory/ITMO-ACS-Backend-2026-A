package com.restaurant.shared.events

import kotlinx.serialization.json.JsonObject
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.clients.consumer.KafkaConsumer
import org.apache.kafka.clients.producer.KafkaProducer
import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.clients.producer.ProducerRecord
import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.kafka.common.serialization.StringSerializer
import org.slf4j.LoggerFactory
import java.time.Duration
import java.util.Properties
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class KafkaEventBus(
    private val bootstrapServers: String,
    private val serviceName: String,
) : EventBus {
    private val log = LoggerFactory.getLogger(KafkaEventBus::class.java)
    private val enabled = System.getenv("KAFKA_DISABLED") != "true"
    private val topic = "restaurant.events"
    private val handlers = CopyOnWriteArrayList<(DomainEvent) -> Unit>()
    private val consumerRunning = AtomicBoolean(false)
    private val consumerThread = Executors.newSingleThreadExecutor()
    private val processedEvents = ConcurrentHashMap<String, Long>()
    private val processedTtlMs = TimeUnit.HOURS.toMillis(24)

    private val producer: KafkaProducer<String, String>? = if (enabled) {
        KafkaProducer(
            Properties().apply {
                put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers)
                put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer::class.java.name)
                put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer::class.java.name)
                put(ProducerConfig.ACKS_CONFIG, "all")
                put(ProducerConfig.LINGER_MS_CONFIG, 5)
            },
        )
    } else {
        null
    }

    override fun publish(event: DomainEvent) {
        if (!enabled) {
            log.debug("Kafka disabled, skip publish {}", event.type)
            return
        }
        val p = producer ?: return
        runCatching {
            val body = eventJson.encodeToString(DomainEvent.serializer(), event)
            p.send(ProducerRecord(topic, event.eventId, body)).get()
            log.info("Published event {} id={}", event.type, event.eventId)
        }.onFailure { log.warn("Failed to publish event {}: {}", event.type, it.message) }
    }

    override fun publish(type: String, payload: JsonObject) {
        publish(
            buildEvent(
                type = type,
                eventId = UUID.randomUUID().toString(),
                occurredAt = java.time.Instant.now().toString(),
                payload = payload,
            ),
        )
    }

    override fun subscribe(handler: (DomainEvent) -> Unit) {
        handlers.add(handler)
        if (!enabled) {
            log.warn("Kafka disabled, event subscription is inactive for {}", serviceName)
            return
        }
        if (consumerRunning.compareAndSet(false, true)) {
            consumerThread.execute { runConsumerLoop() }
        }
    }

    override fun close() {
        consumerRunning.set(false)
        consumerThread.shutdown()
        producer?.close()
    }

    private fun runConsumerLoop() {
        val consumer = KafkaConsumer(
            Properties().apply {
                put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers)
                put(ConsumerConfig.GROUP_ID_CONFIG, serviceName)
                put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer::class.java.name)
                put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer::class.java.name)
                put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest")
                put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false")
            },
            StringDeserializer(),
            StringDeserializer(),
        )
        consumer.use {
            it.subscribe(listOf(topic))
            log.info("Kafka consumer started for {} on topic {}", serviceName, topic)
            while (consumerRunning.get()) {
                runCatching {
                    val records = it.poll(Duration.ofMillis(500))
                    for (record in records) {
                        runCatching {
                            val event = eventJson.decodeFromString(DomainEvent.serializer(), record.value())
                            if (isProcessed(event.eventId)) return@runCatching
                            handlers.forEach { handler -> handler(event) }
                            markProcessed(event.eventId)
                        }.onFailure { e ->
                            log.error("Failed to handle event: {}", e.message)
                        }
                    }
                    if (records.count() > 0) {
                        it.commitSync()
                    }
                }.onFailure { e ->
                    if (consumerRunning.get()) {
                        log.error("Kafka consumer error: {}", e.message)
                        Thread.sleep(1000)
                    }
                }
            }
        }
        log.info("Kafka consumer stopped for {}", serviceName)
    }

    private fun isProcessed(eventId: String): Boolean {
        cleanupProcessed()
        val expiresAt = processedEvents[eventId] ?: return false
        if (expiresAt < System.currentTimeMillis()) {
            processedEvents.remove(eventId)
            return false
        }
        return true
    }

    private fun markProcessed(eventId: String) {
        processedEvents[eventId] = System.currentTimeMillis() + processedTtlMs
    }

    private fun cleanupProcessed() {
        val now = System.currentTimeMillis()
        processedEvents.entries.removeIf { it.value < now }
    }
}

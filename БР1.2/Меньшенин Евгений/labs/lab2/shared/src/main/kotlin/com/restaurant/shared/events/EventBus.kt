package com.restaurant.shared.events

import kotlinx.serialization.json.JsonObject

interface EventBus {
    fun publish(event: DomainEvent)
    fun publish(type: String, payload: JsonObject)
    fun subscribe(handler: (DomainEvent) -> Unit)
    fun close()
}

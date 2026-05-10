package io.github.artsobol.common.messaging;

public final class RabbitTopology {

    public static final String TRAINING_EVENTS_EXCHANGE = "fitness.training.events";
    public static final String TRAINING_CHANGED_ROUTING_KEY = "training.catalog.changed";
    public static final String PROGRESS_TRAINING_EVENTS_QUEUE = "progress.training.catalog";
    public static final String MEDIA_EVENTS_EXCHANGE = "fitness.media.events";
    public static final String VIDEO_CHANGED_ROUTING_KEY = "media.video.changed";
    public static final String TRAINING_VIDEO_EVENTS_QUEUE = "training.media.video.catalog";
    public static final String BLOG_VIDEO_EVENTS_QUEUE = "blog.media.video.catalog";

    private RabbitTopology() {
    }
}

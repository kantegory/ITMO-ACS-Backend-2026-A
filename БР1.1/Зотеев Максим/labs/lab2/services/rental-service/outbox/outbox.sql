CREATE TABLE IF NOT EXISTS rental_outbox (
    seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id uuid NOT NULL DEFAULT gen_random_uuid(),
    routing_key text NOT NULL,
    payload jsonb NOT NULL
);
CREATE OR REPLACE FUNCTION record_rental_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE event_key text;
BEGIN
    IF TG_OP = 'INSERT' THEN
        event_key := 'rental.created';
    ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('completed', 'cancelled') THEN
        event_key := 'rental.' || NEW.status;
    ELSE
        RETURN NEW;
    END IF;
    INSERT INTO rental_outbox(routing_key, payload) VALUES (event_key, jsonb_build_object(
        'rental_id', NEW.id::text, 'property_id', NEW.property_id::text,
        'tenant_id', NEW.tenant_id::text, 'owner_id', NEW.owner_id::text,
        'property_title', NEW.property_title_snapshot, 'occurred_at', now()
    ));
    RETURN NEW;
END $$;
CREATE OR REPLACE TRIGGER publish_rental_event AFTER INSERT OR UPDATE OF status ON rentals
FOR EACH ROW EXECUTE FUNCTION record_rental_event();

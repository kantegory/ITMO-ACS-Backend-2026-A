import * as Sentry from "@sentry/node-core/light";

// Лёгкий вариант SDK: только ошибки, без OpenTelemetry и трейсинга.
// Без SENTRY_DSN (локальный запуск) отправка выключена.
export const initSentry = (service: string) => {
  const dsn = process.env.SENTRY_DSN;
  if (dsn) Sentry.init({ dsn, serverName: service });
};

// process.exit оборвал бы отправку, поэтому событие дожидается доставки.
export const reportFatal = async (err: unknown) => {
  Sentry.captureException(err);
  await Sentry.flush(2000);
};

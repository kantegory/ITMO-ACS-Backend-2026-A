# Postman

Коллекция: [`postman/Lab2_Gateway.postman_collection.json`](../postman/Lab2_Gateway.postman_collection.json).

Импорт: Postman → Import → выбрать файл.

Переменные коллекции:

- `baseUrl` — по умолчанию `http://127.0.0.1:3000` (для kind: `http://localhost:8080`);
- токены `candidateAccessToken` / `employerAccessToken` — из Login/Register.

Сценарий с нуля: регистрация employer и candidate → login → компания → вакансия → профиль/резюме → отклик. Внутренние `/internal/...` в коллекцию не входят (gateway их не отдаёт).

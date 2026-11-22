# Сервис рецептов

Gateway принимает запросы по HTTP. Auth отвечает за регистрацию, токены, пользователей и подписки. Recipe хранит рецепты, ингредиенты, типы блюд и шаги. Social хранит комментарии, лайки и закладки.

При записи рецепта публикуется событие `recipe.created` в RabbitMQ. Social читает его из очереди `social-service.recipe-created`. Прямые запросы к сервисам нужны для внутреннего взаимодействия и проверок.

- [Запуск и проверка](quickstart.md)
- [Swagger UI](reference.md)
- [OpenAPI JSON](openapi.json)
- [Коллекция Postman](recipes.postman_collection.json)

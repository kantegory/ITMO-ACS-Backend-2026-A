# express-typeorm-boilerplate

Бойлерплейт на express + typeORM. Будьте осторожны, проект ещё на стадии разработки.

Что есть:

- Авторизация по JWT
- Конфигурация через переменные среды
- Базовая пользовательская модель
- Контроллеры через [routing-controllers](https://github.com/typestack/routing-controllers)
- EntityController
- Настроена обвязка для автодокументирования через swagger

Что планируется добавить/доделать:

- Dockerfile
- Полная типизация для UserController
- Кастомизируемая валидация паролей
- Расширение класса BaseController, включение в него базового CRUD
- Переход на [tsoa](https://tsoa-community.github.io/docs/) с [routing-controllers](https://github.com/typestack/routing-controllers)

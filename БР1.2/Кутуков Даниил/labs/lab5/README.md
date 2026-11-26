# ЛР5 · Ansible

Контроллер Ansible запускается из Linux. Целевой узел — выделенная Ubuntu 24.04 для Ehrmann с серверной копией репозитория и вводными из [ЛР4](../lab4/README.md). Для доступа к частному Harbor настройте вход для Docker от пользователя, от которого запускается Compose. В плейбуке это root. Сертификат и ключ nginx должны быть установлены до запуска.

```sh
ansible-galaxy collection install -r requirements.yml
cp inventory.example.yml inventory.yml
# Укажите адрес, SSH-пользователя и HTTPS-origin своей ВМ в inventory.yml.
ansible-playbook -i inventory.yml deploy.yml --syntax-check
ansible-playbook -i inventory.yml deploy.yml
ansible-playbook -i inventory.yml deploy.yml
```

Первый прогон устанавливает пакеты, готовит внешнюю сеть и тома, настраивает nginx и запускает Compose. Повторный прогон проверяет идемпотентность. Ожидаемый итог второго прогона при неизменных входных данных — `failed=0`, `changed=0`. Последняя задача проверяет API через локальный nginx с TLS и правильным SNI.

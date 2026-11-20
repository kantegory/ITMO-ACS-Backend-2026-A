# Ansible

Настройка сервера из предыдущего раздела автоматизирована плейбуком Ansible. Он приводит чистую машину с Ubuntu к рабочему состоянию одной командой и может запускаться повторно без побочных эффектов.

## Структура

```
lab5/
├── ansible.cfg
├── inventory.ini            # адрес сервера в группе app_servers
├── cloud-init.yaml          # пользователь и SSH-ключ для тестовой ВМ Multipass
├── group_vars/
│   └── app_servers.yml      # часовой пояс, подкачка, пакеты, каталог приложения
├── site.yml
└── roles/
    ├── common/              # пакеты, часовой пояс, файл подкачки, UFW
    ├── docker/              # Docker Engine и Docker Compose
    ├── nginx/               # Nginx с шаблоном обратного прокси app.conf.j2
    └── app/                 # копирование кода и запуск docker compose
```

## Плейбук

Роли применяются по порядку, а после них плейбук сам проверяет, что приложение отвечает через Nginx.

```yaml
- name: Configure application servers
  hosts: app_servers
  become: true
  roles:
    - common
    - docker
    - nginx
    - app
  post_tasks:
    - name: Check application through Nginx
      ansible.builtin.uri:
        url: http://localhost/health
        return_content: true
```

## Запуск

Плейбук проверялся на локальной виртуальной машине Multipass, созданной с файлом `cloud-init.yaml`.

```bash
ansible-playbook site.yml --check   # пробный прогон
ansible-playbook site.yml           # настройка сервера
ansible-playbook site.yml           # повторный запуск, изменений быть не должно
```

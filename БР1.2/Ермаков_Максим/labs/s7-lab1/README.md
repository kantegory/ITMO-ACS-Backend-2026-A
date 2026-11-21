# Настройка Ubuntu ВМ средствами Ansible

## Файлы

- `ansible.cfg` — локальные параметры Ansible и проверки ключа сервера.
- `inventory.ini.example` — образец адреса и SSH-параметров;
- `group_vars/lab.yml` — настройки группы `lab`.
- `site.yml` — основной playbook.
- `templates/` — шаблоны HTML и Nginx.
- `requirements.txt` — версия Ansible для изолированной среды Python.


## Запуск после подготовки SSH


```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp inventory.ini.example inventory.ini
```

 Затем:

```bash
ansible-inventory --graph
ansible lab -m ansible.builtin.ping
ansible-playbook site.yml --syntax-check
ansible-playbook site.yml --list-tasks
ansible-playbook site.yml
```

## Проверка

```bash
curl -i http://31.77.175.107/
ssh -i ~/.ssh/itmo_ansible_lab -o IdentitiesOnly=yes labuser@31.77.175.107 whoami
```

Ожидаются HTTP 200, заголовок `X-Lab-Version: v1`, текст `Version: v1` и успешный вход под `labuser`. Для HTTP должен быть доступен TCP-порт 80.

Повторить тот же playbook, не меняя файлы:

```bash
ansible-playbook site.yml
```

Сразу после первого успешного запуска ожидается `changed=0`, `failed=0`, `unreachable=0`. При обновлении кэша apt спустя сутки или внешнем изменении системы некоторые изменения могут быть обоснованными.

## Изменение настройки

Заменить `lab_site_version: v1` на `lab_site_version: v2` в `group_vars/lab.yml`. После первоначальной успешной установки:

```bash
ansible-playbook site.yml --check --diff
ansible-playbook site.yml --diff
```

Первая команда прогнозирует изменения, вторая применяет их. Поменяются HTML и заголовок версии в Nginx; изменение конфигурации вызовет handler перечитывания. В обычном запуске перед этим проверяется `nginx -t`. Затем повторить внешний curl и обычный playbook: ожидаются версия v2 и отсутствие новых изменений.


## Обслуживание

При открытии нового локального терминала:

```bash
source .venv/bin/activate
ssh-add ~/.ssh/itmo_ansible_lab
```

Настройки меняются в `group_vars` и шаблонах с последующим запуском playbook.

Root используется для первоначального управления ВМ. `labuser` создаётся без прав sudo и с заблокированным паролем, вход разрешён по ключу. Настройки sshd и firewall playbook не меняет.

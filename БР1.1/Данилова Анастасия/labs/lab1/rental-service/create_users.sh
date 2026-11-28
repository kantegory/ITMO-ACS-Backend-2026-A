# Создать LANDLORD
curl -X POST http://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "firstUserPassword",
    "role": "LANDLORD",
    "first_name": "Ivan",
    "last_name": "Ivanov"
  }'

# Создать TENANT
curl -X POST http://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user2@example.com",
    "password": "password123",
    "role": "TENANT",
    "first_name": "Petr",
    "last_name": "Petrov"
  }'

  # Создать еще одного LANDLORD

  curl -X POST http://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "landlord2@example.com",
    "password": "firstUserPassword",
    "role": "LANDLORD",
    "first_name": "Sergey",
    "last_name": "Sergeev"
  }'

  curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "landlord2@example.com", "password": "firstUserPassword"}'
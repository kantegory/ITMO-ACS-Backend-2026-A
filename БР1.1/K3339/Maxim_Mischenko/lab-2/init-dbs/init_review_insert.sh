#!/bin/sh

set -e

echo "Waiting for gateway..."

until curl -sf http://gateway:8080/ping > /dev/null; do
  sleep 2
done

echo "Gateway is ready"
echo "Seeding reviews..."

token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzkxMTQwNjEsInJvbGUiOiJndWVzdCIsInVzZXJfaWQiOjF9.Un7efL6LU31RS2MVBdyz1UxwTOnMTL9_gvxxpeVcvKc'
curl -fsS -X POST http://gateway:8080/api/v1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"restaurant_id":1,"booking_id":101,"rating":5,"comment":"Отличная паста и очень уютная атмосфера"}'
curl -fsS -X POST http://gateway:8080/api/v1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"restaurant_id":1,"booking_id":102,"rating":4,"comment":"Пицца вкусная, но пришлось немного подождать"}'
curl -fsS -X POST http://gateway:8080/api/v1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"restaurant_id":2,"booking_id":103,"rating":5,"comment":"Лучшие роллы в городе"}'
curl -fsS -X POST http://gateway:8080/api/v1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"restaurant_id":2,"booking_id":104,"rating":3,"comment":"Нормально, но дороговато"}'
curl -fsS -X POST http://gateway:8080/api/v1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"restaurant_id":3,"booking_id":105,"rating":5,"comment":"Очень вкусные хинкали"}'
curl -fsS -X POST http://gateway:8080/api/v1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"restaurant_id":3,"booking_id":106,"rating":4,"comment":"Приятная атмосфера и живая музыка"}'
curl -fsS -X POST http://gateway:8080/api/v1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"restaurant_id":4,"booking_id":107,"rating":2,"comment":"Слишком остро и шумно"}'
curl -fsS -X POST http://gateway:8080/api/v1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"restaurant_id":5,"booking_id":108,"rating":5,"comment":"Потрясающий сервис"}'
curl -fsS -X POST http://gateway:8080/api/v1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"restaurant_id":5,"booking_id":109,"rating":4,"comment":"Красивое место для ужина"}'
curl -fsS -X POST http://gateway:8080/api/v1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"restaurant_id":6,"booking_id":110,"rating":5,"comment":"Очень ароматное карри"}'

echo "Seed completed"

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiTEFORExPUkQiLCJleHAiOjE3Nzg3NDQ5OTEsImlhdCI6MTc3ODY1ODU5MX0.ZN80UTjesQY76D6OoDZ9OLEjEkQHMEZL-f64lXH4Uac"

curl -X POST http://localhost:5001/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Modern Studio near Tverskaya",
    "type": "STUDIO",
    "city": "Moscow",
    "address": "Tverskaya street, 15",
    "latitude": 55.765,
    "longitude": 37.605,
    "description": "Bright studio with minimalist design. High ceilings, great location, 5 min to metro.",
    "price_per_month": 80000,
    "deposit": 80000,
    "commission": 4000,
    "area": 45,
    "prepayment": "40000",
    "min_rental_period": "3 months",
    "amenity_ids": [1, 2, 4, 7, 9]
  }'

  curl -X POST http://localhost:5001/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Cozy Apartment on Nevsky",
    "type": "APARTMENT",
    "city": "Saint Petersburg",
    "address": "Nevsky prospect, 88",
    "latitude": 59.931,
    "longitude": 30.360,
    "description": "Classic Saint-Petersburg apartment. Wooden floors, high ceilings, walking distance to all sights.",
    "price_per_month": 65000,
    "deposit": 65000,
    "commission": 3000,
    "area": 65,
    "prepayment": "50000",
    "min_rental_period": "6 months",
    "amenity_ids": [1, 2, 3, 6, 7]
  }'

  curl -X POST http://localhost:5001/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Country House with Garden",
    "type": "HOUSE",
    "city": "Moscow Oblast",
    "address": "Rublevskoe shosse, 25 km",
    "latitude": 55.728,
    "longitude": 37.368,
    "description": "Two-story brick house with large garden. BBQ area, parking for 3 cars, fireplace.",
    "price_per_month": 120000,
    "deposit": 120000,
    "commission": 6000,
    "area": 180,
    "prepayment": "60000",
    "min_rental_period": "12 months",
    "amenity_ids": [1, 2, 4, 5, 7, 10]
  }'

  curl -X POST http://localhost:5001/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Cozy Room in Shared Apartment",
    "type": "ROOM",
    "city": "Moscow",
    "address": "Molodezhnaya street, 10",
    "latitude": 55.746,
    "longitude": 37.412,
    "description": "Separate room in spacious apartment. Shared kitchen and bathroom. Utilities included.",
    "price_per_month": 25000,
    "deposit": 15000,
    "commission": 2000,
    "area": 18,
    "prepayment": "12500",
    "min_rental_period": "1 month",
    "amenity_ids": [1, 2, 3]
  }'

# Создать второго LANDLORD и добавить ему пентхаус

  curl -X POST http://localhost:5001/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d '{
    "title": "Luxury Penthouse with View",
    "type": "APARTMENT",
    "city": "Moscow",
    "address": "Kutuzovsky prospect, 30",
    "latitude": 55.751,
    "longitude": 37.542,
    "description": "Top floor penthouse with panoramic windows. Two-level, private terrace, concierge.",
    "price_per_month": 300000,
    "deposit": 300000,
    "commission": 15000,
    "area": 250,
    "prepayment": "150000",
    "min_rental_period": "12 months",
    "amenity_ids": [1, 2, 4, 5, 6, 7, 8, 9, 10]
  }'

INSERT INTO properties (
    id, title, city, price, created_at, owner_id, type, address,
    latitude, longitude, description, price_per_month, deposit,
    commission, area, prepayment, min_rental_period, is_verified, is_vacant, updated_at
) VALUES (
    1,
    'Modern Studio near Tverskaya',
    'Moscow',
    80000,
    NOW(),
    1,
    'STUDIO',
    'Tverskaya street, 15',
    55.765,
    37.605,
    'Bright studio with minimalist design. High ceilings, great location, 5 min to metro.',
    80000,
    80000,
    4000,
    45,
    '40000',
    '3 months',
    true,
    true,
    NOW()
);

INSERT INTO properties (
    id, title, city, price, created_at, owner_id, type, address,
    latitude, longitude, description, price_per_month, deposit,
    commission, area, prepayment, min_rental_period, is_verified, is_vacant, updated_at
) VALUES (
    2,
    'Cozy Apartment on Nevsky',
    'Saint Petersburg',
    65000,
    NOW(),
    1,
    'APARTMENT',
    'Nevsky prospect, 88',
    59.931,
    30.360,
    'Classic Saint-Petersburg apartment. Wooden floors, high ceilings, walking distance to all sights.',
    65000,
    65000,
    3000,
    65,
    '50000',
    '6 months',
    true,
    true,
    NOW()
);

INSERT INTO properties (
    id, title, city, price, created_at, owner_id, type, address,
    latitude, longitude, description, price_per_month, deposit,
    commission, area, prepayment, min_rental_period, is_verified, is_vacant, updated_at
) VALUES (
    3,
    'Country House with Garden',
    'Moscow Oblast',
    120000,
    NOW(),
    1,
    'HOUSE',
    'Rublevskoe shosse, 25 km',
    55.728,
    37.368,
    'Two-story brick house with large garden. BBQ area, parking for 3 cars, fireplace.',
    120000,
    120000,
    6000,
    180,
    '60000',
    '12 months',
    false,
    true,
    NOW()
);

INSERT INTO properties (
    id, title, city, price, created_at, owner_id, type, address,
    latitude, longitude, description, price_per_month, deposit,
    commission, area, prepayment, min_rental_period, is_verified, is_vacant, updated_at
) VALUES (
    4,
    'Cozy Room in Shared Apartment',
    'Moscow',
    25000,
    NOW(),
    1,
    'ROOM',
    'Molodezhnaya street, 10',
    55.746,
    37.412,
    'Separate room in spacious apartment. Shared kitchen and bathroom. Utilities included.',
    25000,
    15000,
    2000,
    18,
    '12500',
    '1 month',
    false,
    true,
    NOW()
);



INSERT INTO users (id, role, first_name, last_name, email, password, is_verified, is_active, created_at, updated_at)
VALUES (
    3,
    'LANDLORD',
    'Sergey',
    'Sergeev',
    'landlord2@example.com',
    '$2a$10$FwUYIztnTSQsnGo1mAqtfOfUdp3zDBGEewlyBmED8lJU84GGkBY5u',  -- тот же пароль firstUserPassword
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- И ему недвижимость (если захотите протестировать другого landlord)
INSERT INTO properties (
    id, title, city, price, created_at, owner_id, type, address,
    latitude, longitude, description, price_per_month, deposit,
    commission, area, prepayment, min_rental_period, is_verified, is_vacant, updated_at
) VALUES (
    5,
    'Luxury Penthouse with View',
    'Moscow',
    300000,
    NOW(),
    3,
    'APARTMENT',
    'Kutuzovsky prospect, 30',
    55.751,
    37.542,
    'Top floor penthouse with panoramic windows. Two-level, private terrace, concierge.',
    300000,
    300000,
    15000,
    250,
    '150000',
    '12 months',
    true,
    true,
    NOW()
);



-- сколько объектов у каждого landlord

SELECT 
    u.id AS landlord_id,
    u.email,
    u.first_name,
    COUNT(p.id) AS properties_count
FROM users u
LEFT JOIN properties p ON u.id = p.owner_id
WHERE u.role = 'LANDLORD'
GROUP BY u.id, u.email, u.first_name
ORDER BY u.id;
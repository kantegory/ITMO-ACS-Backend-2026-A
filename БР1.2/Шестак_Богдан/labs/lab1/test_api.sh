#!/bin/bash
# Sample API Requests for Job Search API

API_URL="http://localhost:8000"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Job Search API - Sample Requests${NC}\n"

# 1. Register as Applicant
echo -e "${GREEN}1. Register as Applicant${NC}"
APPLICANT_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "role": "applicant",
    "first_name": "John",
    "last_name": "Doe"
  }')

echo "$APPLICANT_RESPONSE" | jq .
APPLICANT_TOKEN=$(echo "$APPLICANT_RESPONSE" | jq -r '.tokens.access_token')
echo ""

# 2. Register as Employer
echo -e "${GREEN}2. Register as Employer${NC}"
EMPLOYER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "company@example.com",
    "password": "password123",
    "role": "employer",
    "first_name": "Tech Company"
  }')

echo "$EMPLOYER_RESPONSE" | jq .
EMPLOYER_TOKEN=$(echo "$EMPLOYER_RESPONSE" | jq -r '.tokens.access_token')
echo ""

# 3. Get my profile
echo -e "${GREEN}3. Get My Profile (Applicant)${NC}"
curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $APPLICANT_TOKEN" | jq .
echo ""

# 4. Update profile
echo -e "${GREEN}4. Update Profile${NC}"
curl -s -X PATCH "$API_URL/users/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $APPLICANT_TOKEN" \
  -d '{
    "phone": "+1234567890"
  }' | jq .
echo ""

# 5. List skills
echo -e "${GREEN}5. List Skills${NC}"
curl -s -X GET "$API_URL/skills" | jq .
echo ""

# 6. Create resume
echo -e "${GREEN}6. Create Resume${NC}"
RESUME_RESPONSE=$(curl -s -X POST "$API_URL/resumes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $APPLICANT_TOKEN" \
  -d '{
    "title": "Senior Python Developer",
    "summary": "Experienced Python developer with 5+ years in web development",
    "desired_position": "Senior Backend Engineer",
    "desired_salary": 120000,
    "city": "San Francisco",
    "is_published": true
  }')

echo "$RESUME_RESPONSE" | jq .
RESUME_ID=$(echo "$RESUME_RESPONSE" | jq -r '.id')
echo ""

# 7. Add work experience
echo -e "${GREEN}7. Add Work Experience${NC}"
curl -s -X POST "$API_URL/resumes/$RESUME_ID/experience" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $APPLICANT_TOKEN" \
  -d '{
    "company": "Tech Corp",
    "position": "Backend Developer",
    "started_at": "2020-01-15",
    "ended_at": "2023-06-30",
    "description": "Developed REST APIs using FastAPI"
  }' | jq .
echo ""

# 8. Create vacancy
echo -e "${GREEN}8. Create Vacancy (Employer)${NC}"
VACANCY_RESPONSE=$(curl -s -X POST "$API_URL/vacancies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -d '{
    "title": "Senior Python Developer",
    "description": "Looking for experienced Python developer for our backend team",
    "requirements": "5+ years of experience with Python and FastAPI",
    "industry": "Software Development",
    "salary_from": 100000,
    "salary_to": 150000,
    "experience": "three_to_six",
    "employment_type": "full_time",
    "city": "San Francisco",
    "skill_ids": [1, 2]
  }')

echo "$VACANCY_RESPONSE" | jq .
VACANCY_ID=$(echo "$VACANCY_RESPONSE" | jq -r '.id')
echo ""

# 9. List vacancies
echo -e "${GREEN}9. List Vacancies${NC}"
curl -s -X GET "$API_URL/vacancies?city=San%20Francisco" | jq .
echo ""

# 10. Apply for vacancy
echo -e "${GREEN}10. Apply for Vacancy${NC}"
APPLICATION_RESPONSE=$(curl -s -X POST "$API_URL/vacancies/$VACANCY_ID/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $APPLICANT_TOKEN" \
  -d "{
    \"resume_id\": $RESUME_ID,
    \"cover_letter\": \"I am interested in this position\"
  }")

echo "$APPLICATION_RESPONSE" | jq .
APPLICATION_ID=$(echo "$APPLICATION_RESPONSE" | jq -r '.id')
echo ""

# 11. List my applications
echo -e "${GREEN}11. List My Applications${NC}"
curl -s -X GET "$API_URL/applications/my" \
  -H "Authorization: Bearer $APPLICANT_TOKEN" | jq .
echo ""

# 12. View applications on vacancy (Employer)
echo -e "${GREEN}12. View Applications on Vacancy (Employer)${NC}"
curl -s -X GET "$API_URL/vacancies/$VACANCY_ID/applications" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN" | jq .
echo ""

# 13. Update application status
echo -e "${GREEN}13. Update Application Status${NC}"
curl -s -X PATCH "$API_URL/applications/$APPLICATION_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -d '{
    "status": "invited"
  }' | jq .
echo ""

echo -e "${BLUE}Tests completed!${NC}"

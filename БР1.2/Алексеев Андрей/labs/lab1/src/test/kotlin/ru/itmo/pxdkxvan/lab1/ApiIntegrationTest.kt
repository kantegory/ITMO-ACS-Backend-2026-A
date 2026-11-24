package ru.itmo.pxdkxvan.lab1

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.transaction.annotation.Transactional
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import ru.itmo.pxdkxvan.lab1.role.repository.RoleRepository
import ru.itmo.pxdkxvan.lab1.user.repository.UserAccountRepository
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.assertNotNull

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Testcontainers(disabledWithoutDocker = true)
class ApiIntegrationTest(
    @Autowired private val mockMvc: MockMvc,
    @Autowired private val objectMapper: ObjectMapper,
    @Autowired private val userAccountRepository: UserAccountRepository,
    @Autowired private val roleRepository: RoleRepository,
) {

    @Test
    fun `unauthorized access and domain validation return expected errors`() {
        val unauthorized = perform(get("/api/v1/users/me"), expectedStatus = 401)
        assertEquals("unauthorized", unauthorized["error"].asText())

        val applicant = registerAndLogin("APPLICANT")
        val invalidResume = perform(
            post("/api/v1/resumes"),
            body = mapOf(
                "title" to "Java backend developer",
                "desired_position" to "Backend developer",
                "about_me" to "I write APIs",
                "skill_ids" to listOf(SKILL_KOTLIN_ID.toString()),
                "educations" to listOf(
                    mapOf(
                        "institution_name" to "ITMO University",
                        "degree" to "Bachelor",
                        "start_date" to "2018-09-01",
                        "end_date" to "2022-06-30",
                    ),
                ),
                "work_experiences" to listOf(
                    mapOf(
                        "company_name" to "Acme",
                        "position" to "Backend developer",
                        "start_date" to "2022-07-01",
                        "end_date" to "2024-01-01",
                    ),
                ),
                "salary_expectation" to 180000,
                "city" to "Saint Petersburg",
                "employment_type" to "FULL_TIME",
                "work_format" to "REMOTE",
                "status" to "UNKNOWN_STATUS",
            ),
            token = applicant.token,
            expectedStatus = 400,
        )

        assertEquals("validation_error", invalidResume["error"].asText())
        assertEquals("status", invalidResume["details"][0]["field"].asText())
    }

    @Test
    fun `employer can create company profile vacancy and list own vacancies`() {
        val employer = registerAndLogin("EMPLOYER")
        val company = createCompany(employer.token)
        createEmployerProfile(employer.token, company.id)
        val vacancy = createVacancy(employer.token, company.id)

        assertNotNull(vacancy.primaryAssignmentId)

        val myVacancies = perform(
            get("/api/v1/vacancies/my").param("search[statuses]", "PUBLISHED"),
            token = employer.token,
            expectedStatus = 200,
        )
        assertEquals(1, myVacancies["items"].size())
        assertEquals(vacancy.id.toString(), myVacancies["items"][0]["id"].asText())
        assertEquals(1L, myVacancies["meta"]["total"].asLong())

        val assignments = perform(
            get("/api/v1/vacancies/${vacancy.id}/assignments"),
            token = employer.token,
            expectedStatus = 200,
        )
        assertEquals(1, assignments["items"].size())
        assertEquals("PRIMARY", assignments["items"][0]["assignment_role"].asText())
    }

    @Test
    fun `recreating employer profile rebinds it to a new company`() {
        val employer = registerAndLogin("EMPLOYER")
        val firstCompany = createCompany(employer.token)
        createEmployerProfile(employer.token, firstCompany.id)

        val secondCompany = createCompany(employer.token)
        val reboundProfile = createEmployerProfile(employer.token, secondCompany.id)

        assertEquals(secondCompany.id.toString(), reboundProfile.companyId.toString())

        val updatedCompany = perform(
            patch("/api/v1/companies/${secondCompany.id}"),
            body = mapOf("title" to "Acme Corp 2"),
            token = employer.token,
            expectedStatus = 200,
        )
        assertEquals(secondCompany.id.toString(), updatedCompany["id"].asText())

        val vacancy = createVacancy(employer.token, secondCompany.id)
        assertEquals(secondCompany.id.toString(), perform(get("/api/v1/vacancies/${vacancy.id}"), expectedStatus = 200)["company"]["id"].asText())
    }

    @Test
    fun `employer can manage vacancy assignments`() {
        val employer = registerAndLogin("EMPLOYER")
        val company = createCompany(employer.token)
        createEmployerProfile(employer.token, company.id)
        val vacancy = createVacancy(employer.token, company.id)

        val secondEmployer = registerAndLogin("EMPLOYER")
        val secondProfile = createEmployerProfile(secondEmployer.token, company.id)

        val newAssignment = perform(
            post("/api/v1/vacancies/${vacancy.id}/assignments"),
            body = mapOf(
                "employer_profile_id" to secondProfile.id.toString(),
                "assignment_role" to "RECRUITER",
            ),
            token = employer.token,
            expectedStatus = 201,
        )
        val assignmentId = UUID.fromString(newAssignment["id"].asText())

        val updatedAssignment = perform(
            patch("/api/v1/vacancy-assignments/$assignmentId"),
            body = mapOf("assignment_role" to "PRIMARY"),
            token = employer.token,
            expectedStatus = 200,
        )
        assertEquals("PRIMARY", updatedAssignment["assignment_role"].asText())

        val publicVacancy = perform(get("/api/v1/vacancies/${vacancy.id}"), expectedStatus = 200)
        assertEquals(assignmentId.toString(), publicVacancy["vacancy_assignment_id"].asText())

        perform(delete("/api/v1/vacancy-assignments/$assignmentId"), token = employer.token, expectedStatus = 204)
        val assignmentsAfterDelete = perform(
            get("/api/v1/vacancies/${vacancy.id}/assignments"),
            token = employer.token,
            expectedStatus = 200,
        )
        assertEquals(1, assignmentsAfterDelete["items"].size())
    }

    @Test
    fun `applicant can create resume apply to vacancy and employer can review application`() {
        val employer = registerAndLogin("EMPLOYER")
        val company = createCompany(employer.token)
        createEmployerProfile(employer.token, company.id)
        val vacancy = createVacancy(employer.token, company.id)

        val applicant = registerAndLogin("APPLICANT")
        val resume = createResume(applicant.token)

        val application = perform(
            post("/api/v1/vacancies/${vacancy.id}/applications"),
            body = mapOf(
                "resume_id" to resume.id.toString(),
                "cover_letter" to "I am interested in this role",
            ),
            token = applicant.token,
            expectedStatus = 201,
        )
        val applicationId = UUID.fromString(application["id"].asText())
        assertEquals("PENDING", application["status"].asText())

        val myApplications = perform(get("/api/v1/applications/my"), token = applicant.token, expectedStatus = 200)
        assertEquals(1L, myApplications["meta"]["total"].asLong())
        assertEquals(applicationId.toString(), myApplications["items"][0]["id"].asText())

        val vacancyApplications = perform(
            get("/api/v1/vacancies/${vacancy.id}/applications"),
            token = employer.token,
            expectedStatus = 200,
        )
        assertEquals(1L, vacancyApplications["meta"]["total"].asLong())

        val updated = perform(
            patch("/api/v1/applications/$applicationId/status"),
            body = mapOf("status" to "VIEWED"),
            token = employer.token,
            expectedStatus = 200,
        )
        assertEquals("VIEWED", updated["status"].asText())
    }

    @Test
    fun `applicant can manage favorites and vacancy views`() {
        val employer = registerAndLogin("EMPLOYER")
        val company = createCompany(employer.token)
        createEmployerProfile(employer.token, company.id)
        val vacancy = createVacancy(employer.token, company.id)

        val applicant = registerAndLogin("APPLICANT")

        val favorite = perform(
            post("/api/v1/vacancies/favorites/${vacancy.id}"),
            token = applicant.token,
            expectedStatus = 201,
        )
        assertEquals(vacancy.id.toString(), favorite["vacancy_id"].asText())

        val favorites = perform(get("/api/v1/vacancies/favorites"), token = applicant.token, expectedStatus = 200)
        assertEquals(1L, favorites["meta"]["total"].asLong())

        val view = perform(
            post("/api/v1/vacancies/history/${vacancy.id}"),
            token = applicant.token,
            expectedStatus = 201,
        )
        assertEquals(vacancy.id.toString(), view["vacancy_id"].asText())

        val views = perform(get("/api/v1/vacancies/history"), token = applicant.token, expectedStatus = 200)
        assertEquals(1L, views["meta"]["total"].asLong())

        perform(delete("/api/v1/vacancies/favorites/${vacancy.id}"), token = applicant.token, expectedStatus = 204)
        val favoritesAfterDelete = perform(get("/api/v1/vacancies/favorites"), token = applicant.token, expectedStatus = 200)
        assertEquals(0L, favoritesAfterDelete["meta"]["total"].asLong())
    }

    @Test
    fun `role restrictions are enforced`() {
        val applicant = registerAndLogin("APPLICANT")
        val createCompanyAsApplicant = perform(
            post("/api/v1/companies"),
            body = mapOf("title" to "Forbidden LLC"),
            token = applicant.token,
            expectedStatus = 403,
        )
        assertEquals("forbidden", createCompanyAsApplicant["error"].asText())

        val employer = registerAndLogin("EMPLOYER")
        val createResumeAsEmployer = perform(
            post("/api/v1/resumes"),
            body = mapOf(
                "title" to "Should fail",
                "desired_position" to "Should fail",
                "about_me" to "Should fail",
                "skill_ids" to listOf(SKILL_KOTLIN_ID.toString()),
                "educations" to listOf(
                    mapOf(
                        "institution_name" to "ITMO University",
                        "degree" to "Bachelor",
                        "start_date" to "2018-09-01",
                    ),
                ),
                "work_experiences" to listOf(
                    mapOf(
                        "company_name" to "Acme",
                        "position" to "Backend developer",
                        "start_date" to "2022-07-01",
                    ),
                ),
                "salary_expectation" to 100000,
                "city" to "Moscow",
                "employment_type" to "FULL_TIME",
                "work_format" to "OFFICE",
                "status" to "DRAFT",
            ),
            token = employer.token,
            expectedStatus = 403,
        )
        assertEquals("forbidden", createResumeAsEmployer["error"].asText())
    }

    @Test
    fun `admin can list create and assign roles`() {
        val admin = registerAndLogin("EMPLOYER")
        elevateToRole(admin.userId, "ADMIN")

        val roles = perform(get("/api/v1/roles"), token = admin.token, expectedStatus = 200)
        assertTrue(roles["items"].any { it["name"].asText() == "ADMIN" })

        val createdRole = perform(
            post("/api/v1/roles"),
            body = mapOf(
                "name" to "reviewer manager",
                "description" to "Can review content",
            ),
            token = admin.token,
            expectedStatus = 201,
        )
        assertEquals("REVIEWER_MANAGER", createdRole["name"].asText())

        val applicant = registerAndLogin("APPLICANT")
        val updatedUser = perform(
            post("/api/v1/users/${applicant.userId}/roles"),
            body = mapOf("role_id" to createdRole["id"].asText()),
            token = admin.token,
            expectedStatus = 200,
        )
        assertTrue(updatedUser["roles"].any { it["name"].asText() == "REVIEWER_MANAGER" })
    }

    private fun registerAndLogin(role: String): AuthContext {
        val suffix = UUID.randomUUID().toString().take(8)
        val email = "$role-$suffix@example.com".lowercase()
        val phone = "79${suffix.filter { it.isDigit() }.padEnd(9, '1').take(9)}"
        val password = "Password123"

        perform(
            post("/api/v1/auth/register"),
            body = mapOf(
                "role" to role,
                "first_name" to "Test",
                "last_name" to role.lowercase(),
                "middle_name" to "Flow",
                "email" to email,
                "password" to password,
                "phone" to phone,
            ),
            expectedStatus = 201,
        )

        val login = perform(
            post("/api/v1/auth/login"),
            body = mapOf(
                "email" to email,
                "password" to password,
            ),
            expectedStatus = 200,
        )

        return AuthContext(
            token = login["access_token"].asText(),
            userId = UUID.fromString(login["user"]["id"].asText()),
            email = email,
        )
    }

    private fun createCompany(token: String): CreatedCompany {
        val company = perform(
            post("/api/v1/companies"),
            body = mapOf(
                "title" to "Acme Corp",
                "description" to "Product company",
                "website" to "https://acme.example.com",
                "industry_hint" to "IT",
                "address" to "Nevsky prospect",
                "employee_count" to 250,
            ),
            token = token,
            expectedStatus = 201,
        )

        return CreatedCompany(UUID.fromString(company["id"].asText()))
    }

    private fun createEmployerProfile(token: String, companyId: UUID): CreatedEmployerProfile {
        val profile = perform(
            post("/api/v1/employer-profiles"),
            body = mapOf(
                "company_id" to companyId.toString(),
                "position" to "HR Lead",
            ),
            token = token,
            expectedStatus = 201,
        )

        return CreatedEmployerProfile(
            id = UUID.fromString(profile["id"].asText()),
            companyId = UUID.fromString(profile["company"]["id"].asText()),
        )
    }

    private fun createVacancy(token: String, companyId: UUID): CreatedVacancy {
        val vacancy = perform(
            post("/api/v1/vacancies"),
            body = mapOf(
                "company_id" to companyId.toString(),
                "industry_id" to INDUSTRY_ID.toString(),
                "experience_level_id" to EXPERIENCE_LEVEL_ID.toString(),
                "title" to "Senior Kotlin Developer",
                "description" to "Develop backend services",
                "skill_ids" to listOf(
                    SKILL_KOTLIN_ID.toString(),
                    SKILL_SPRING_BOOT_ID.toString(),
                    SKILL_POSTGRESQL_ID.toString(),
                ),
                "requirements" to listOf(
                    mapOf("value" to "Kotlin"),
                    mapOf("value" to "Spring Boot"),
                    mapOf("value" to "PostgreSQL"),
                ),
                "responsibilities" to listOf(
                    mapOf("value" to "Build APIs"),
                    mapOf("value" to "Support services"),
                ),
                "benefits" to listOf(
                    mapOf("value" to "Flexible schedule"),
                ),
                "salary_from" to 250000,
                "salary_to" to 320000,
                "city" to "Saint Petersburg",
                "employment_type" to "FULL_TIME",
                "work_format" to "HYBRID",
                "status" to "PUBLISHED",
            ),
            token = token,
            expectedStatus = 201,
        )

        return CreatedVacancy(
            id = UUID.fromString(vacancy["id"].asText()),
            primaryAssignmentId = vacancy["vacancy_assignment_id"]?.takeIf { !it.isNull }?.asText()?.let(UUID::fromString),
        )
    }

    private fun createResume(token: String): CreatedResume {
        val resume = perform(
            post("/api/v1/resumes"),
            body = mapOf(
                "title" to "Backend Engineer CV",
                "desired_position" to "Backend Engineer",
                "about_me" to "I build reliable services",
                "skill_ids" to listOf(SKILL_KOTLIN_ID.toString(), SKILL_SPRING_BOOT_ID.toString()),
                "educations" to listOf(
                    mapOf(
                        "institution_name" to "ITMO University",
                        "degree" to "Bachelor",
                        "specialization" to "Software Engineering",
                        "start_date" to "2017-09-01",
                        "end_date" to "2021-06-30",
                    ),
                ),
                "work_experiences" to listOf(
                    mapOf(
                        "company_name" to "Tech Corp",
                        "position" to "Backend Engineer",
                        "city" to "Saint Petersburg",
                        "start_date" to "2021-07-01",
                        "end_date" to "2024-01-01",
                        "description" to "3 years of backend development",
                    ),
                ),
                "salary_expectation" to 220000,
                "city" to "Saint Petersburg",
                "employment_type" to "FULL_TIME",
                "work_format" to "REMOTE",
                "status" to "PUBLISHED",
            ),
            token = token,
            expectedStatus = 201,
        )

        return CreatedResume(UUID.fromString(resume["id"].asText()))
    }

    private fun perform(
        builder: MockHttpServletRequestBuilder,
        body: Any? = null,
        token: String? = null,
        expectedStatus: Int,
    ): JsonNode {
        builder.contextPath(API_CONTEXT_PATH)
        builder.contentType(MediaType.APPLICATION_JSON)
        if (body != null) {
            builder.content(objectMapper.writeValueAsBytes(body))
        }
        if (token != null) {
            builder.header(HttpHeaders.AUTHORIZATION, "Bearer $token")
        }

        val response = mockMvc.perform(builder).andReturn().response
        assertEquals(expectedStatus, response.status, response.contentAsString)

        if (expectedStatus == 204) {
            return objectMapper.createObjectNode()
        }

        val content = response.contentAsString
        val json = content.takeIf { it.isNotBlank() }?.let { objectMapper.readTree(it) }
        assertNotNull(json, "Expected JSON body for status $expectedStatus")
        return json
    }

    private fun elevateToRole(userId: UUID, roleName: String) {
        val user = userAccountRepository.findById(userId).orElseThrow()
        val role = roleRepository.findByName(roleName).also { assertNotNull(it) }!!
        user.roles.add(role)
        userAccountRepository.save(user)
    }

    private data class AuthContext(
        val token: String,
        val userId: UUID,
        val email: String,
    )

    private data class CreatedCompany(val id: UUID)

    private data class CreatedEmployerProfile(
        val id: UUID,
        val companyId: UUID,
    )

    private data class CreatedVacancy(
        val id: UUID,
        val primaryAssignmentId: UUID?,
    )

    private data class CreatedResume(val id: UUID)

    companion object {
        @Container
        @JvmStatic
        private val postgres = KPostgreSQLContainer("postgres:18").apply {
            withDatabaseName("job_search")
            withUsername("job_search")
            withPassword("job_search")
        }

        @JvmStatic
        @DynamicPropertySource
        fun postgresProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
            registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName)
        }

        private const val API_CONTEXT_PATH = "/api/v1"
        private val INDUSTRY_ID: UUID = UUID.fromString("0196a000-0001-7000-8000-000000000001")
        private val EXPERIENCE_LEVEL_ID: UUID = UUID.fromString("0196a000-0002-7000-8000-000000000002")
        private val SKILL_KOTLIN_ID: UUID = UUID.fromString("0196a000-0003-7000-8000-000000000001")
        private val SKILL_SPRING_BOOT_ID: UUID = UUID.fromString("0196a000-0003-7000-8000-000000000002")
        private val SKILL_POSTGRESQL_ID: UUID = UUID.fromString("0196a000-0003-7000-8000-000000000003")
    }
}

private class KPostgreSQLContainer(imageName: String) : PostgreSQLContainer<KPostgreSQLContainer>(imageName)

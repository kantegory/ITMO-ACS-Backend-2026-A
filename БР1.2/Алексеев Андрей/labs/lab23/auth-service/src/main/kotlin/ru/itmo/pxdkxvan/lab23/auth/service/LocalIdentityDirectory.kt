package ru.itmo.pxdkxvan.lab23.auth.service

import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import ru.itmo.pxdkxvan.lab23.auth.dto.AuthContextResponse
import ru.itmo.pxdkxvan.lab23.auth.dto.UserRegistrationRequest
import ru.itmo.pxdkxvan.lab23.auth.entity.AuthAccount
import ru.itmo.pxdkxvan.lab23.auth.repository.AuthAccountRepository
import java.util.UUID

@Service
@Profile("standalone-auth")
class LocalIdentityDirectory(private val accounts: AuthAccountRepository) : IdentityDirectory {
    override fun create(request: UserRegistrationRequest): AuthContextResponse {
        require(request.role == "APPLICANT") { "Unsupported role" }
        return accounts.save(
            AuthAccount(
                email = request.email,
                phone = request.phone,
                firstName = request.firstName,
                lastName = request.lastName,
                middleName = request.middleName,
            )
        ).context()
    }

    override fun find(userId: UUID): AuthContextResponse =
        accounts.findById(userId).orElseThrow { NoSuchElementException("Account not found") }.context()

    private fun AuthAccount.context() =
        AuthContextResponse(id, email, listOf("APPLICANT"), active)
}

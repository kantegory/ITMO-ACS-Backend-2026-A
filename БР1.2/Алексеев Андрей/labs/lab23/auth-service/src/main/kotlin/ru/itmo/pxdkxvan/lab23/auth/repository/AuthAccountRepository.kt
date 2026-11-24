package ru.itmo.pxdkxvan.lab23.auth.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.auth.entity.AuthAccount
import java.util.UUID

interface AuthAccountRepository : JpaRepository<AuthAccount, UUID>

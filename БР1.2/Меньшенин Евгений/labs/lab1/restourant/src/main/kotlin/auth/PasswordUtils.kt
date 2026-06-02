package com.mezhendosina.auth

import org.mindrot.jbcrypt.BCrypt

fun hashPassword(password: String): String = BCrypt.hashpw(password, BCrypt.gensalt(8))

fun checkPassword(plainPassword: String, hashedPassword: String): Boolean =
    BCrypt.checkpw(plainPassword, hashedPassword)

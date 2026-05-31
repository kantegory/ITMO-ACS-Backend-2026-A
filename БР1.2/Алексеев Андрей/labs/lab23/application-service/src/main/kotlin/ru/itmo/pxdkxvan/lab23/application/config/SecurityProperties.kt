package ru.itmo.pxdkxvan.lab23.application.config

data class SecurityProperties(
    var jwtSecret: String = "5d425331c66b17a28480fd38d2128e8350a24d535f23061c8d86bce66bdbcc44",
    var serviceToken: String = "df0670418aa48ee9017ad05da2a1367b04e96686e5fb1bb0",
)

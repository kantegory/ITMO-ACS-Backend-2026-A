package ru.itmo.restaurantbooking.auth.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import ru.itmo.restaurantbooking.auth.service.JwtService

@Component
class JwtAuthenticationFilter(
    private val jwtService: JwtService
) : OncePerRequestFilter() {

    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
        val header = request.getHeader("Authorization")
        if (header != null && header.startsWith("Bearer ")) {
            val token = header.removePrefix("Bearer ").trim()
            try {
                val user = jwtService.parse(token)
                val authorities = listOf(SimpleGrantedAuthority("ROLE_${user.role.name}"))
                SecurityContextHolder.getContext().authentication = UsernamePasswordAuthenticationToken(user, null, authorities)
            } catch (_: Exception) {
            }
        }
        filterChain.doFilter(request, response)
    }
}

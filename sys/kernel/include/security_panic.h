#pragma once

/**
 * @brief Immediately halts the microkernel, purges volatile keys, 
 *        and cuts off the storage controllers.
 * @param threat_origin Descriptive string detailing why the panic was thrown.
 */
void __attribute__((noreturn)) execute_kernel_security_panic(const char* threat_origin);
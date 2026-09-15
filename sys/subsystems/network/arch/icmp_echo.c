#include "icmp_echo.h"
#include <stdio.h>

void ping_init(void) {
    printf("[Net Arch]: ICMP echo service active.\\n");
}

void ping_send_now(uint32_t target_ip) {
    printf("[Net Arch]: Transmitting ICMP echo ping request to 0x%08X...\\n", target_ip);
}

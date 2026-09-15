#pragma once
#include <stdint.h>

void ping_init(void);
void ping_send_now(uint32_t target_ip);

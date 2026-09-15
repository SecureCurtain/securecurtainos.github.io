#pragma once
#include <stdint.h>

int ethernetif_init(void* netif);
int ethernetif_input(void* netif, const uint8_t* frame_data, uint32_t len);
int ethernetif_output(void* netif, const uint8_t* frame_data, uint32_t len);

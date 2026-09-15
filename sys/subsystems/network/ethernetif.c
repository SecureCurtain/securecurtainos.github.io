#include "lwipopts.h"
#include <stdint.h>
#include <string.h>

int ethernetif_init(void* netif) {
    return 0;
}

int ethernetif_input(void* netif, const uint8_t* frame_data, uint32_t len) {
    return 0;
}

int ethernetif_output(void* netif, const uint8_t* frame_data, uint32_t len) {
    return 0;
}

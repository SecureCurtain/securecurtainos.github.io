#pragma once
#include <stdint.h>
#include <stdbool.h>

#define TUNNEL_MAGIC_ENCAP 0x4E54554E // "NTUN" encapsulation header tag

typedef struct {
    uint32_t magic;
    uint32_t sequence;
    uint8_t  initialization_vector[16];
    uint32_t payload_length;
} TunnelHeader;

void init_network_tunnel_interface(uint32_t virtual_ip, uint32_t physical_peer_ip);
void encapsulate_and_encrypt_tunnel_stream(const uint8_t* plaintext_ip_packet, uint32_t length);
void decapsulate_and_decrypt_tunnel_stream(const uint8_t* incoming_raw_packet, uint32_t length);
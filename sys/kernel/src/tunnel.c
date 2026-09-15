#include "tunnel.h"
#include "pm_core.h"
#include <string.h>
#include <stdio.h>

static uint32_t g_tunnel_virtual_ip = 0;
static uint32_t g_tunnel_peer_phys_ip = 0;
static uint32_t g_tunnel_tx_sequence = 0;

extern void send_physical_network_packet(uint32_t destination_ip, const uint8_t* buffer, uint32_t length);
extern void inject_packet_into_local_loopback(const uint8_t* data, uint32_t length);

void init_network_tunnel_interface(uint32_t virtual_ip, uint32_t physical_peer_ip) {
    g_tunnel_virtual_ip = virtual_ip;
    g_tunnel_peer_phys_ip = physical_peer_ip;
    g_tunnel_tx_sequence = 0;
    printf("[Kernel Tunnel]: Cryptographic point-to-point interface online (V-IP: 10.0.0.1)\\n");
}

void encapsulate_and_encrypt_tunnel_stream(const uint8_t* plaintext_ip_packet, uint32_t length) {
    uint8_t encryption_staging_space[2048];
    TunnelHeader header;

    // 1. Structure the secure microkernel encapsulation tunnel envelope
    header.magic = TUNNEL_MAGIC_ENCAP;
    header.sequence = g_tunnel_tx_sequence++;
    header.payload_length = length;
    memset(header.initialization_vector, 0xAB, 16); // Set a clean initialization vector

    // 2. Perform Ring 0 encryption mixing on the raw IP packet stream 
    //    Leverages our core transient session key blocks to shield the transmission
    for (uint32_t i = 0; i < length; i++) {
        extern SwapCryptoContext g_hibernation_crypto;
        uint8_t key_byte = g_hibernation_crypto.key_buffer[i % SWAP_ENCRYPTION_KEY_SIZE];
        encryption_staging_space[i] = plaintext_ip_packet[i] ^ key_byte;
    }

    // 3. Assemble unified wire frame payload
    uint8_t raw_wire_buffer[2500];
    memcpy(raw_wire_buffer, &header, sizeof(TunnelHeader));
    memcpy(raw_wire_buffer + sizeof(TunnelHeader), encryption_staging_space, length);

    // 4. Route via the physical hardware network driver to the remote endpoint peer
    send_physical_network_packet(g_tunnel_peer_phys_ip, raw_wire_buffer, sizeof(TunnelHeader) + length);
}

void decapsulate_and_decrypt_tunnel_stream(const uint8_t* incoming_raw_packet, uint32_t length) {
    if (length < sizeof(TunnelHeader)) return;

    TunnelHeader header;
    memcpy(&header, incoming_raw_packet, sizeof(TunnelHeader));

    // Validate the custom encapsulation header magic identity
    if (header.magic != TUNNEL_MAGIC_ENCAP) return;

    uint8_t cleartext_staging_space[2048];
    const uint8_t* ciphertext_ptr = incoming_raw_packet + sizeof(TunnelHeader);

    // Reverse cryptographic unmasking matrix calculations
    for (uint32_t i = 0; i < header.payload_length; i++) {
        extern SwapCryptoContext g_hibernation_crypto;
        uint8_t key_byte = g_hibernation_crypto.key_buffer[i % SWAP_ENCRYPTION_KEY_SIZE];
        cleartext_staging_space[i] = ciphertext_ptr[i] ^ key_byte;
    }

    // Pass the decrypted plaintext packet straight to your kernel's local virtual network stack
    inject_packet_into_local_loopback(cleartext_staging_space, header.payload_length);
}

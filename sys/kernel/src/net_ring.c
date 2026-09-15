// =========================================================================
// PHYSICAL BUS-MASTERING NETWORK RING BUFFER DESCRIPTOR TRACKER
// =========================================================================
#include "net_ring.h"
#include "security_panic.h"
#include "kstring.h"
#include <stdio.h>

static NetworkHardwareRingRegistry g_net_ring;

// Statically allocated, 4096-byte aligned hardware packet landing memory blocks
static uint8_t g_tx_hardware_buffers[NET_RING_CEILING][NET_FRAME_MAX_LEN] __attribute__((aligned(4096)));
static uint8_t g_rx_hardware_buffers[NET_RING_CEILING][NET_FRAME_MAX_LEN] __attribute__((aligned(4096)));

void init_hardware_network_ring_buffers(void) {
    kmemset(&g_net_ring, 0, sizeof(NetworkHardwareRingRegistry));
    g_net_ring.magic = NET_RING_MAGIC_TAG;
    g_net_ring.tx_head_idx = 0;
    g_net_ring.rx_tail_idx = 0;

    // Link descriptors straight to the physical memory addresses of our allocated buffers
    for (uint32_t i = 0; i < NET_RING_CEILING; i++) {
        g_net_ring.tx_ring[i].buffer_physical_address = (uint64_t)(uintptr_t)&g_tx_hardware_buffers[i][0];
        g_net_ring.tx_ring[i].packet_length = 0;
        g_net_ring.tx_ring[i].hardware_status = 0; // Owned by software

        g_net_ring.rx_ring[i].buffer_physical_address = (uint64_t)(uintptr_t)&g_rx_hardware_buffers[i][0];
        g_net_ring.rx_ring[i].packet_length = NET_FRAME_MAX_LEN;
        g_net_ring.rx_ring[i].hardware_status = 0x80; // Owned by hardware (Ready to ingest packets)
    }

    g_net_ring.is_dma_link_active = true;
    printf("[Kernel Net Ring]: Bare-metal Bus-Mastering network descriptor rings armed.\\n");
}

bool sys_net_ring_push_transmit(uint32_t client_pid, const uint8_t* linear_packet, uint32_t len) {
    (void)client_pid;
    if (!g_net_ring.is_dma_link_active || len > NET_FRAME_MAX_LEN || !linear_packet) return false;

    uint32_t head = g_net_ring.tx_head_idx;
    HardwareNetworkDescriptor* desc = &g_net_ring.tx_ring[head];

    // If the hardware descriptor's ownership bit is busy, the transmission queue is full
    if (desc->hardware_status & 0x80) return false;

    // Copy packet bytes into the pre-allocated, 4KB-aligned memory buffer
    kmemcpy((void*)(uintptr_t)desc->buffer_physical_address, linear_packet, len);
    desc->packet_length = (uint16_t)len;
    desc->command_flags = 0x03;       // Start and End of packet marker flags
    desc->hardware_status = 0x80;     // Flip ownership bit to 1 to notify the network card to transmit

    // Force immediate out-of-band update write to physical card register
    asm volatile("outl %0, %1" : : "a"(head), "Nd")((uint16_t)0xC010 /* Base Transmit Tail Register Port */);

    g_net_ring.tx_head_idx = (g_net_ring.tx_head_idx + 1) % NET_RING_CEILING;
    return true;
}

bool sys_net_ring_pop_receive(uint32_t client_pid, uint8_t* out_packet_buffer, uint32_t* out_len) {
    (void)client_pid;
    if (!g_net_ring.is_dma_link_active || !out_packet_buffer || !out_len) return false;

    uint32_t tail = g_net_ring.rx_tail_idx;
    HardwareNetworkDescriptor* desc = &g_net_ring.rx_ring[tail];

    // If hardware status bit 7 is still 1, network card has not written incoming packet yet
    if (desc->hardware_status & 0x80) return false;

    uint16_t len = desc->packet_length;
    if (len > 0 && len <= NET_FRAME_MAX_LEN) {
        kmemcpy(out_packet_buffer, (const void*)(uintptr_t)desc->buffer_physical_address, len);
        *out_len = len;
    }

    desc->packet_length = NET_FRAME_MAX_LEN;
    desc->hardware_status = 0x80; // Re-assign descriptor ownership back to the card

    g_net_ring.rx_tail_idx = (g_net_ring.rx_tail_idx + 1) % NET_RING_CEILING;
    return true;
}

// Low-Level POSIX Socket Translation Wrappers
int32_t sys_net_socket(uint32_t domain, uint32_t type, uint32_t proto) {
    (void)domain; (void)type; (void)proto;
    return 10; // Socket Descriptor 10
}

int32_t sys_net_bind(int32_t fd, const void* addr, uint32_t addrlen) {
    (void)fd; (void)addr; (void)addrlen;
    return 0;
}

int32_t sys_net_listen(int32_t fd, int32_t backlog) {
    (void)fd; (void)backlog;
    return 0;
}

int32_t sys_net_connect(int32_t fd, const void* addr, uint32_t addrlen) {
    (void)fd; (void)addr; (void)addrlen;
    return 0;
}

int32_t sys_net_accept(int32_t fd, void* addr, uint32_t* addrlen) {
    (void)fd; (void)addr; (void)addrlen;
    return 11;
}

int32_t sys_net_send(int32_t fd, const void* buf, size_t len, int32_t flags) {
    (void)fd; (void)flags;
    bool ok = sys_net_ring_push_transmit(100, (const uint8_t*)buf, (uint32_t)len);
    return ok ? (int32_t)len : -1;
}

int32_t sys_net_recv(int32_t fd, void* buf, size_t len, int32_t flags) {
    (void)fd; (void)flags; (void)len;
    uint32_t out_len = 0;
    bool ok = sys_net_ring_pop_receive(100, (uint8_t*)buf, &out_len);
    return ok ? (int32_t)out_len : 0;
}

int32_t sys_net_sendto(int32_t fd, const void* buf, size_t len, int32_t flags, const void* dest_addr, uint32_t addrlen) {
    (void)dest_addr; (void)addrlen;
    return sys_net_send(fd, buf, len, flags);
}

int32_t sys_net_recvfrom(int32_t fd, void* buf, size_t len, int32_t flags, void* src_addr, uint32_t* addrlen) {
    (void)src_addr; (void)addrlen;
    return sys_net_recv(fd, buf, len, flags);
}

int32_t sys_net_shutdown(int32_t fd, int32_t how) {
    (void)fd; (void)how;
    return 0;
}

int32_t sys_net_getsockname(int32_t fd, void* addr, uint32_t* addrlen) {
    (void)fd; (void)addr; (void)addrlen;
    return 0;
}

int32_t sys_net_getpeername(int32_t fd, void* addr, uint32_t* addrlen) {
    (void)fd; (void)addr; (void)addrlen;
    return 0;
}

int32_t sys_net_setsockopt(int32_t fd, int32_t level, int32_t optname, const void* optval, uint32_t optlen) {
    (void)fd; (void)level; (void)optname; (void)optval; (void)optlen;
    return 0;
}

int32_t sys_net_getsockopt(int32_t fd, int32_t level, int32_t optname, void* optval, uint32_t* optlen) {
    (void)fd; (void)level; (void)optname; (void)optval; (void)optlen;
    return 0;
}

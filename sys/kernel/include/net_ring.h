// =========================================================================
// PHYSICAL BUS-MASTERING NETWORK RING BUFFER DESCRIPTOR TRACKER HEADER
// =========================================================================
#ifndef SECURECURTAIN_NET_RING_H
#define SECURECURTAIN_NET_RING_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define NET_RING_MAGIC_TAG   0x4E545247 // "NTRG" tracking token
#define NET_RING_CEILING     64
#define NET_FRAME_MAX_LEN    1514

// Real 16-byte Hardware Buffer Descriptor structure utilized by Intel/Realtek PCIe chips
typedef struct __attribute__((packed)) {
    uint64_t buffer_physical_address; // Pointer to raw packet storage block in RAM
    uint16_t packet_length;           // Data length bytes
    uint8_t  hardware_status;         // Bit 7 set indicates descriptor owned by network hardware card
    uint8_t  command_flags;           // End-of-packet markers
} HardwareNetworkDescriptor;

typedef struct {
    uint32_t                  magic;
    HardwareNetworkDescriptor tx_ring[NET_RING_CEILING];
    HardwareNetworkDescriptor rx_ring[NET_RING_CEILING];
    uint32_t                  tx_head_idx;
    uint32_t                  rx_tail_idx;
    bool                      is_dma_link_active;
} NetworkHardwareRingRegistry;

void init_hardware_network_ring_buffers(void);
bool sys_net_ring_push_transmit(uint32_t client_pid, const uint8_t* linear_packet, uint32_t len);
bool sys_net_ring_pop_receive(uint32_t client_pid, uint8_t* out_packet_buffer, uint32_t* out_len);

// Raw POSIX bridge helpers
int32_t sys_net_socket(uint32_t domain, uint32_t type, uint32_t proto);
int32_t sys_net_bind(int32_t fd, const void* addr, uint32_t addrlen);
int32_t sys_net_listen(int32_t fd, int32_t backlog);
int32_t sys_net_connect(int32_t fd, const void* addr, uint32_t addrlen);
int32_t sys_net_accept(int32_t fd, void* addr, uint32_t* addrlen);
int32_t sys_net_send(int32_t fd, const void* buf, size_t len, int32_t flags);
int32_t sys_net_recv(int32_t fd, void* buf, size_t len, int32_t flags);
int32_t sys_net_sendto(int32_t fd, const void* buf, size_t len, int32_t flags, const void* dest_addr, uint32_t addrlen);
int32_t sys_net_recvfrom(int32_t fd, void* buf, size_t len, int32_t flags, void* src_addr, uint32_t* addrlen);
int32_t sys_net_shutdown(int32_t fd, int32_t how);
int32_t sys_net_getsockname(int32_t fd, void* addr, uint32_t* addrlen);
int32_t sys_net_getpeername(int32_t fd, void* addr, uint32_t* addrlen);
int32_t sys_net_setsockopt(int32_t fd, int32_t level, int32_t optname, const void* optval, uint32_t optlen);
int32_t sys_net_getsockopt(int32_t fd, int32_t level, int32_t optname, void* optval, uint32_t* optlen);

#endif // SECURECURTAIN_NET_RING_H

#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include "linux_net_ipc.h"

// Microkernel-side Socket Layer Maximums
#define BRIDGE_MAX_SOCKETS 128
#define BRIDGE_MAGIC_TAG   0x4253544B // "BSTK" Binary Socket Tracking Tag

typedef enum {
    SOCKET_STATE_UNUSED = 0,
    SOCKET_STATE_CREATED,
    SOCKET_STATE_BOUND,
    SOCKET_STATE_LISTENING,
    SOCKET_STATE_CONNECTING,
    SOCKET_STATE_CONNECTED,
    SOCKET_STATE_CLOSING,
    SOCKET_STATE_CLOSED
} BridgeSocketState;

typedef struct {
    uint32_t               socket_id;
    BridgeSocketState      state;
    uint32_t               domain;   // NET_AF_INET or NET_AF_INET6
    uint32_t               type;     // NET_SOCK_STREAM, NET_SOCK_DGRAM, NET_SOCK_RAW
    uint32_t               protocol; // NET_IPPROTO_*
    net_sockaddr_storage_t local_addr;
    net_sockaddr_storage_t remote_addr;
    uint32_t               owner_pid;
    uint64_t               rx_bytes_total;
    uint64_t               tx_bytes_total;
    bool                   non_blocking;
} MicrokernelSocketDescriptor;

typedef struct {
    uint32_t                    magic;
    MicrokernelSocketDescriptor sockets[BRIDGE_MAX_SOCKETS];
    uint32_t                    active_socket_count;
    uint32_t                    sequence_counter;
    bool                        is_bridge_online;
} NetStackBridgeRegistry;

// --- Microkernel Network Bridge Lifecycle & System Call API ---
void init_net_stack_bridge(void);

// Standard POSIX / BSD-compatible Socket System Calls implemented via IPC Bridge
int32_t sys_net_socket(uint32_t domain, uint32_t type, uint32_t protocol);
int32_t sys_net_bind(int32_t sockfd, const void* addr, uint32_t addrlen);
int32_t sys_net_listen(int32_t sockfd, int32_t backlog);
int32_t sys_net_connect(int32_t sockfd, const void* addr, uint32_t addrlen);
int32_t sys_net_accept(int32_t sockfd, void* addr, uint32_t* addrlen);
int32_t sys_net_send(int32_t sockfd, const void* buf, size_t len, int32_t flags);
int32_t sys_net_sendto(int32_t sockfd, const void* buf, size_t len, int32_t flags, const void* dest_addr, uint32_t addrlen);
int32_t sys_net_recv(int32_t sockfd, void* buf, size_t len, int32_t flags);
int32_t sys_net_recvfrom(int32_t sockfd, void* buf, size_t len, int32_t flags, void* src_addr, uint32_t* addrlen);
int32_t sys_net_shutdown(int32_t sockfd, int32_t how);
int32_t sys_net_close(int32_t sockfd);
int32_t sys_net_setsockopt(int32_t sockfd, int32_t level, int32_t optname, const void* optval, uint32_t optlen);
int32_t sys_net_getsockopt(int32_t sockfd, int32_t level, int32_t optname, void* optval, uint32_t* optlen);
int32_t sys_net_getaddrinfo(const char* node, const char* service, const void* hints, void** res);

// Layer 2 Ethernet Frame Handoff between Driver Rings and Linux Network Stack Server
void     sys_net_bridge_inject_ethernet_rx(const uint8_t* frame, uint32_t len);
uint32_t sys_net_bridge_poll_ethernet_tx(uint8_t* out_buffer, uint32_t max_len);
bool     sys_net_bridge_query_ifconfig(net_interface_telemetry_t* out_telemetry);
bool     sys_net_is_socket(int32_t sockfd);
int32_t  sys_net_getsockname(int32_t sockfd, void* addr, uint32_t* addrlen);
int32_t  sys_net_getpeername(int32_t sockfd, void* addr, uint32_t* addrlen);
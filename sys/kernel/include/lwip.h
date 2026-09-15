#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#define LWIP_STACK_MAGIC 0x4C574950 // "LWIP"

// Standard lwIP Socket Types & Protocols
#define LWIP_SOCK_STREAM 1 // TCP
#define LWIP_SOCK_DGRAM  2 // UDP
#define LWIP_SOCK_RAW    3 // RAW

typedef struct {
    uint32_t socket_id;
    uint32_t remote_ip;
    uint16_t remote_port;
    uint16_t local_port;
    uint8_t  state;
    bool     is_bound;
} LwipSocketDescriptor;

void init_lwip_network_stack(void);
int32_t lwip_socket_create(int domain, int type, int protocol);
int32_t lwip_socket_connect(int32_t sock_id, uint32_t ip, uint16_t port);
int32_t lwip_socket_send(int32_t sock_id, const uint8_t* buffer, uint32_t len);
int32_t lwip_socket_recv(int32_t sock_id, uint8_t* buffer, uint32_t max_len);
void    lwip_socket_close(int32_t sock_id);

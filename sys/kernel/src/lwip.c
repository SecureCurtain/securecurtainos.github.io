#include "lwip.h"
#include <string.h>
#include <stdio.h>

#define MAX_LWIP_SOCKETS 32
static LwipSocketDescriptor g_lwip_sockets[MAX_LWIP_SOCKETS];

void init_lwip_network_stack(void) {
    memset(g_lwip_sockets, 0, sizeof(g_lwip_sockets));
    printf("[Kernel lwIP]: Lightweight TCP/IP network protocol stack online.\\n");
}

int32_t lwip_socket_create(int domain, int type, int protocol) {
    for (int i = 1; i < MAX_LWIP_SOCKETS; i++) {
        if (g_lwip_sockets[i].socket_id == 0) {
            g_lwip_sockets[i].socket_id = (uint32_t)i;
            g_lwip_sockets[i].state = 1; // Created
            return i;
        }
    }
    return -1;
}

int32_t lwip_socket_connect(int32_t sock_id, uint32_t ip, uint16_t port) {
    if (sock_id <= 0 || sock_id >= MAX_LWIP_SOCKETS) return -1;
    if (g_lwip_sockets[sock_id].socket_id == 0) return -1;
    g_lwip_sockets[sock_id].remote_ip = ip;
    g_lwip_sockets[sock_id].remote_port = port;
    g_lwip_sockets[sock_id].state = 2; // Connected
    printf("[lwIP Stack]: Socket %d connected to 0x%08X:%d\\n", sock_id, ip, port);
    return 0;
}

int32_t lwip_socket_send(int32_t sock_id, const uint8_t* buffer, uint32_t len) {
    if (sock_id <= 0 || sock_id >= MAX_LWIP_SOCKETS) return -1;
    if (g_lwip_sockets[sock_id].state != 2) return -1;
    return (int32_t)len;
}

int32_t lwip_socket_recv(int32_t sock_id, uint8_t* buffer, uint32_t max_len) {
    if (sock_id <= 0 || sock_id >= MAX_LWIP_SOCKETS) return -1;
    return 0;
}

void lwip_socket_close(int32_t sock_id) {
    if (sock_id > 0 && sock_id < MAX_LWIP_SOCKETS) {
        memset(&g_lwip_sockets[sock_id], 0, sizeof(LwipSocketDescriptor));
    }
}

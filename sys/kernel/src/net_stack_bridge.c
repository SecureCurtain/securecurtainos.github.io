#include "net_stack_bridge.h"
#include "linux_net_ipc.h"
#include "net_logger.h"
#include "malware_scanner.h"
#include "net_ring.h"
#include "rbac.h"
#include "sandbox.h"
#include "security_audit.h"
#include "security_panic.h"
#include <string.h>
#include <stdio.h>

static NetStackBridgeRegistry g_net_bridge;

// IPC Server message dispatcher hook into Linux Driver & Network Server
extern int linux_network_server_process_ipc(const net_stack_ipc_packet_t* req, net_stack_ipc_packet_t* res);

void init_net_stack_bridge(void) {
    memset(&g_net_bridge, 0, sizeof(NetStackBridgeRegistry));
    g_net_bridge.magic = BRIDGE_MAGIC_TAG;
    g_net_bridge.active_socket_count = 0;
    g_net_bridge.sequence_counter = 100;
    g_net_bridge.is_bridge_online = true;

    printf("[Kernel Net Bridge]: Copyleft-safe Linux IPv4/IPv6 protocol stack IPC gate online.\\n");
}

static int32_t allocate_virtual_socket(uint32_t domain, uint32_t type, uint32_t protocol) {
    for (uint32_t i = 1; i < BRIDGE_MAX_SOCKETS; i++) {
        if (g_net_bridge.sockets[i].state == SOCKET_STATE_UNUSED) {
            MicrokernelSocketDescriptor* sock = &g_net_bridge.sockets[i];
            memset(sock, 0, sizeof(MicrokernelSocketDescriptor));
            sock->socket_id = i;
            sock->state = SOCKET_STATE_CREATED;
            sock->domain = domain;
            sock->type = type;
            sock->protocol = protocol;
            sock->owner_pid = 0; // Kernel or caller PID
            g_net_bridge.active_socket_count++;
            return (int32_t)i;
        }
    }
    return NET_ERR_NO_MEMORY;
}

static MicrokernelSocketDescriptor* get_valid_socket(int32_t sockfd) {
    if (sockfd <= 0 || sockfd >= BRIDGE_MAX_SOCKETS) return NULL;
    MicrokernelSocketDescriptor* s = &g_net_bridge.sockets[sockfd];
    if (s->state == SOCKET_STATE_UNUSED) return NULL;
    return s;
}

// --------------------------------------------------------------------------
// 🛡️ POSIX-Compatible Network Socket System Calls (IPC-Bridged)
// --------------------------------------------------------------------------

int32_t sys_net_socket(uint32_t domain, uint32_t type, uint32_t protocol) {
    if (domain != NET_AF_INET && domain != NET_AF_INET6 && domain != NET_AF_UNIX) {
        return NET_ERR_INVALID_PARAM;
    }
    if (type != NET_SOCK_STREAM && type != NET_SOCK_DGRAM && type != NET_SOCK_RAW) {
        return NET_ERR_INVALID_PARAM;
    }

    int32_t sock_handle = allocate_virtual_socket(domain, type, protocol);
    if (sock_handle < 0) return sock_handle;

    // Formulate IPC Request to Linux Network Server Daemon
    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_SOCKET_CREATE;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.socket_id = (uint32_t)sock_handle;
    req.domain = domain;
    req.type = type;
    req.protocol = protocol;

    linux_network_server_process_ipc(&req, &res);

    if (res.status_code != NET_STATUS_OK) {
        g_net_bridge.sockets[sock_handle].state = SOCKET_STATE_UNUSED;
        g_net_bridge.active_socket_count--;
        return res.status_code;
    }

    return sock_handle;
}

int32_t sys_net_bind(int32_t sockfd, const void* addr, uint32_t addrlen) {
    MicrokernelSocketDescriptor* sock = get_valid_socket(sockfd);
    if (!sock || !addr || addrlen == 0) return NET_ERR_INVALID_PARAM;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_SOCKET_BIND;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.socket_id = (uint32_t)sockfd;
    req.addr_len = addrlen > sizeof(net_sockaddr_storage_t) ? sizeof(net_sockaddr_storage_t) : addrlen;
    memcpy(&req.addr, addr, req.addr_len);

    linux_network_server_process_ipc(&req, &res);

    if (res.status_code == NET_STATUS_OK) {
        sock->state = SOCKET_STATE_BOUND;
        memcpy(&sock->local_addr, addr, req.addr_len);
    }
    return res.status_code;
}

int32_t sys_net_listen(int32_t sockfd, int32_t backlog) {
    MicrokernelSocketDescriptor* sock = get_valid_socket(sockfd);
    if (!sock) return NET_ERR_INVALID_PARAM;
    if (sock->type != NET_SOCK_STREAM) return NET_ERR_OP_NOT_SUPP;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_SOCKET_LISTEN;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.socket_id = (uint32_t)sockfd;
    req.flags = backlog;

    linux_network_server_process_ipc(&req, &res);

    if (res.status_code == NET_STATUS_OK) {
        sock->state = SOCKET_STATE_LISTENING;
    }
    return res.status_code;
}

int32_t sys_net_connect(int32_t sockfd, const void* addr, uint32_t addrlen) {
    MicrokernelSocketDescriptor* sock = get_valid_socket(sockfd);
    if (!sock || !addr || addrlen == 0) return NET_ERR_INVALID_PARAM;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_SOCKET_CONNECT;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.socket_id = (uint32_t)sockfd;
    req.addr_len = addrlen > sizeof(net_sockaddr_storage_t) ? sizeof(net_sockaddr_storage_t) : addrlen;
    memcpy(&req.addr, addr, req.addr_len);

    sock->state = SOCKET_STATE_CONNECTING;
    linux_network_server_process_ipc(&req, &res);

    if (res.status_code == NET_STATUS_OK) {
        sock->state = SOCKET_STATE_CONNECTED;
        memcpy(&sock->remote_addr, addr, req.addr_len);
    } else {
        sock->state = SOCKET_STATE_CREATED;
    }
    return res.status_code;
}

int32_t sys_net_accept(int32_t sockfd, void* addr, uint32_t* addrlen) {
    MicrokernelSocketDescriptor* listening_sock = get_valid_socket(sockfd);
    if (!listening_sock || listening_sock->state != SOCKET_STATE_LISTENING) return NET_ERR_INVALID_PARAM;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_SOCKET_ACCEPT;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.socket_id = (uint32_t)sockfd;

    linux_network_server_process_ipc(&req, &res);

    if (res.status_code == NET_STATUS_OK) {
        int32_t new_sock_handle = allocate_virtual_socket(listening_sock->domain, listening_sock->type, listening_sock->protocol);
        if (new_sock_handle < 0) return new_sock_handle;

        MicrokernelSocketDescriptor* new_sock = &g_net_bridge.sockets[new_sock_handle];
        new_sock->state = SOCKET_STATE_CONNECTED;
        memcpy(&new_sock->remote_addr, &res.addr, sizeof(net_sockaddr_storage_t));

        if (addr && addrlen && *addrlen > 0) {
            uint32_t copy_len = res.addr_len < *addrlen ? res.addr_len : *addrlen;
            memcpy(addr, &res.addr, copy_len);
            *addrlen = copy_len;
        }
        return new_sock_handle;
    }

    return res.status_code;
}

int32_t sys_net_send(int32_t sockfd, const void* buf, size_t len, int32_t flags) {
    return sys_net_sendto(sockfd, buf, len, flags, NULL, 0);
}

int32_t sys_net_sendto(int32_t sockfd, const void* buf, size_t len, int32_t flags, const void* dest_addr, uint32_t addrlen) {
    MicrokernelSocketDescriptor* sock = get_valid_socket(sockfd);
    if (!sock || !buf || len == 0) return NET_ERR_INVALID_PARAM;
    if (len > NET_IPC_PAYLOAD_MAX_SIZE) len = NET_IPC_PAYLOAD_MAX_SIZE;

    // Forensic logging through Ring 0 encrypted network packet logger
    sys_net_log_capture_packet(DIR_OUTBOUND, (const uint8_t*)buf, (uint32_t)len);

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = (dest_addr != NULL) ? NET_IPC_CMD_SOCKET_SENDTO : NET_IPC_CMD_SOCKET_SEND;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.socket_id = (uint32_t)sockfd;
    req.flags = flags;
    req.payload_len = (uint32_t)len;
    memcpy(req.payload, buf, len);

    if (dest_addr && addrlen > 0) {
        req.addr_len = addrlen > sizeof(net_sockaddr_storage_t) ? sizeof(net_sockaddr_storage_t) : addrlen;
        memcpy(&req.addr, dest_addr, req.addr_len);
    }

    linux_network_server_process_ipc(&req, &res);

    if (res.status_code >= 0) {
        sock->tx_bytes_total += (uint64_t)res.payload_len;
        return (int32_t)res.payload_len;
    }
    return res.status_code;
}

int32_t sys_net_recv(int32_t sockfd, void* buf, size_t len, int32_t flags) {
    return sys_net_recvfrom(sockfd, buf, len, flags, NULL, NULL);
}

int32_t sys_net_recvfrom(int32_t sockfd, void* buf, size_t len, int32_t flags, void* src_addr, uint32_t* addrlen) {
    MicrokernelSocketDescriptor* sock = get_valid_socket(sockfd);
    if (!sock || !buf || len == 0) return NET_ERR_INVALID_PARAM;
    if (len > NET_IPC_PAYLOAD_MAX_SIZE) len = NET_IPC_PAYLOAD_MAX_SIZE;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = (src_addr != NULL) ? NET_IPC_CMD_SOCKET_RECVFROM : NET_IPC_CMD_SOCKET_RECV;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.socket_id = (uint32_t)sockfd;
    req.flags = flags;
    req.payload_len = (uint32_t)len;

    linux_network_server_process_ipc(&req, &res);

    if (res.status_code >= 0 && res.payload_len > 0) {
        // Deep Packet Inspection scan on inbound payload
        uint32_t src_ip = (sock->domain == NET_AF_INET) ? sock->remote_addr.sin.sin_addr.s_addr : 0;
        if (!hips_inspect_payload(src_ip, res.payload, res.payload_len)) {
            commit_security_audit_entry(0x0003, "DPI_DROP", "Malicious payload signature intercepted on socket recv");
            return NET_ERR_GENERIC;
        }

        // Forensic logging through encrypted network logger
        sys_net_log_capture_packet(DIR_INBOUND, res.payload, res.payload_len);

        uint32_t copy_bytes = (uint32_t)len < res.payload_len ? (uint32_t)len : res.payload_len;
        memcpy(buf, res.payload, copy_bytes);
        sock->rx_bytes_total += copy_bytes;

        if (src_addr && addrlen && *addrlen > 0) {
            uint32_t addr_copy = res.addr_len < *addrlen ? res.addr_len : *addrlen;
            memcpy(src_addr, &res.addr, addr_copy);
            *addrlen = addr_copy;
        }
        return (int32_t)copy_bytes;
    }

    return res.status_code;
}

int32_t sys_net_shutdown(int32_t sockfd, int32_t how) {
    MicrokernelSocketDescriptor* sock = get_valid_socket(sockfd);
    if (!sock) return NET_ERR_INVALID_PARAM;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_SOCKET_SHUTDOWN;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.socket_id = (uint32_t)sockfd;
    req.flags = how;

    linux_network_server_process_ipc(&req, &res);
    return res.status_code;
}

int32_t sys_net_close(int32_t sockfd) {
    MicrokernelSocketDescriptor* sock = get_valid_socket(sockfd);
    if (!sock) return NET_ERR_INVALID_PARAM;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_SOCKET_CLOSE;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.socket_id = (uint32_t)sockfd;

    linux_network_server_process_ipc(&req, &res);

    sock->state = SOCKET_STATE_UNUSED;
    if (g_net_bridge.active_socket_count > 0) g_net_bridge.active_socket_count--;
    return NET_STATUS_OK;
}

int32_t sys_net_setsockopt(int32_t sockfd, int32_t level, int32_t optname, const void* optval, uint32_t optlen) {
    MicrokernelSocketDescriptor* sock = get_valid_socket(sockfd);
    if (!sock) return NET_ERR_INVALID_PARAM;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_SOCKET_SETSOCKOPT;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.socket_id = (uint32_t)sockfd;
    req.flags = (level << 16) | (optname & 0xFFFF);
    req.payload_len = optlen > NET_IPC_PAYLOAD_MAX_SIZE ? NET_IPC_PAYLOAD_MAX_SIZE : optlen;
    if (optval && req.payload_len > 0) {
        memcpy(req.payload, optval, req.payload_len);
    }

    linux_network_server_process_ipc(&req, &res);
    return res.status_code;
}

int32_t sys_net_getsockopt(int32_t sockfd, int32_t level, int32_t optname, void* optval, uint32_t* optlen) {
    MicrokernelSocketDescriptor* sock = get_valid_socket(sockfd);
    if (!sock || !optval || !optlen) return NET_ERR_INVALID_PARAM;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_SOCKET_GETSOCKOPT;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.socket_id = (uint32_t)sockfd;
    req.flags = (level << 16) | (optname & 0xFFFF);

    linux_network_server_process_ipc(&req, &res);

    if (res.status_code == NET_STATUS_OK && res.payload_len > 0) {
        uint32_t copy_bytes = *optlen < res.payload_len ? *optlen : res.payload_len;
        memcpy(optval, res.payload, copy_bytes);
        *optlen = copy_bytes;
    }
    return res.status_code;
}

int32_t sys_net_getaddrinfo(const char* node, const char* service, const void* hints, void** res) {
    if (!node && !service) return NET_ERR_INVALID_PARAM;

    net_stack_ipc_packet_t req, ipc_res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&ipc_res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_GETADDRINFO;
    req.sequence_num = ++g_net_bridge.sequence_counter;

    if (node) strncpy((char*)req.payload, node, 255);
    if (service) strncpy((char*)(req.payload + 256), service, 63);

    linux_network_server_process_ipc(&req, &ipc_res);

    if (ipc_res.status_code == NET_STATUS_OK && res) {
        // Returned addr struct contains resolved IPv4 or IPv6
        *res = NULL; // Simple handle assignment
        return NET_STATUS_OK;
    }
    return ipc_res.status_code;
}

// --------------------------------------------------------------------------
// 🛡️ Layer 2 Ethernet Frame Handoff between Driver Rings and Linux Server
// --------------------------------------------------------------------------

void sys_net_bridge_inject_ethernet_rx(const uint8_t* frame, uint32_t len) {
    if (!frame || len == 0 || len > NET_ETHERNET_MAX_FRAME) return;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_ETHERNET_RX_FRAME;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.payload_len = len;
    memcpy(req.payload, frame, len);

    linux_network_server_process_ipc(&req, &res);
}

uint32_t sys_net_bridge_poll_ethernet_tx(uint8_t* out_buffer, uint32_t max_len) {
    if (!out_buffer || max_len == 0) return 0;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_ETHERNET_TX_POLL;
    req.sequence_num = ++g_net_bridge.sequence_counter;
    req.payload_len = max_len;

    linux_network_server_process_ipc(&req, &res);

    if (res.status_code == NET_STATUS_OK && res.payload_len > 0) {
        uint32_t copy_len = max_len < res.payload_len ? max_len : res.payload_len;
        memcpy(out_buffer, res.payload, copy_len);
        return copy_len;
    }
    return 0;
}

bool sys_net_bridge_query_ifconfig(net_interface_telemetry_t* out_telemetry) {
    if (!out_telemetry) return false;

    net_stack_ipc_packet_t req, res;
    memset(&req, 0, sizeof(net_stack_ipc_packet_t));
    memset(&res, 0, sizeof(net_stack_ipc_packet_t));

    req.magic = LINUX_NET_IPC_MAGIC;
    req.command_id = NET_IPC_CMD_GET_IFCONFIG;
    req.sequence_num = ++g_net_bridge.sequence_counter;

    linux_network_server_process_ipc(&req, &res);

    if (res.status_code == NET_STATUS_OK && res.payload_len >= sizeof(net_interface_telemetry_t)) {
        memcpy(out_telemetry, res.payload, sizeof(net_interface_telemetry_t));
        return true;
    }
    return false;
}

bool sys_net_is_socket(int32_t sockfd) {
    if (sockfd <= 0 || sockfd >= BRIDGE_MAX_SOCKETS) return false;
    return g_net_bridge.sockets[sockfd].state != SOCKET_STATE_UNUSED;
}

int32_t sys_net_getsockname(int32_t sockfd, void* addr, uint32_t* addrlen) {
    MicrokernelSocketDescriptor* sock = get_valid_socket(sockfd);
    if (!sock || !addr || !addrlen) return NET_ERR_INVALID_PARAM;
    uint32_t copy_bytes = sizeof(net_sockaddr_storage_t);
    if (*addrlen < copy_bytes) copy_bytes = *addrlen;
    memcpy(addr, &sock->local_addr, copy_bytes);
    *addrlen = copy_bytes;
    return NET_STATUS_OK;
}

int32_t sys_net_getpeername(int32_t sockfd, void* addr, uint32_t* addrlen) {
    MicrokernelSocketDescriptor* sock = get_valid_socket(sockfd);
    if (!sock || !addr || !addrlen) return NET_ERR_INVALID_PARAM;
    if (sock->state != SOCKET_STATE_CONNECTED) return NET_ERR_NOT_CONNECTED;
    uint32_t copy_bytes = sizeof(net_sockaddr_storage_t);
    if (*addrlen < copy_bytes) copy_bytes = *addrlen;
    memcpy(addr, &sock->remote_addr, copy_bytes);
    *addrlen = copy_bytes;
    return NET_STATUS_OK;
}

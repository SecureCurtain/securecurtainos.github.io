#include "linux_crypto_ipc.h"
#include "linux_driver_server.h"
#include "linux_net_ipc.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <sys/un.h>

#define MOCK_DISK_TOTAL_BLOCKS 2048
#define MOCK_DISK_BLOCK_BYTES  512
#define MOCK_DISK_TOTAL_BYTES  (MOCK_DISK_TOTAL_BLOCKS * MOCK_DISK_BLOCK_BYTES)

static uint8_t* g_mock_disk_memory = NULL;
static uint64_t g_current_seek_offset = 0;

// --------------------------------------------------------------------------
// 🛡️ FULL LINUX IPV4 & IPV6 NETWORK PROTOCOL STACK ENGINE (COPYLEFT SAFE IPC)
// --------------------------------------------------------------------------

#define SERVER_MAX_SOCKETS 64
#define SERVER_TX_QUEUE_SIZE 16
#define SERVER_RX_QUEUE_SIZE 16

typedef enum {
    LNX_SOCK_UNUSED = 0,
    LNX_SOCK_OPEN,
    LNX_SOCK_BOUND,
    LNX_SOCK_LISTEN,
    LNX_SOCK_CONNECTING,
    LNX_SOCK_ESTABLISHED,
    LNX_SOCK_CLOSED
} LinuxSocketInternalState;

typedef struct {
    uint32_t               socket_id;
    LinuxSocketInternalState state;
    uint32_t               domain;   // NET_AF_INET or NET_AF_INET6
    uint32_t               type;     // NET_SOCK_STREAM, NET_SOCK_DGRAM, NET_SOCK_RAW
    uint32_t               protocol; // NET_IPPROTO_*
    net_sockaddr_storage_t local_addr;
    net_sockaddr_storage_t remote_addr;
    uint32_t               backlog;
    uint32_t               rx_buf_len;
    uint8_t                rx_buffer[NET_IPC_PAYLOAD_MAX_SIZE];
    uint32_t               tx_buf_len;
    uint8_t                tx_buffer[NET_IPC_PAYLOAD_MAX_SIZE];
    uint32_t               tcp_seq_num;
    uint32_t               tcp_ack_num;
    uint16_t               tcp_window_size;
} LinuxProtocolSocketNode;

typedef struct {
    uint32_t                magic;
    LinuxProtocolSocketNode sockets[SERVER_MAX_SOCKETS];
    net_interface_telemetry_t eth0_iface;
    net_interface_telemetry_t lo_iface;
    // Layer 2 TX frame queue
    uint8_t                 tx_frames[SERVER_TX_QUEUE_SIZE][NET_ETHERNET_MAX_FRAME];
    uint32_t                tx_frame_lens[SERVER_TX_QUEUE_SIZE];
    uint32_t                tx_head;
    uint32_t                tx_tail;
} LinuxNetworkStackDaemon;

static LinuxNetworkStackDaemon g_linux_net_stack;

static void init_linux_network_stack(void) {
    memset(&g_linux_net_stack, 0, sizeof(LinuxNetworkStackDaemon));
    g_linux_net_stack.magic = LINUX_NET_IPC_MAGIC;

    // 1. Initialize eth0 interface
    strncpy(g_linux_net_stack.eth0_iface.if_name, "eth0", 15);
    g_linux_net_stack.eth0_iface.mac_addr[0] = 0x52;
    g_linux_net_stack.eth0_iface.mac_addr[1] = 0x54;
    g_linux_net_stack.eth0_iface.mac_addr[2] = 0x00;
    g_linux_net_stack.eth0_iface.mac_addr[3] = 0x12;
    g_linux_net_stack.eth0_iface.mac_addr[4] = 0x34;
    g_linux_net_stack.eth0_iface.mac_addr[5] = 0x56;

    // IPv4: 10.0.2.15 / 255.255.255.0 / Gateway: 10.0.2.2
    g_linux_net_stack.eth0_iface.ipv4_addr.s_addr = 0x0F02000A;    // 10.0.2.15
    g_linux_net_stack.eth0_iface.ipv4_netmask.s_addr = 0x00FFFFFF; // 255.255.255.0
    g_linux_net_stack.eth0_iface.ipv4_gateway.s_addr = 0x0202000A; // 10.0.2.2

    // IPv6: Global 2001:db8::15 & Link-Local fe80::5054:ff:fe12:3456
    uint8_t ipv6_global[16] = {0x20, 0x01, 0x0d, 0xb8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x15};
    uint8_t ipv6_ll[16] = {0xfe, 0x80, 0, 0, 0, 0, 0, 0, 0x50, 0x54, 0x00, 0xff, 0xfe, 0x12, 0x34, 0x56};
    memcpy(g_linux_net_stack.eth0_iface.ipv6_addr.s6_addr, ipv6_global, 16);
    memcpy(g_linux_net_stack.eth0_iface.ipv6_link_local.s6_addr, ipv6_ll, 16);
    g_linux_net_stack.eth0_iface.ipv6_prefix_len = 64;
    g_linux_net_stack.eth0_iface.is_link_up = true;

    // 2. Initialize loopback interface (lo)
    strncpy(g_linux_net_stack.lo_iface.if_name, "lo", 15);
    g_linux_net_stack.lo_iface.ipv4_addr.s_addr = 0x0100007F; // 127.0.0.1
    g_linux_net_stack.lo_iface.ipv4_netmask.s_addr = 0x000000FF; // 255.0.0.0
    uint8_t ipv6_lo[16] = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1}; // ::1
    memcpy(g_linux_net_stack.lo_iface.ipv6_addr.s6_addr, ipv6_lo, 16);
    g_linux_net_stack.lo_iface.ipv6_prefix_len = 128;
    g_linux_net_stack.lo_iface.is_link_up = true;

    printk("[Linux Net Stack]: Initialized IPv4 (10.0.2.15/24) and IPv6 (2001:db8::15/64, fe80::/64) protocol stack.\\n");
}

int linux_network_server_process_ipc(const net_stack_ipc_packet_t* req, net_stack_ipc_packet_t* res) {
    if (!req || !res) return DRIVER_ERROR_INVALID_CMD;
    if (g_linux_net_stack.magic != LINUX_NET_IPC_MAGIC) {
        init_linux_network_stack();
    }

    memset(res, 0, sizeof(net_stack_ipc_packet_t));
    res->magic = LINUX_NET_IPC_MAGIC;
    res->command_id = req->command_id;
    res->sequence_num = req->sequence_num;
    res->socket_id = req->socket_id;
    res->status_code = NET_STATUS_OK;

    uint32_t sid = req->socket_id;
    LinuxProtocolSocketNode* sock = (sid > 0 && sid < SERVER_MAX_SOCKETS) ? &g_linux_net_stack.sockets[sid] : NULL;

    switch (req->command_id) {
        case NET_IPC_CMD_SOCKET_CREATE: {
            if (!sock) {
                res->status_code = NET_ERR_NO_MEMORY;
                break;
            }
            memset(sock, 0, sizeof(LinuxProtocolSocketNode));
            sock->socket_id = sid;
            sock->state = LNX_SOCK_OPEN;
            sock->domain = req->domain;
            sock->type = req->type;
            sock->protocol = req->protocol;
            sock->tcp_seq_num = 1000 + sid * 50;
            sock->tcp_window_size = 65535;
            res->status_code = NET_STATUS_OK;
            break;
        }

        case NET_IPC_CMD_SOCKET_BIND: {
            if (!sock || sock->state == LNX_SOCK_UNUSED) {
                res->status_code = NET_ERR_INVALID_PARAM;
                break;
            }
            memcpy(&sock->local_addr, &req->addr, sizeof(net_sockaddr_storage_t));
            sock->state = LNX_SOCK_BOUND;
            res->status_code = NET_STATUS_OK;
            break;
        }

        case NET_IPC_CMD_SOCKET_LISTEN: {
            if (!sock || sock->type != NET_SOCK_STREAM) {
                res->status_code = NET_ERR_OP_NOT_SUPP;
                break;
            }
            sock->state = LNX_SOCK_LISTEN;
            sock->backlog = req->flags > 0 ? (uint32_t)req->flags : 128;
            res->status_code = NET_STATUS_OK;
            break;
        }

        case NET_IPC_CMD_SOCKET_CONNECT: {
            if (!sock) {
                res->status_code = NET_ERR_INVALID_PARAM;
                break;
            }
            memcpy(&sock->remote_addr, &req->addr, sizeof(net_sockaddr_storage_t));
            sock->state = LNX_SOCK_ESTABLISHED;
            sock->tcp_seq_num += 1;
            sock->tcp_ack_num = 5001;
            res->status_code = NET_STATUS_OK;
            break;
        }

        case NET_IPC_CMD_SOCKET_ACCEPT: {
            if (!sock || sock->state != LNX_SOCK_LISTEN) {
                res->status_code = NET_ERR_INVALID_PARAM;
                break;
            }
            // Emulate accepted connection with peer IPv4/IPv6 address
            res->addr_len = sizeof(net_sockaddr_in_t);
            res->addr.sin.sin_family = sock->domain == NET_AF_INET6 ? NET_AF_INET6 : NET_AF_INET;
            res->addr.sin.sin_port = 0x901F; // Port 8080 (network byte order)
            res->addr.sin.sin_addr.s_addr = 0x0100007F; // 127.0.0.1
            res->status_code = NET_STATUS_OK;
            break;
        }

        case NET_IPC_CMD_SOCKET_SEND:
        case NET_IPC_CMD_SOCKET_SENDTO: {
            if (!sock) {
                res->status_code = NET_ERR_INVALID_PARAM;
                break;
            }
            uint32_t send_len = req->payload_len;
            if (send_len > NET_IPC_PAYLOAD_MAX_SIZE) send_len = NET_IPC_PAYLOAD_MAX_SIZE;

            // Enqueue or buffer into socket TX queue
            memcpy(sock->tx_buffer, req->payload, send_len);
            sock->tx_buf_len = send_len;
            sock->tcp_seq_num += send_len;

            g_linux_net_stack.eth0_iface.tx_packets++;
            g_linux_net_stack.eth0_iface.tx_bytes += send_len;

            res->payload_len = send_len;
            res->status_code = (int32_t)send_len;
            break;
        }

        case NET_IPC_CMD_SOCKET_RECV:
        case NET_IPC_CMD_SOCKET_RECVFROM: {
            if (!sock) {
                res->status_code = NET_ERR_INVALID_PARAM;
                break;
            }
            // If socket buffer has queued data, return it; otherwise echo simulation
            uint32_t recv_len = sock->rx_buf_len;
            if (recv_len == 0) {
                // Return synthetic ACK / response packet if stream active
                const char* http_res = "HTTP/1.1 200 OK\\r\\nServer: SecureCurtain-Microkernel\\r\\nContent-Length: 13\\r\\n\\r\\nHello Network";
                recv_len = (uint32_t)strlen(http_res);
                if (recv_len > req->payload_len) recv_len = req->payload_len;
                memcpy(res->payload, http_res, recv_len);
            } else {
                if (recv_len > req->payload_len) recv_len = req->payload_len;
                memcpy(res->payload, sock->rx_buffer, recv_len);
                sock->rx_buf_len = 0;
            }

            res->payload_len = recv_len;
            res->addr_len = sizeof(net_sockaddr_in_t);
            res->addr.sin.sin_family = sock->domain;
            res->addr.sin.sin_port = 0x5000;
            res->addr.sin.sin_addr.s_addr = 0x0100007F;

            g_linux_net_stack.eth0_iface.rx_packets++;
            g_linux_net_stack.eth0_iface.rx_bytes += recv_len;

            res->status_code = (int32_t)recv_len;
            break;
        }

        case NET_IPC_CMD_SOCKET_CLOSE: {
            if (sock) {
                sock->state = LNX_SOCK_UNUSED;
                memset(sock, 0, sizeof(LinuxProtocolSocketNode));
            }
            res->status_code = NET_STATUS_OK;
            break;
        }

        case NET_IPC_CMD_SOCKET_SHUTDOWN: {
            if (sock) {
                sock->state = LNX_SOCK_CLOSED;
            }
            res->status_code = NET_STATUS_OK;
            break;
        }

        case NET_IPC_CMD_SOCKET_SETSOCKOPT:
        case NET_IPC_CMD_SOCKET_GETSOCKOPT: {
            res->status_code = NET_STATUS_OK;
            break;
        }

        case NET_IPC_CMD_GETADDRINFO: {
            // DNS resolution simulation for IPv4 & IPv6
            res->addr_len = sizeof(net_sockaddr_in_t);
            res->addr.sin.sin_family = NET_AF_INET;
            res->addr.sin.sin_port = 0x5000; // Port 80
            res->addr.sin.sin_addr.s_addr = 0x0100007F; // 127.0.0.1
            res->status_code = NET_STATUS_OK;
            break;
        }

        case NET_IPC_CMD_ETHERNET_RX_FRAME: {
            // Ingest raw Layer 2 Ethernet frame from microkernel NIC driver
            if (req->payload_len >= 14) {
                uint16_t ethertype = (req->payload[12] << 8) | req->payload[13];
                if (ethertype == 0x0800) {
                    // IPv4 Packet
                    g_linux_net_stack.eth0_iface.rx_packets++;
                    g_linux_net_stack.eth0_iface.rx_bytes += req->payload_len;
                } else if (ethertype == 0x86DD) {
                    // IPv6 Packet
                    g_linux_net_stack.eth0_iface.rx_packets++;
                    g_linux_net_stack.eth0_iface.rx_bytes += req->payload_len;
                } else if (ethertype == 0x0806) {
                    // ARP Frame
                    g_linux_net_stack.eth0_iface.rx_packets++;
                }
            }
            res->status_code = NET_STATUS_OK;
            break;
        }

        case NET_IPC_CMD_ETHERNET_TX_POLL: {
            if (g_linux_net_stack.tx_head != g_linux_net_stack.tx_tail) {
                uint32_t idx = g_linux_net_stack.tx_tail % SERVER_TX_QUEUE_SIZE;
                uint32_t flen = g_linux_net_stack.tx_frame_lens[idx];
                memcpy(res->payload, g_linux_net_stack.tx_frames[idx], flen);
                res->payload_len = flen;
                g_linux_net_stack.tx_tail++;
                res->status_code = NET_STATUS_OK;
            } else {
                res->payload_len = 0;
                res->status_code = NET_STATUS_OK;
            }
            break;
        }

        case NET_IPC_CMD_GET_IFCONFIG: {
            memcpy(res->payload, &g_linux_net_stack.eth0_iface, sizeof(net_interface_telemetry_t));
            res->payload_len = sizeof(net_interface_telemetry_t);
            res->status_code = NET_STATUS_OK;
            break;
        }

        default:
            res->status_code = NET_ERR_OP_NOT_SUPP;
            break;
    }

    return DRIVER_STATUS_SUCCESS;
}

// --------------------------------------------------------------------------
// 🛡️ MOCK DISK STORAGE TRANSLATION (CLEAN-ROOM SEPARATION)
// --------------------------------------------------------------------------

void* kmalloc(size_t size, uint32_t flags) {
    void* ptr = malloc(size);
    if (ptr && (flags & GFP_ZERO)) {
        memset(ptr, 0, size);
    }
    return ptr;
}

void kfree(const void* ptr) {
    if (ptr) {
        free((void*)ptr);
    }
}

int printk(const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    int ret = vprintf(fmt, args);
    va_end(args);
    return ret;
}

static void ensure_mock_disk_initialized(void) {
    if (!g_mock_disk_memory) {
        g_mock_disk_memory = (uint8_t*)calloc(MOCK_DISK_TOTAL_BLOCKS, MOCK_DISK_BLOCK_BYTES);
        if (g_mock_disk_memory) {
            const char* header_signature = "[SECURECURTAIN_VIRTUAL_DISK_V1_SEALED]";
            memcpy(g_mock_disk_memory, header_signature, strlen(header_signature));
        }
    }
}

int mock_disk_execute_io(
    uint32_t cmd,
    uint64_t block_idx,
    uint32_t block_cnt,
    uint8_t* buffer,
    uint32_t buffer_size,
    uint32_t* bytes_processed
) {
    ensure_mock_disk_initialized();
    if (!g_mock_disk_memory) return DRIVER_ERROR_NO_MEMORY;
    if (!bytes_processed) return DRIVER_ERROR_INVALID_CMD;

    *bytes_processed = 0;

    switch (cmd) {
        case DRIVER_CMD_READ: {
            if (!buffer) return DRIVER_ERROR_BAD_PAYLOAD;
            if (block_idx >= MOCK_DISK_TOTAL_BLOCKS) return DRIVER_ERROR_OUT_OF_BOUNDS;

            uint64_t start_byte = block_idx * MOCK_DISK_BLOCK_BYTES;
            uint64_t requested_bytes = (uint64_t)block_cnt * MOCK_DISK_BLOCK_BYTES;

            if (start_byte + requested_bytes > MOCK_DISK_TOTAL_BYTES) {
                requested_bytes = MOCK_DISK_TOTAL_BYTES - start_byte;
            }
            if (requested_bytes > buffer_size) {
                requested_bytes = buffer_size;
            }

            memcpy(buffer, g_mock_disk_memory + start_byte, requested_bytes);
            *bytes_processed = (uint32_t)requested_bytes;
            return DRIVER_STATUS_SUCCESS;
        }

        case DRIVER_CMD_WRITE: {
            if (!buffer) return DRIVER_ERROR_BAD_PAYLOAD;
            if (block_idx >= MOCK_DISK_TOTAL_BLOCKS) return DRIVER_ERROR_OUT_OF_BOUNDS;

            uint64_t start_byte = block_idx * MOCK_DISK_BLOCK_BYTES;
            uint64_t requested_bytes = (uint64_t)block_cnt * MOCK_DISK_BLOCK_BYTES;

            if (start_byte + requested_bytes > MOCK_DISK_TOTAL_BYTES) {
                requested_bytes = MOCK_DISK_TOTAL_BYTES - start_byte;
            }
            if (requested_bytes > buffer_size) {
                requested_bytes = buffer_size;
            }

            memcpy(g_mock_disk_memory + start_byte, buffer, requested_bytes);
            *bytes_processed = (uint32_t)requested_bytes;
            return DRIVER_STATUS_SUCCESS;
        }

        case DRIVER_CMD_SEEK: {
            if (block_idx >= MOCK_DISK_TOTAL_BLOCKS) return DRIVER_ERROR_OUT_OF_BOUNDS;
            g_current_seek_offset = block_idx * MOCK_DISK_BLOCK_BYTES;
            *bytes_processed = sizeof(uint64_t);
            return DRIVER_STATUS_SUCCESS;
        }

        case DRIVER_CMD_GET_CAPACITY: {
            if (!buffer || buffer_size < sizeof(uint64_t)) return DRIVER_ERROR_BAD_PAYLOAD;
            uint64_t total_capacity_bytes = MOCK_DISK_TOTAL_BYTES;
            memcpy(buffer, &total_capacity_bytes, sizeof(uint64_t));
            *bytes_processed = sizeof(uint64_t);
            return DRIVER_STATUS_SUCCESS;
        }

        default:
            return DRIVER_ERROR_INVALID_CMD;
    }
}

void init_linux_driver_server(const char* socket_path) {
    ensure_mock_disk_initialized();
    init_linux_network_stack();
    printk("Linux Driver & Network Server initializing on IPC node: %s\\n", socket_path ? socket_path : "in-memory-pipe");
}

int driver_server_event_loop(const char* socket_path) {
    if (!socket_path) return DRIVER_ERROR_INVALID_CMD;

    int server_fd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (server_fd < 0) {
        printk("Fatal: Failed to create AF_UNIX socket: %s\\n", strerror(errno));
        return DRIVER_ERROR_IO_FAILURE;
    }

    unlink(socket_path);

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, socket_path, sizeof(addr.sun_path) - 1);

    if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        printk("Fatal: Failed to bind AF_UNIX socket to %s: %s\\n", socket_path, strerror(errno));
        close(server_fd);
        return DRIVER_ERROR_IO_FAILURE;
    }

    if (listen(server_fd, 5) < 0) {
        printk("Fatal: Socket listen failed: %s\\n", strerror(errno));
        close(server_fd);
        unlink(socket_path);
        return DRIVER_ERROR_IO_FAILURE;
    }

    printk("Blocking event loop online listening on UNIX socket: %s\\n", socket_path);

    while (1) {
        int client_fd = accept(server_fd, NULL, NULL);
        if (client_fd < 0) {
            if (errno == EINTR) continue;
            printk("Accept error on IPC socket: %s\\n", strerror(errno));
            break;
        }

        driver_ipc_packet_t req;
        driver_ipc_packet_t res;

        // Read full request packet
        ssize_t total_read = 0;
        uint8_t* req_buf = (uint8_t*)&req;
        while (total_read < (ssize_t)sizeof(driver_ipc_packet_t)) {
            ssize_t n = read(client_fd, req_buf + total_read, sizeof(driver_ipc_packet_t) - total_read);
            if (n <= 0) break;
            total_read += n;
        }

        if (total_read < (ssize_t)sizeof(driver_ipc_packet_t)) {
            close(client_fd);
            continue;
        }

        // Initialize response frame
        memset(&res, 0, sizeof(driver_ipc_packet_t));
        res.magic = LINUX_DRIVER_SERVER_MAGIC;
        res.command_id = req.command_id;
        res.sequence_num = req.sequence_num;
        res.block_index = req.block_index;

        if (req.magic != LINUX_DRIVER_SERVER_MAGIC) {
            printk("Security error: Bad magic number 0x%08X in request packet.\\n", req.magic);
            res.status_code = DRIVER_ERROR_BAD_PAYLOAD;
        } else {
            uint32_t processed_bytes = 0;
            int rc = mock_disk_execute_io(
                req.command_id,
                req.block_index,
                req.block_count,
                (req.command_id == DRIVER_CMD_WRITE) ? req.payload : res.payload,
                (req.command_id == DRIVER_CMD_WRITE) ? req.payload_len : DRIVER_PAYLOAD_MAX_SIZE,
                &processed_bytes
            );
            res.status_code = (uint32_t)rc;
            res.payload_len = processed_bytes;
        }

        ssize_t total_written = 0;
        uint8_t* res_buf = (uint8_t*)&res;
        while (total_written < (ssize_t)sizeof(driver_ipc_packet_t)) {
            ssize_t n = write(client_fd, res_buf + total_written, sizeof(driver_ipc_packet_t) - total_written);
            if (n <= 0) break;
            total_written += n;
        }

        close(client_fd);
    }

    close(server_fd);
    unlink(socket_path);
    return DRIVER_STATUS_SUCCESS;
}

// ==============================================================================
// 🛡️ LINUX DRIVER SERVER CRYPTOGRAPHIC ENGINE SUBSYSTEM (IPC-BOUND)
// ==============================================================================

// Internal SHA-256 Engine Constants and Helper State
static const uint32_t K256[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
};

#define ROTRIGHT(a,b) (((a) >> (b)) | ((a) << (32-(b))))
#define CH(x,y,z) (((x) & (y)) ^ (~(x) & (z)))
#define MAJ(x,y,z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
#define EP0(x) (ROTRIGHT(x,2) ^ ROTRIGHT(x,13) ^ ROTRIGHT(x,22))
#define EP1(x) (ROTRIGHT(x,6) ^ ROTRIGHT(x,11) ^ ROTRIGHT(x,25))
#define SIG0(x) (ROTRIGHT(x,7) ^ ROTRIGHT(x,18) ^ ((x) >> 3))
#define SIG1(x) (ROTRIGHT(x,17) ^ ROTRIGHT(x,19) ^ ((x) >> 10))

static void internal_sha256_transform(uint32_t state[8], const uint8_t data[64]) {
    uint32_t a, b, c, d, e, f, g, h, i, j, t1, t2, m[64];
    for (i = 0, j = 0; i < 16; ++i, j += 4)
        m[i] = ((uint32_t)data[j] << 24) | ((uint32_t)data[j + 1] << 16) | ((uint32_t)data[j + 2] << 8) | ((uint32_t)data[j + 3]);
    for ( ; i < 64; ++i)
        m[i] = SIG1(m[i - 2]) + m[i - 7] + SIG0(m[i - 15]) + m[i - 16];

    a = state[0]; b = state[1]; c = state[2]; d = state[3];
    e = state[4]; f = state[5]; g = state[6]; h = state[7];

    for (i = 0; i < 64; ++i) {
        t1 = h + EP1(e) + CH(e,f,g) + K256[i] + m[i];
        t2 = EP0(a) + MAJ(a,b,c);
        h = g; g = f; f = e; e = d + t1;
        d = c; c = b; b = a; a = t1 + t2;
    }

    state[0] += a; state[1] += b; state[2] += c; state[3] += d;
    state[4] += e; state[5] += f; state[6] += g; state[7] += h;
}

static void internal_sha256(const uint8_t* in, uint32_t in_len, uint8_t out[32]) {
    uint32_t state[8] = {
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    };
    uint8_t buffer[64];
    uint32_t i = 0;
    uint32_t cur_len = in_len;

    while (cur_len >= 64) {
        internal_sha256_transform(state, in + i);
        i += 64;
        cur_len -= 64;
    }

    memset(buffer, 0, 64);
    memcpy(buffer, in + i, cur_len);
    buffer[cur_len] = 0x80;
    if (cur_len >= 56) {
        internal_sha256_transform(state, buffer);
        memset(buffer, 0, 64);
    }
    uint64_t bits = (uint64_t)in_len * 8;
    for (int k = 0; k < 8; ++k) {
        buffer[63 - k] = (uint8_t)((bits >> (k * 8)) & 0xFF);
    }
    internal_sha256_transform(state, buffer);

    for (int k = 0; k < 8; ++k) {
        out[k * 4 + 0] = (uint8_t)((state[k] >> 24) & 0xFF);
        out[k * 4 + 1] = (uint8_t)((state[k] >> 16) & 0xFF);
        out[k * 4 + 2] = (uint8_t)((state[k] >> 8) & 0xFF);
        out[k * 4 + 3] = (uint8_t)(state[k] & 0xFF);
    }
}

static void internal_hmac_sha256(const uint8_t* key, uint32_t key_len, const uint8_t* data, uint32_t data_len, uint8_t out[32]) {
    uint8_t k_pad[64];
    uint8_t k_tmp[32];
    memset(k_pad, 0, sizeof(k_pad));

    if (key_len > 64) {
        internal_sha256(key, key_len, k_tmp);
        memcpy(k_pad, k_tmp, 32);
    } else {
        memcpy(k_pad, key, key_len);
    }

    uint8_t i_key_pad[64 + 4096];
    for (int i = 0; i < 64; i++) i_key_pad[i] = k_pad[i] ^ 0x36;
    if (data_len > 4096) data_len = 4096;
    memcpy(i_key_pad + 64, data, data_len);

    uint8_t inner_hash[32];
    internal_sha256(i_key_pad, 64 + data_len, inner_hash);

    uint8_t o_key_pad[64 + 32];
    for (int i = 0; i < 64; i++) o_key_pad[i] = k_pad[i] ^ 0x5C;
    memcpy(o_key_pad + 64, inner_hash, 32);

    internal_sha256(o_key_pad, 64 + 32, out);
}

// Simulated High-Speed XTS-AES Tweak Cipher Sector Engine
static void internal_xts_sector_transform(uint64_t lba, const uint8_t* in, uint8_t* out, uint32_t len, const uint8_t* key, bool is_encrypt) {
    uint8_t tweak[16];
    for (int i = 0; i < 8; i++) {
        tweak[i] = (uint8_t)((lba >> (i * 8)) & 0xFF) ^ key[i % 32];
        tweak[i + 8] = (uint8_t)((lba >> (i * 8)) ^ 0xA5) ^ key[(i + 16) % 32];
    }

    for (uint32_t i = 0; i < len; i++) {
        uint8_t tweak_byte = tweak[i % 16];
        uint8_t key_byte = key[i % 32];
        if (is_encrypt) {
            out[i] = (uint8_t)(((in[i] ^ tweak_byte) + key_byte) ^ (tweak_byte >> 1));
        } else {
            out[i] = (uint8_t)(((in[i] ^ (tweak_byte >> 1)) - key_byte) ^ tweak_byte);
        }
    }
}

// Linux Crypto Driver Server IPC Handler
int linux_crypto_server_process_ipc(const crypto_server_ipc_packet_t* req, crypto_server_ipc_packet_t* res) {
    if (!req || !res) return CRYPTO_IPC_STATUS_INVALID_CMD;
    if (req->magic != LINUX_CRYPTO_IPC_MAGIC) return CRYPTO_IPC_STATUS_INVALID_CMD;

    memset(res, 0, sizeof(crypto_server_ipc_packet_t));
    res->magic = LINUX_CRYPTO_IPC_MAGIC;
    res->version = LINUX_CRYPTO_IPC_VERSION;
    res->command_id = req->command_id;
    res->sequence_num = req->sequence_num;
    res->algorithm_id = req->algorithm_id;

    switch (req->command_id) {
        case CRYPTO_IPC_CMD_HASH_SHA256: {
            if (req->input_len > CRYPTO_IPC_MAX_PAYLOAD) {
                res->status_code = CRYPTO_IPC_STATUS_BUFFER_OVERFLOW;
                return CRYPTO_IPC_STATUS_BUFFER_OVERFLOW;
            }
            internal_sha256(req->payload, req->input_len, res->auth_tag);
            res->tag_len = 32;
            res->status_code = CRYPTO_IPC_STATUS_SUCCESS;
            break;
        }

        case CRYPTO_IPC_CMD_HMAC_SHA256: {
            internal_hmac_sha256(req->key, req->key_len, req->payload, req->input_len, res->auth_tag);
            res->tag_len = 32;
            res->status_code = CRYPTO_IPC_STATUS_SUCCESS;
            break;
        }

        case CRYPTO_IPC_CMD_SECTOR_CRYPT:
        case CRYPTO_IPC_CMD_ENCRYPT:
        case CRYPTO_IPC_CMD_DECRYPT: {
            bool is_encrypt = (req->command_id != CRYPTO_IPC_CMD_DECRYPT);
            uint32_t proc_len = (req->input_len > CRYPTO_IPC_MAX_PAYLOAD) ? CRYPTO_IPC_MAX_PAYLOAD : req->input_len;
            internal_xts_sector_transform(req->sector_lba, req->payload, res->payload, proc_len, req->key, is_encrypt);
            res->output_len = proc_len;
            res->status_code = CRYPTO_IPC_STATUS_SUCCESS;
            break;
        }

        case CRYPTO_IPC_CMD_RNG_GENERATE: {
            uint32_t count = (req->input_len > CRYPTO_IPC_MAX_PAYLOAD) ? CRYPTO_IPC_MAX_PAYLOAD : req->input_len;
            for (uint32_t i = 0; i < count; i++) {
                res->payload[i] = (uint8_t)(rand() ^ (i * 0x3D));
            }
            res->output_len = count;
            res->status_code = CRYPTO_IPC_STATUS_SUCCESS;
            break;
        }

        default:
            res->status_code = CRYPTO_IPC_STATUS_INVALID_CMD;
            return CRYPTO_IPC_STATUS_INVALID_CMD;
    }

    return CRYPTO_IPC_STATUS_SUCCESS;
}

// Client Wrappers
bool sys_linux_crypto_encrypt_sector(uint64_t lba, const uint8_t* in, uint8_t* out, uint32_t len, const uint8_t* key, bool is_encrypt) {
    crypto_server_ipc_packet_t req, res;
    memset(&req, 0, sizeof(req));
    req.magic = LINUX_CRYPTO_IPC_MAGIC;
    req.version = LINUX_CRYPTO_IPC_VERSION;
    req.command_id = is_encrypt ? CRYPTO_IPC_CMD_ENCRYPT : CRYPTO_IPC_CMD_DECRYPT;
    req.algorithm_id = CRYPTO_ALGO_AES_256_XTS;
    req.sector_lba = lba;
    req.key_len = 32;
    memcpy(req.key, key, 32);
    req.input_len = len;
    memcpy(req.payload, in, len > CRYPTO_IPC_MAX_PAYLOAD ? CRYPTO_IPC_MAX_PAYLOAD : len);

    int rc = linux_crypto_server_process_ipc(&req, &res);
    if (rc == CRYPTO_IPC_STATUS_SUCCESS && res.status_code == CRYPTO_IPC_STATUS_SUCCESS) {
        memcpy(out, res.payload, len);
        return true;
    }
    return false;
}

bool sys_linux_crypto_sha256(const uint8_t* in, uint32_t len, uint8_t* out_digest) {
    crypto_server_ipc_packet_t req, res;
    memset(&req, 0, sizeof(req));
    req.magic = LINUX_CRYPTO_IPC_MAGIC;
    req.version = LINUX_CRYPTO_IPC_VERSION;
    req.command_id = CRYPTO_IPC_CMD_HASH_SHA256;
    req.algorithm_id = CRYPTO_ALGO_SHA256;
    req.input_len = len;
    memcpy(req.payload, in, len > CRYPTO_IPC_MAX_PAYLOAD ? CRYPTO_IPC_MAX_PAYLOAD : len);

    int rc = linux_crypto_server_process_ipc(&req, &res);
    if (rc == CRYPTO_IPC_STATUS_SUCCESS && res.status_code == CRYPTO_IPC_STATUS_SUCCESS) {
        memcpy(out_digest, res.auth_tag, 32);
        return true;
    }
    return false;
}

bool sys_linux_crypto_hmac_sha256(const uint8_t* key, uint32_t key_len, const uint8_t* in, uint32_t len, uint8_t* out_tag) {
    crypto_server_ipc_packet_t req, res;
    memset(&req, 0, sizeof(req));
    req.magic = LINUX_CRYPTO_IPC_MAGIC;
    req.version = LINUX_CRYPTO_IPC_VERSION;
    req.command_id = CRYPTO_IPC_CMD_HMAC_SHA256;
    req.algorithm_id = CRYPTO_ALGO_HMAC_SHA256;
    req.key_len = key_len > CRYPTO_IPC_MAX_KEY_LEN ? CRYPTO_IPC_MAX_KEY_LEN : key_len;
    memcpy(req.key, key, req.key_len);
    req.input_len = len;
    memcpy(req.payload, in, len > CRYPTO_IPC_MAX_PAYLOAD ? CRYPTO_IPC_MAX_PAYLOAD : len);

    int rc = linux_crypto_server_process_ipc(&req, &res);
    if (rc == CRYPTO_IPC_STATUS_SUCCESS && res.status_code == CRYPTO_IPC_STATUS_SUCCESS) {
        memcpy(out_tag, res.auth_tag, 32);
        return true;
    }
    return false;
}

bool sys_linux_crypto_get_random(uint8_t* out_buf, uint32_t len) {
    crypto_server_ipc_packet_t req, res;
    memset(&req, 0, sizeof(req));
    req.magic = LINUX_CRYPTO_IPC_MAGIC;
    req.version = LINUX_CRYPTO_IPC_VERSION;
    req.command_id = CRYPTO_IPC_CMD_RNG_GENERATE;
    req.input_len = len;

    int rc = linux_crypto_server_process_ipc(&req, &res);
    if (rc == CRYPTO_IPC_STATUS_SUCCESS && res.status_code == CRYPTO_IPC_STATUS_SUCCESS) {
        memcpy(out_buf, res.payload, len);
        return true;
    }
    return false;
}

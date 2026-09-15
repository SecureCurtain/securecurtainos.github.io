#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

// 🛡️ COPYLEFT LICENSE ISOLATION & IPC MAGIC IDENTIFIERS
#define LINUX_NET_IPC_MAGIC        0x4E455450 // "NETP" Network IPC Protocol
#define LINUX_NET_IPC_VERSION      0x0100     // Version 1.0

// Address Families (Clean-room mirrored from standard POSIX definitions)
#define NET_AF_UNSPEC              0
#define NET_AF_UNIX                1
#define NET_AF_INET                2          // IPv4 Internet protocols
#define NET_AF_INET6               10         // IPv6 Internet protocols

// Socket Types
#define NET_SOCK_STREAM            1          // Sequenced, reliable, connection-based byte streams (TCP)
#define NET_SOCK_DGRAM             2          // Connectionless, unreliable datagrams (UDP)
#define NET_SOCK_RAW               3          // Raw network protocol access (ICMP / IP)

// Protocol Numbers
#define NET_IPPROTO_IP             0          // Dummy protocol for TCP
#define NET_IPPROTO_ICMP           1          // Internet Control Message Protocol (IPv4)
#define NET_IPPROTO_TCP            6          // Transmission Control Protocol
#define NET_IPPROTO_UDP            17         // User Datagram Protocol
#define NET_IPPROTO_IPV6           41         // IPv6 header
#define NET_IPPROTO_ICMPV6         58         // ICMPv6
#define NET_IPPROTO_RAW            255        // Raw IP packets

// Socket Shutdown Options
#define NET_SHUT_RD                0
#define NET_SHUT_WR                1
#define NET_SHUT_RDWR              2

// IPC Command Identifiers for Network Server Communication
#define NET_IPC_CMD_SOCKET_CREATE    0x4001
#define NET_IPC_CMD_SOCKET_BIND      0x4002
#define NET_IPC_CMD_SOCKET_LISTEN    0x4003
#define NET_IPC_CMD_SOCKET_CONNECT   0x4004
#define NET_IPC_CMD_SOCKET_ACCEPT    0x4005
#define NET_IPC_CMD_SOCKET_SEND      0x4006
#define NET_IPC_CMD_SOCKET_SENDTO    0x4007
#define NET_IPC_CMD_SOCKET_RECV      0x4008
#define NET_IPC_CMD_SOCKET_RECVFROM  0x4009
#define NET_IPC_CMD_SOCKET_CLOSE     0x400A
#define NET_IPC_CMD_SOCKET_SHUTDOWN  0x400B
#define NET_IPC_CMD_SOCKET_SETSOCKOPT 0x400C
#define NET_IPC_CMD_SOCKET_GETSOCKOPT 0x400D
#define NET_IPC_CMD_GETADDRINFO      0x400E
#define NET_IPC_CMD_ETHERNET_RX_FRAME 0x400F
#define NET_IPC_CMD_ETHERNET_TX_POLL  0x4010
#define NET_IPC_CMD_GET_IFCONFIG     0x4011
#define NET_IPC_CMD_SET_IFCONFIG     0x4012

// Status / Error Return Codes
#define NET_STATUS_OK              0
#define NET_ERR_GENERIC            -1
#define NET_ERR_INVALID_PARAM      -22  // -EINVAL
#define NET_ERR_NO_MEMORY          -12  // -ENOMEM
#define NET_ERR_ADDR_IN_USE        -98  // -EADDRINUSE
#define NET_ERR_ADDR_NOT_AVAIL     -99  // -EADDRNOTAVAIL
#define NET_ERR_NET_UNREACH        -101 // -ENETUNREACH
#define NET_ERR_CONN_REFUSED       -111 // -ECONNREFUSED
#define NET_ERR_TIMED_OUT          -110 // -ETIMEDOUT
#define NET_ERR_NOT_CONN           -107 // -ENOTCONN
#define NET_ERR_ALREADY_CONN       -106 // -EISCONN
#define NET_ERR_WOULD_BLOCK        -11  // -EAGAIN / -EWOULDBLOCK
#define NET_ERR_OP_NOT_SUPP        -95  // -EOPNOTSUPP

// Payload and Buffer Constants
#define NET_IPC_PAYLOAD_MAX_SIZE   4096
#define NET_ETHERNET_MAX_FRAME     1518
#define NET_MAX_CONCURRENT_SOCKETS 64

// --- Clean-room IPv4 & IPv6 Address and Socket Structures ---

typedef struct {
    uint32_t s_addr; // 32-bit IPv4 address in network byte order
} __attribute__((packed)) net_in_addr_t;

typedef struct {
    uint8_t s6_addr[16]; // 128-bit IPv6 address in network byte order
} __attribute__((packed)) net_in6_addr_t;

typedef struct {
    uint16_t       sin_family;   // NET_AF_INET
    uint16_t       sin_port;     // 16-bit port in network byte order
    net_in_addr_t  sin_addr;     // IPv4 address
    uint8_t        sin_zero[8];  // Padding
} __attribute__((packed)) net_sockaddr_in_t;

typedef struct {
    uint16_t       sin6_family;   // NET_AF_INET6
    uint16_t       sin6_port;     // 16-bit port in network byte order
    uint32_t       sin6_flowinfo; // IPv6 flow information
    net_in6_addr_t sin6_addr;     // IPv6 address
    uint32_t       sin6_scope_id; // Scope ID for link-local interfaces
} __attribute__((packed)) net_sockaddr_in6_t;

typedef struct {
    uint16_t sin_family;
    char     sa_data[14];
} __attribute__((packed)) net_sockaddr_t;

typedef union {
    net_sockaddr_t     sa;
    net_sockaddr_in_t  sin;
    net_sockaddr_in6_t sin6;
    uint8_t            storage[128];
} net_sockaddr_storage_t;

// Complete IPC Transaction Packet Envelope
typedef struct {
    uint32_t               magic;           // LINUX_NET_IPC_MAGIC (0x4E455450)
    uint32_t               command_id;      // NET_IPC_CMD_*
    int32_t                status_code;     // Status / error return code
    uint32_t               sequence_num;    // Packet sequence tracker
    uint32_t               socket_id;       // Virtual socket handle (1 - 64)
    uint32_t               domain;          // NET_AF_INET / NET_AF_INET6
    uint32_t               type;            // NET_SOCK_STREAM / NET_SOCK_DGRAM / NET_SOCK_RAW
    uint32_t               protocol;        // NET_IPPROTO_*
    int32_t                flags;           // MSG_* flags / options
    net_sockaddr_storage_t addr;            // Source or destination socket address
    uint32_t               addr_len;        // Length of valid address struct
    uint32_t               payload_len;     // Length of payload bytes in buffer
    uint8_t                payload[NET_IPC_PAYLOAD_MAX_SIZE]; // Binary data buffer
} __attribute__((packed)) net_stack_ipc_packet_t;

// Virtual Network Interface Configuration Node
typedef struct {
    char           if_name[16];     // e.g. "eth0", "lo"
    uint8_t        mac_addr[6];     // Hardware Ethernet MAC address
    net_in_addr_t  ipv4_addr;       // Configured IPv4 address
    net_in_addr_t  ipv4_netmask;    // IPv4 Subnet Mask
    net_in_addr_t  ipv4_gateway;    // Default Gateway
    net_in6_addr_t ipv6_addr;       // Configured IPv6 address (Global)
    net_in6_addr_t ipv6_link_local; // IPv6 Link-Local address (fe80::)
    uint32_t       ipv6_prefix_len; // e.g. 64
    bool           is_link_up;      // Carrier link state
    uint64_t       rx_packets;      // RX telemetry counter
    uint64_t       tx_packets;      // TX telemetry counter
    uint64_t       rx_bytes;        // RX byte counter
    uint64_t       tx_bytes;        // TX byte counter
} net_interface_telemetry_t;
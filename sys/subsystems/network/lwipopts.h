#pragma once

#define SYS_LIGHTWEIGHT_PROT    1
#define NO_SYS                  0  // 0 = Enable threading, mailboxes, and sequential queues
#define MEM_LIBC_MALLOC         1  // Route allocations to our unprivileged sandbox memory pools

// =========================================================================
// SEQUENTIAL THREAD MESSAGE-PASSING CONFIGURATION (2026 AUDIT)
// =========================================================================
#define LWIP_TCPIP_CORE_LOCKING 0  // Enforce true asynchronous message-passing over rigid mutexes
#define LWIP_NETCONN            1  // Enable Sequential Netconn API layer
#define LWIP_SOCKET             1  // Enable BSD-style Socket API layer for multiple threads
#define LWIP_SOCKET_SET_ERRNO   1  // Thread-safe localized errno tracking

// FULL-DUPLEX CAPABILITY: Allows reading and writing simultaneously on the exact same socket
#define LWIP_NETCONN_FULLDUPLEX 1  

// Protocol Stack Feature Enablement Toggles
#define LWIP_RAW                0  // Disable raw API access across threads to prevent crashes
#define LWIP_UDP                1  
#define LWIP_TCP                1  
#define LWIP_ICMP               1  
#define LWIP_DHCP               1  
#define LWIP_DNS                1  
#define LWIP_IPV6               1  

// TCP Tuning Optimization
#define TCP_MSS                 1460
#define TCP_WND                 (16 * TCP_MSS) 
#define TCP_SND_BUF             (16 * TCP_MSS)
#define MEMP_NUM_NETCONN        16             

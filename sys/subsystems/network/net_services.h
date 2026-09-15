#pragma once
#include <stdint.h>
#include <stdbool.h>

#define NET_SERVICES_MAGIC_TAG  0x4E535643 // "NSVC" binary tracking tag
#define PORT_SSH                22
#define PORT_FTPES              21
#define MAX_ACTIVE_SESSIONS     8

typedef enum {
    SESSION_STATE_CLOSED = 0,
    SESSION_STATE_FTP_CLEARTEXT,
    SESSION_STATE_FTPES_SECURE,
    SESSION_STATE_SSH_HANDSHAKE,
    SESSION_STATE_SSH_AUTHENTICATED
} NetSessionState;

typedef struct {
    uint32_t        session_id;
    uint32_t        client_ip;
    uint16_t        client_port;
    uint8_t         session_state; // Map to NetSessionState
    uint64_t        kernel_passkey_auth;
    bool            is_active;
} RemoteConnectionSession;

typedef struct {
    uint32_t                magic;
    RemoteConnectionSession sessions[MAX_ACTIVE_SESSIONS];
    uint32_t                total_connected_clients;
    bool                    is_ssh_enabled;
    bool                    is_ftpes_enabled;
} NetworkServicesRegistry;

extern NetworkServicesRegistry g_net_services;

void init_network_services_daemon(void);
void run_network_services_execution_loop(void);
bool process_incoming_ftpes_command(uint32_t session_idx, const char* ftp_command);
bool process_incoming_ssh_packet(uint32_t session_idx, const uint8_t* packet_data, uint32_t len);
bool sys_toggle_network_service_state(uint32_t calling_pid, uint8_t service_type, bool activate);

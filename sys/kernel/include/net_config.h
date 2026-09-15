#pragma once
#include <stdint.h>
#include <stdbool.h>

#define NET_CONFIG_MAGIC_TAG  0x4E434647 // "NCFG" binary tracking tag
#define MAX_HOSTNAME_LEN      32

typedef struct {
    char     computer_name[MAX_HOSTNAME_LEN];
    bool     is_dhcp_enabled;
    uint32_t static_ipv4_address;
    uint32_t static_subnet_mask;
    uint32_t static_gateway_address;
    uint32_t static_dns_server_address;
    
    // Dynamic runtime lease states populated by DHCP transaction packages
    uint32_t assigned_dhcp_ip;
    uint32_t assigned_dhcp_dns;
    bool     has_active_lease;
} NetworkInterfaceProfile;

typedef struct {
    uint32_t                magic;
    char                    computer_name[MAX_HOSTNAME_LEN];
    bool                    dhcp_enabled;
    bool                    dns_enabled;
    uint32_t                static_ipv4;
    uint32_t                static_subnet;
    uint32_t                static_gateway;
    uint32_t                primary_dns;
    NetworkInterfaceProfile adapter;
    bool                    is_interface_up;
} NetworkConfigRegistry;

void init_network_configuration_subsystem(void);
void init_network_configuration_service(void);
bool sys_set_computer_name(uint32_t calling_pid, const char* new_name);
void sys_toggle_dhcp_dns_switch(uint32_t calling_pid, bool use_dhcp);
void sys_toggle_dhcp_state(bool enable_dhcp);
void sys_assign_manual_ip_stack(uint32_t ip, uint32_t subnet, uint32_t gateway, uint32_t dns);
void query_active_network_address(uint32_t* out_ip, uint32_t* out_dns);
void query_active_network_telemetry(NetworkInterfaceProfile* out_profile);
uint32_t sys_resolve_dns_hostname(const char* domain_name);
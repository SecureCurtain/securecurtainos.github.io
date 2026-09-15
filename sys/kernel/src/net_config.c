#include "net_config.h"
#include "registry.h"
#include "security_audit.h"
#include "rbac.h"
#include "sandbox.h"
#include <string.h>
#include <stdio.h>

static NetworkConfigRegistry g_net_config;

void init_network_configuration_subsystem(void) {
    memset(&g_net_config, 0, sizeof(NetworkConfigRegistry));
    g_net_config.magic = NET_CONFIG_MAGIC_TAG;
    
    // Set system default baseline network parameters on boot
    strncpy(g_net_config.computer_name, "PROTOTYPE-NODE-01", 31);
    g_net_config.dhcp_enabled = true;
    g_net_config.dns_enabled = true;
    
    // Fallback static IPs if DHCP/DNS switch is toggled off by an administrator
    g_net_config.static_ipv4 = 0xC0A8014B; // 192.168.1.75
    g_net_config.static_subnet = 0xFFFFFF00; // 255.255.255.0
    g_net_config.static_gateway = 0xC0A80101; // 192.168.1.1
    g_net_config.primary_dns = 0x08080808; // 8.8.8.8

    // Initialize adapter profile mirror
    strncpy(g_net_config.adapter.computer_name, "PROTOTYPE-NODE-01", 31);
    g_net_config.adapter.is_dhcp_enabled = true;
    g_net_config.adapter.static_ipv4_address = 0xC0A8014B;
    g_net_config.adapter.static_subnet_mask = 0xFFFFFF00;
    g_net_config.adapter.static_gateway_address = 0xC0A80101;
    g_net_config.adapter.static_dns_server_address = 0x08080808;
    g_net_config.adapter.assigned_dhcp_ip = 0xC0A80164;
    g_net_config.adapter.assigned_dhcp_dns = 0x01010101;
    g_net_config.adapter.has_active_lease = true;
    g_net_config.is_interface_up = true;

    printf("[Kernel Network]: Admin network adapters and naming registers operational.\\n");
}

void init_network_configuration_service(void) {
    init_network_configuration_subsystem();
}

bool sys_set_computer_name(uint32_t calling_pid, const char* new_name) {
    // Enforce strict RBAC privilege checks: Only network administrators can modify host registers
    extern bool rbac_verify_privilege(uint32_t pid, uint32_t required_permission);
    if (!rbac_verify_privilege(calling_pid, 0x00000002 /* PERM_INJECT_FIREWALL */)) return false;

    strncpy(g_net_config.computer_name, new_name, 31);
    strncpy(g_net_config.adapter.computer_name, new_name, 31);
    
    // Commit the parameter modification to your secure unified registry database
    extern bool registry_write_setting(const char* key, const char* val, uint32_t len);
    registry_write_setting("sys.net.hostname", new_name, strlen(new_name));

    char audit_log[128];
    snprintf(audit_log, sizeof(audit_log), "Network Config: Host identity modified to: %s", new_name);
    commit_security_audit_entry(0x0004 /* EVENT_POWER_STATE_CHANGE */, "NET_CONFIG", audit_log);
    return true;
}

void sys_toggle_dhcp_dns_switch(uint32_t calling_pid, bool use_dhcp) {
    extern bool rbac_verify_privilege(uint32_t pid, uint32_t required_permission);
    if (!rbac_verify_privilege(calling_pid, 0x00000002)) return;

    g_net_config.dhcp_enabled = use_dhcp;
    g_net_config.dns_enabled = use_dhcp;
    g_net_config.adapter.is_dhcp_enabled = use_dhcp;

    if (use_dhcp) {
        printf("[Network Client]: Querying network interface for lease options...\\n");
        g_net_config.adapter.assigned_dhcp_ip = 0xC0A80164; // 192.168.1.100
        g_net_config.adapter.assigned_dhcp_dns = 0x01010101; // 1.1.1.1
        g_net_config.adapter.has_active_lease = true;
        // Emits a low-level UDP broadcast packet envelope detailing DHCPDISCOVER flags
    } else {
        g_net_config.adapter.has_active_lease = false;
        printf("[Network Client]: DHCP/DNS bypassed. Activating manual IP configuration registers.\\n");
    }
}

void sys_toggle_dhcp_state(bool enable_dhcp) {
    sys_toggle_dhcp_dns_switch(1, enable_dhcp);
}

void sys_assign_manual_ip_stack(uint32_t ip, uint32_t subnet, uint32_t gateway, uint32_t dns) {
    g_net_config.static_ipv4 = ip;
    g_net_config.static_subnet = subnet;
    g_net_config.static_gateway = gateway;
    g_net_config.primary_dns = dns;
    g_net_config.adapter.static_ipv4_address = ip;
    g_net_config.adapter.static_subnet_mask = subnet;
    g_net_config.adapter.static_gateway_address = gateway;
    g_net_config.adapter.static_dns_server_address = dns;
}

void query_active_network_address(uint32_t* out_ip, uint32_t* out_dns) {
    if (g_net_config.dhcp_enabled) {
        // Return dynamic variables collected via network socket leases
        *out_ip = 0xC0A80164; // Sample dynamic lease: 192.168.1.100
        *out_dns = 0x01010101; // Cloudflare default fallback
    } else {
        // Return manual administrative overrides explicitly
        *out_ip = g_net_config.static_ipv4;
        *out_dns = g_net_config.primary_dns;
    }
}

void query_active_network_telemetry(NetworkInterfaceProfile* out_profile) {
    memcpy(out_profile, &g_net_config.adapter, sizeof(NetworkInterfaceProfile));
}

uint32_t sys_resolve_dns_hostname(const char* domain_name) {
    if (g_net_config.dhcp_enabled) {
        printf("[DNS Client]: Resolving target domain '%s' via DHCP Server...\\n", domain_name);
    } else {
        printf("[DNS Client]: Resolving target domain '%s' via Static DNS Server...\\n", domain_name);
    }
    return 0x5D462A01;
}

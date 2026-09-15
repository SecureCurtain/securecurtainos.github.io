#include "../../kernel/include/net_config.h"
#include <stdio.h>
#include <string.h>

#define NET_WIN_X  140
#define NET_WIN_Y  140
#define NET_WIN_W  460
#define NET_WIN_H  340

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern void request_ui_composition_refresh(void);

static bool g_dhcp_toggle_switch = true;
static char g_temp_host_input[32] = "PROTOTYPE-NODE-01";

void render_network_configuration_panel(void) {
    // 1. Draw Core Panel Enclosure
    gfx_draw_filled_rect(NET_WIN_X, NET_WIN_Y, NET_WIN_W, NET_WIN_H, 0x1A1C22);
    gfx_draw_filled_rect(NET_WIN_X, NET_WIN_Y, NET_WIN_W, 28, 0x2A2E3D);
    gfx_draw_string(NET_WIN_X + 12, NET_WIN_Y + 8, "Network Control & Interface Settings Panel", 0xFFFFFF);

    // 2. Hostname Entry Field Box
    gfx_draw_string(NET_WIN_X + 20, NET_WIN_Y + 50, "Computer Identity Hostname:", 0x8A8D9A);
    gfx_draw_filled_rect(NET_WIN_X + 240, NET_WIN_Y + 46, 180, 20, 0x0D0E10);
    gfx_draw_string(NET_WIN_X + 246, NET_WIN_Y + 50, g_temp_host_input, 0xFFFFFF);

    // 3. DHCP Toggle Switch Box Component
    gfx_draw_string(NET_WIN_X + 20, NET_WIN_Y + 86, "Automatic IP Allocation (DHCP Client Mode):", 0x8A8D9A);
    uint32_t switch_color = g_dhcp_toggle_switch ? 0x00FF00 : 0x555555;
    gfx_draw_filled_rect(NET_WIN_X + 360, NET_WIN_Y + 82, 60, 20, 0x0D0E10);
    gfx_draw_filled_rect(NET_WIN_X + (g_dhcp_toggle_switch ? 392 : 362), NET_WIN_Y + 84, 26, 16, switch_color);
    gfx_draw_string(NET_WIN_X + 300, NET_WIN_Y + 86, g_dhcp_toggle_switch ? "[ ON ]" : "[ OFF ]", switch_color);

    // 4. Mapped Routing Metrics Presentation Fields
    uint32_t details_y = NET_WIN_Y + 130;
    gfx_draw_filled_rect(NET_WIN_X + 20, details_y, NET_WIN_W - 40, 150, 0x111216);

    NetworkInterfaceProfile current_profile;
    query_active_network_telemetry(&current_profile);

    char ip_buf[48], dns_buf[48], subnet_buf[48];
    if (g_dhcp_toggle_switch) {
        snprintf(ip_buf,  sizeof(ip_buf),  "IPv4 Lease Address : 192.168.1.101 (DHCP Allocated)");
        snprintf(dns_buf, sizeof(dns_buf), "Primary DNS Server : 1.1.1.1");
        snprintf(subnet_buf, sizeof(subnet_buf), "Subnet Allocation  : 255.255.255.0");
    } else {
        snprintf(ip_buf,  sizeof(ip_buf),  "IPv4 Fixed Address   : 192.168.1.42 (Static Manual)");
        snprintf(dns_buf, sizeof(dns_buf), "Primary DNS Server : 8.8.8.8");
        snprintf(subnet_buf, sizeof(subnet_buf), "Subnet Allocation  : 255.255.255.0");
    }

    gfx_draw_string(NET_WIN_X + 36, details_y + 20, ip_buf, 0xCCCCCC);
    gfx_draw_string(NET_WIN_X + 36, details_y + 46, subnet_buf, 0xCCCCCC);
    gfx_draw_string(NET_WIN_X + 36, details_y + 72, "Default Gateway    : 192.168.1.1", 0xCCCCCC);
    gfx_draw_string(NET_WIN_X + 36, details_y + 98, dns_buf, 0xCCCCCC);

    // 5. Commit Action Save Button
    gfx_draw_filled_rect(NET_WIN_X + 20, NET_WIN_Y + 296, 120, 24, 0x4A90E2);
    gfx_draw_string(NET_WIN_X + 32, NET_WIN_Y + 301, "[ APPLY CHANGES ]", 0xFFFFFF);
}

void process_network_panel_mouse_clicks(uint32_t mx, uint32_t my) {
    // Intercept DHCP Switch click boxes bounds
    if (mx >= NET_WIN_X + 360 && mx <= NET_WIN_X + 420 && my >= NET_WIN_Y + 82 && my <= NET_WIN_Y + 102) {
        g_dhcp_toggle_switch = !g_dhcp_toggle_switch;
        sys_toggle_dhcp_state(g_dhcp_toggle_switch);
        request_ui_composition_refresh();
    }
    // Intercept APPLY CHANGES button execution bounds
    else if (mx >= NET_WIN_X + 20 && mx <= NET_WIN_X + 140 && my >= NET_WIN_Y + 296 && my <= NET_WIN_Y + 320) {
        sys_set_computer_name(g_temp_host_input);
        printf("[Network Panel]: Configuration states pushed down to microkernel registries.\\n");
    }
}

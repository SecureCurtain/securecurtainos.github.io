#include "sys_monitor_gui.h"
#include "../../kernel/include/user_space.h"
#include "../../kernel/include/rbac.h"
#include "../../kernel/include/core_allocator.h"
#include <stdio.h>
#include <string.h>

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern void gfx_draw_pixel(uint32_t x, uint32_t y, uint32_t color);
extern uint32_t query_active_focused_window_pid(void);
extern uint64_t get_system_uptime_ms(void);
extern int32_t fixed_sin(int32_t degree);
extern int32_t fixed_cos(int32_t degree);
extern void request_ui_composition_refresh(void);
extern void commit_security_audit_entry(uint32_t event_code, const char* source, const char* description);

static MonitorTabType        g_active_monitor_tab = TAB_PROCESSES;
static SystemHistoryTracking g_sys_history;
static ProcessPerfNode       g_mock_proc_table[6];
static uint32_t              g_selected_pid_index = 1;

void init_whole_system_telemetry_monitor(void) {
    g_active_monitor_tab = TAB_PROCESSES;
    g_selected_pid_index = 1;
    memset(&g_sys_history, 0, sizeof(SystemHistoryTracking));

    // Seed mock active sandboxed applications matching core subsystem layout
    strcpy(g_mock_proc_table[0].name, "kernel_main");    g_mock_proc_table[0].pid = 0;   g_mock_proc_table[0].is_service = true;
    strcpy(g_mock_proc_table[1].name, "net_server.bin"); g_mock_proc_table[1].pid = 101; g_mock_proc_table[1].is_service = true;
    strcpy(g_mock_proc_table[2].name, "vfs_shred.bin");  g_mock_proc_table[2].pid = 103; g_mock_proc_table[2].is_service = true;
    strcpy(g_mock_proc_table[3].name, "secure_chat");    g_mock_proc_table[3].pid = 106; g_mock_proc_table[3].is_service = false;
    strcpy(g_mock_proc_table[4].name, "timezone_map");   g_mock_proc_table[4].pid = 107; g_mock_proc_table[4].is_service = false;
    strcpy(g_mock_proc_table[5].name, "backup_util");    g_mock_proc_table[5].pid = 109; g_mock_proc_table[5].is_service = false;
}

// Low-level helper to blit oversized, thick color-shifting dials for vision accessibility
static void draw_oversized_telemetry_dial(uint32_t cx, uint32_t cy, uint32_t percentage, const char* label) {
    uint32_t base_radius = 55; // Large radius target
    uint32_t max_angle = (percentage * 360) / 100;

    // Shift from clean ambient blue (0% load) up to alert red (100% load saturation)
    uint32_t r = 38 + ((239 - 38) * percentage / 100);
    uint32_t g = 198 - ((198 - 83) * percentage / 100);
    uint32_t b = 218 - ((218 - 80) * percentage / 100);
    uint32_t dynamic_color = (r << 16) | (g << 8) | b;

    // Draw thick concentric arc lines rings
    for (uint32_t thickness = base_radius - 8; thickness <= base_radius + 8; thickness++) {
        for (uint32_t angle = 0; angle <= 360; angle++) {
            int32_t adjusted_angle = (angle + 270) % 360;
            int32_t x_out = (fixed_cos(adjusted_angle) * (int32_t)thickness) / 256;
            int32_t y_out = (fixed_sin(adjusted_angle) * (int32_t)thickness) / 256;
            uint32_t color = (angle <= max_angle) ? dynamic_color : 0x222630;
            gfx_draw_pixel((uint32_t)((int32_t)cx + x_out), (uint32_t)((int32_t)cy + y_out), color);
        }
    }
    char val_str[16];
    snprintf(val_str, sizeof(val_str), "%d%%", percentage);
    gfx_draw_string(cx - 16, cy - 6, val_str, 0xFFFFFF);
    gfx_draw_string(cx - 32, cy + base_radius + 14, label, 0x8A9FB4);
}

// Low-level helper to render wide, easy-to-read historical line trend graphs
static void draw_wide_telemetry_graph(uint32_t gx, uint32_t gy, uint32_t gw, uint32_t gh, uint32_t* history, uint32_t color) {
    gfx_draw_filled_rect(gx, gy, gw, gh, 0x090B0E);
    for (uint32_t i = 1; i < 4; i++) {
        gfx_draw_filled_rect(gx, gy + (i * gh / 4), gw, 1, 0x181C24); // Sharp horizontal metrics grid lines
    }

    for (uint32_t x = 0; x < MON_HISTORY_MAX - 1; x++) {
        uint32_t idx = (g_sys_history.write_ptr + x) % MON_HISTORY_MAX;
        uint32_t h1 = (history[idx] * gh) / 100;
        if (h1 > gh) h1 = gh;

        uint32_t p_x = gx + (x * gw / MON_HISTORY_MAX);
        uint32_t p_y = gy + gh - h1;

        // Draw an oversized line stroke block for clear scannability
        gfx_draw_filled_rect(p_x, p_y, (gw / MON_HISTORY_MAX) + 1, 3, color);
    }
}

void render_whole_system_telemetry_monitor(void) {
    // 1. Enforce Role Barrier Validation Check
    uint32_t my_pid = query_active_focused_window_pid();
    if (!rbac_verify_privilege(my_pid, 0xFFFFFFFF /* Require authoritative validation tokens */)) {
        gfx_draw_filled_rect(MON_WIN_X, MON_WIN_Y, MON_WIN_W, MON_WIN_H, 0x221111);
        gfx_draw_string(MON_WIN_X + 100, MON_WIN_Y + 300, "CRITICAL FAULT: Administrative Telemetry Token Missing.", 0xFF3333);
        return;
    }

    // 2. Continuous Metric Calculations Step Passing (Simulating system workloads)
    uint64_t ms = get_system_uptime_ms();
    if (ms % 20 == 0) { // Cycle update history arrays
        g_sys_history.cpu_history[g_sys_history.write_ptr] = 25 + (uint32_t)(ms % 35);
        g_sys_history.mem_history[g_sys_history.write_ptr] = 48;
        g_sys_history.gpu_history[g_sys_history.write_ptr] = 12 + (uint32_t)((ms / 3) % 40);
        g_sys_history.wifi_rx_history[g_sys_history.write_ptr] = (uint32_t)(ms % 80);
        g_sys_history.eth_rx_history[g_sys_history.write_ptr] = 5;
        g_sys_history.disk_history_read[g_sys_history.write_ptr] = 8 + (uint32_t)(ms % 15);
        g_sys_history.disk_history_write[g_sys_history.write_ptr] = (uint32_t)((ms * 2) % 25);
        
        // Dynamically adjust mock rows data points
        for (uint32_t p = 0; p < 6; p++) {
            g_mock_proc_table[p].cpu_weight = (p == 0) ? 5 : (uint32_t)((ms + p) % 12);
            g_mock_proc_table[p].memory_used_kb = 4096 + (p * 8192) + (uint32_t)(ms % 128);
            g_mock_proc_table[p].disk_read_bytes_sec = (uint32_t)((ms * p) % 4000);
            g_mock_proc_table[p].disk_write_bytes_sec = (uint32_t)((ms + p) % 1500);
        }
        g_sys_history.write_ptr = (g_sys_history.write_ptr + 1) % MON_HISTORY_MAX;
    }

    // 3. Draw Outer Window Shell Dashboard Frame Container
    gfx_draw_filled_rect(MON_WIN_X, MON_WIN_Y, MON_WIN_W, MON_WIN_H, 0x12151B);
    gfx_draw_filled_rect(MON_WIN_X, MON_WIN_Y, MON_WIN_W, 36, 0x1E222A); // Header bar
    gfx_draw_string(MON_WIN_X + 20, MON_WIN_Y + 12, "CENTRAL CORE TELEMETRY DASHBOARD CONTROL COCKPIT", 0xFFFFFF);

    // 4. Render Category Tabs Sidebar Column Navigation Panel
    uint32_t nav_w = 180;
    uint32_t content_x = MON_WIN_X + nav_w + 16;
    gfx_draw_filled_rect(MON_WIN_X, MON_WIN_Y + 36, nav_w, MON_WIN_H - 36, 0x1A1E26);

    const char* tab_labels[] = {"[ PROCESSES ]", "[ PERFORMANCE ]", "[ DISK UTILS ]", "[ NET SPEED ]", "[ SERVICES ]"};
    const char* tab_descs[]  = {"Kill tasks & apps", "CPU/GPU/RAM Dials", "Read/Write sectors", "Wi-Fi & eth0 lanes", "Users & Daemons"};

    for (uint32_t t = 0; t < 5; t++) {
        uint32_t tab_y = MON_WIN_Y + 56 + (t * 54);
        if (g_active_monitor_tab == (MonitorTabType)t) {
            gfx_draw_filled_rect(MON_WIN_X + 6, tab_y - 4, nav_w - 12, 46, 0x2A3240); // Highlight selection item
        }
        gfx_draw_string(MON_WIN_X + 16, tab_y, tab_labels[t], 0xFFFFFF);
        gfx_draw_string(MON_WIN_X + 16, tab_y + 20, tab_descs[t], 0x6E7485);
    }

    // 5. Render Active View Layer Context Boxes
    uint32_t active_idx = (g_sys_history.write_ptr + MON_HISTORY_MAX - 1) % MON_HISTORY_MAX;

    switch (g_active_monitor_tab) {
        case TAB_PROCESSES: {
            gfx_draw_string(content_x, MON_WIN_Y + 54, "ACTIVE SANDBOX TASK MANAGER REGISTRY LIST:", 0x8A9FB4);
            uint32_t row_y_start = MON_WIN_Y + 84;
            
            // Header table rows descriptions
            gfx_draw_filled_rect(content_x, row_y_start, 710, 24, 0x202532);
            gfx_draw_string(content_x + 10, row_y_start + 6, "PID     TASK SIGNATURE NAME     CPU WEIGHT   MEM POOL KB   DISK R/W B/S", 0x8A9FB4);

            for (uint32_t p = 0; p < 6; p++) {
                uint32_t row_y = row_y_start + 30 + (p * 32);
                if (p == g_selected_pid_index) {
                    gfx_draw_filled_rect(content_x, row_y - 4, 710, 26, 0x293242);
                }
                char r_str[128];
                snprintf(r_str, sizeof(r_str), "%-6d  %-22s  %d%%          %-12d  R:%d / W:%d",
                         g_mock_proc_table[p].pid, g_mock_proc_table[p].name, g_mock_proc_table[p].cpu_weight,
                         g_mock_proc_table[p].memory_used_kb, g_mock_proc_table[p].disk_read_bytes_sec, g_mock_proc_table[p].disk_write_bytes_sec);
                gfx_draw_string(content_x + 10, row_y, r_str, 0xFFFFFF);
            }

            // Kill Task Operation Action Command Box Button
            uint32_t kill_btn_y = MON_WIN_Y + MON_WIN_H - 60;
            gfx_draw_filled_rect(content_x, kill_btn_y, 220, 36, 0xAA3333); // Large thick crimson warning task button
            gfx_draw_string(content_x + 44, kill_btn_y + 11, "[ KILL PROCESS ]", 0xFFFFFF);
            gfx_draw_string(content_x + 240, kill_btn_y + 11, "Evicts selected sandbox queue cleanly out of active core scheduler.", 0x555A64);
            break;
        }

        case TAB_PERFORMANCE: {
            gfx_draw_string(content_x, MON_WIN_Y + 54, "REAL-TIME HARDWARE ENCLAVE PERFORMANCE DIALS:", 0x8A9FB4);
            
            // Draw 3 Massive Oversized Color-Shifting Progress Clocks Side by Side
            draw_oversized_telemetry_dial(content_x + 100, MON_WIN_Y + 160, g_sys_history.cpu_history[active_idx], "CPU LOAD");
            draw_oversized_telemetry_dial(content_x + 340, MON_WIN_Y + 160, g_sys_history.mem_history[active_idx], "RAM USAGE");
            draw_oversized_telemetry_dial(content_x + 580, MON_WIN_Y + 160, g_sys_history.gpu_history[active_idx], "vGPU MUX");

            // Wide lower trend graph showing cumulative historical tracking points
            uint32_t graph_y = MON_WIN_Y + 320;
            gfx_draw_string(content_x, graph_y - 20, "60-TICK CENTRAL SILICON PROCESSING TREND VECTOR:", 0x6E7485);
            draw_wide_telemetry_graph(content_x, graph_y, 710, 240, g_sys_history.cpu_history, 0x4A90E2);
            break;
        }

        case TAB_DISKS: {
            gfx_draw_string(content_x, MON_WIN_Y + 54, "STORAGE CONTROLLER TRANSACTION BLOCK DRIVER LOGS:", 0x8A9FB4);
            uint32_t g1_y = MON_WIN_Y + 100;
            char r_lbl[128], w_lbl[128];
            snprintf(r_lbl, sizeof(r_lbl), "PRIMARY ATA DRIVE (Port 0x1F0) READ HISTORY SPEED: %d KB/s", g_sys_history.disk_history_read[active_idx]);
            snprintf(w_lbl, sizeof(w_lbl), "PRIMARY ATA DRIVE (Port 0x1F0) WRITE HISTORY SPEED: %d KB/s", g_sys_history.disk_history_write[active_idx]);
            gfx_draw_string(content_x, g1_y - 16, r_lbl, 0x3CD070);
            draw_wide_telemetry_graph(content_x, g1_y, 710, 180, g_sys_history.disk_history_read, 0x3CD070);
            uint32_t g2_y = g1_y + 240;
            gfx_draw_string(content_x, g2_y - 16, w_lbl, 0xFFA726);
            draw_wide_telemetry_graph(content_x, g2_y, 710, 180, g_sys_history.disk_history_write, 0xFFA726);
            break;
        }

        case TAB_NETWORK: {
            gfx_draw_string(content_x, MON_WIN_Y + 54, "USER-SPACE lwIP BROADBAND INTERFACE PIPE TELEMETRY:", 0x8A9FB4);
            uint32_t n1_y = MON_WIN_Y + 100;
            char wifi_lbl[128], eth_lbl[128];
            snprintf(wifi_lbl, sizeof(wifi_lbl), "WIRELESS WLAN ADAPTER RX SPEED STREAM: %d Mbps [Dual-Stack IPv6 Active]", g_sys_history.wifi_rx_history[active_idx]);
            snprintf(eth_lbl, sizeof(eth_lbl), "WIRED ETH0 CONTROLLER TRANS-RECEIVE SPEED: %d Mbps [Link Sealed]", g_sys_history.eth_rx_history[active_idx]);
            gfx_draw_string(content_x, n1_y - 16, wifi_lbl, 0x26C6DA);
            draw_wide_telemetry_graph(content_x, n1_y, 710, 180, g_sys_history.wifi_rx_history, 0x26C6DA);
            uint32_t n2_y = n1_y + 240;
            gfx_draw_string(content_x, n2_y - 16, eth_lbl, 0x90A4AE);
            draw_wide_telemetry_graph(content_x, n2_y, 710, 180, g_sys_history.eth_rx_history, 0x90A4AE);
            break;
        }

        case TAB_USERS_SERVICES: {
            gfx_draw_string(content_x, MON_WIN_Y + 54, "MULTI-TENANT USER SPACE DAEMONS & SERVICE LEDGER:", 0x8A9FB4);
            uint32_t box_y = MON_WIN_Y + 84;
            gfx_draw_filled_rect(content_x, box_y, 710, 240, 0x161A22);
            gfx_draw_string(content_x + 16, box_y + 16, "SYSTEM SERVICE PROCESS DESIGNATIONS:", 0x6E7485);
            uint32_t svc_count = 0;
            for (uint32_t i = 0; i < 6; i++) {
                if (g_mock_proc_table[i].is_service) {
                    char svc_row[128];
                    snprintf(svc_row, sizeof(svc_row), " -> Daemon: %-16s [PID %d] assigned to Privileged Enclave 1", g_mock_proc_table[i].name, g_mock_proc_table[i].pid);
                    gfx_draw_string(content_x + 24, box_y + 44 + (svc_count * 24), svc_row, 0x4A90E2);
                    svc_count++;
                }
            }

            // Active Multi-Tenant Operator Session listings maps
            uint32_t u_box_y = box_y + 260;
            gfx_draw_filled_rect(content_x, u_box_y, 710, 180, 0x161A22);
            gfx_draw_string(content_x + 16, u_box_y + 16, "ACTIVE HIGH-VISIBILITY SECURITY USER SPACE SESSIONS:", 0x6E7485);
            extern MultiTenantControlRegistry g_user_manager;
            uint32_t u_row = 0;
            for (uint32_t u = 0; u < g_user_manager.registered_users_count; u++) {
                if (g_user_manager.user_registry[u].is_logged_in) {
                    char u_lbl[128];
                    snprintf(u_lbl, sizeof(u_lbl), " -> User Profile: %-14s [UID:%d] | Status: AUTHORIZED WORKSPACE CONTEXT ACTIVE",
                             g_user_manager.user_registry[u].username, g_user_manager.user_registry[u].uid);
                    gfx_draw_string(content_x + 24, u_box_y + 44 + (u_row * 24), u_lbl, 0x3CD070);
                    u_row++;
                }
            }
            break;
        }
    }
}

void sys_monitor_terminate_task(uint32_t target_pid) {
    if (target_pid == 0) {
        printf("[Telemetry Monitor Alert]: Aborted. System cannot evict master kernel context bootstrap.\\n");
        return;
    }
    // Direct interface invocation command loop: calls native memory walls violation handler
    // to instantly shred target process out of active execution page tables
    extern void handle_sandbox_violation(uint32_t pid, uint64_t address, bool is_write);
    handle_sandbox_violation(target_pid, 0x00000000, false);
    char audit_desc[128];
    snprintf(audit_desc, sizeof(audit_desc), "Telemetry Task Action: Terminated hostile/stalled PID %d via System Monitor Cockpit.", target_pid);
    commit_security_audit_entry(0x0003, "SYS_MONITOR", audit_desc);
    printf("[Telemetry Monitor]: %s\\n", audit_desc);
}

void process_telemetry_monitor_mouse_clicks(uint32_t mx, uint32_t my) {
    // 1. Sidebar Tab Category Switch Detection Loops
    if (mx >= MON_WIN_X && mx <= MON_WIN_X + 180) {
        for (uint32_t t = 0; t < 5; t++) {
            uint32_t tab_y = MON_WIN_Y + 56 + (t * 54);
            if (my >= tab_y - 4 && my <= tab_y + 42) {
                g_active_monitor_tab = (MonitorTabType)t;
                request_ui_composition_refresh();
                return;
            }
        }
    }

    // 2. Active Tab Interactions
    uint32_t content_x = MON_WIN_X + 180 + 16;
    if (g_active_monitor_tab == TAB_PROCESSES) {
        uint32_t row_y_start = MON_WIN_Y + 84 + 30;
        // Handle list selection clicks inside task table data grid rows
        if (mx >= content_x && mx <= content_x + 710 && my >= row_y_start && my <= row_y_start + (6 * 32)) {
            uint32_t clicked_idx = (my - row_y_start) / 32;
            if (clicked_idx < 6) {
                g_selected_pid_index = clicked_idx;
                request_ui_composition_refresh();
            }
            return;
        }

        // Intercept [ KILL PROCESS ] Action Button bounds
        uint32_t kill_btn_y = MON_WIN_Y + MON_WIN_H - 60;
        if (mx >= content_x && mx <= content_x + 220 && my >= kill_btn_y && my <= kill_btn_y + 36) {
            uint32_t targeted_pid = g_mock_proc_table[g_selected_pid_index].pid;
            sys_monitor_terminate_task(targeted_pid);
            request_ui_composition_refresh();
        }
    }
}

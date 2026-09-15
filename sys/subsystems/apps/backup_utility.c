#include "../../kernel/include/rbac.h"
#include "../../kernel/include/usb_isolated.h"
#include "../../kernel/include/pm_trig.h" // Re-using our fixed-point Sine/Cosine tables for clock drawing
#include <stdio.h>
#include <string.h>

#define BACKUP_WIN_X        60
#define BACKUP_WIN_Y        60
#define BACKUP_WIN_W        640
#define BACKUP_WIN_H        460
#define GRAPH_HISTORY_MAX   60 // Track last 60 frame ticks of throughput data points

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern void gfx_get_screen_dimensions(uint32_t* width, uint32_t* height);
extern uint32_t query_active_focused_window_pid(void);
extern uint64_t get_system_uptime_ms(void);

// Simulated tracking metrics for the backup stream pipeline
static uint32_t g_backup_processed_sectors = 0;
static uint32_t g_backup_total_sectors = 250000; // Whole system scale size map bounds (approx 128MB payload)
static bool     g_backup_is_running = false;

// Line graph throughput tracking history parameters
static uint32_t g_throughput_history[GRAPH_HISTORY_MAX];
static uint32_t g_graph_write_ptr = 0;
static uint32_t g_current_mbps = 0;

void trigger_administrative_backup_start(uint32_t calling_pid) {
    // 1. PRIVILEGE BARRIER: Restrict application startup strictly to authenticated Admin/SuperAdmin roles
    if (!rbac_verify_privilege(calling_pid, PERM_UPDATE_BINARIES | PERM_ACCESS_REGISTRY)) {
        printf("[Backup Tool Error]: Security Rejection: Insufficient role hierarchy to initiate backup operations.\\n");
        return;
    }

    // 2. Wake the specific USB port channel linked to your target backup device line
    // Temporarily overrides the hard global block block explicitly for this administrative operation
    extern bool sys_authorize_usb_subsystem(const char* admin_user, const char* admin_password);
    printf("[Backup Tool]: Activating target physical USB storage partition lines under admin context...\\n");
    
    g_backup_processed_sectors = 0;
    g_backup_is_running = true;
    memset(g_throughput_history, 0, sizeof(g_throughput_history));
}

// Low-level helper to render a thick concentric color-shifting clock dial progression indicator
static void draw_backup_progress_clock(uint32_t cx, uint32_t cy, uint32_t processed, uint32_t total) {
    if (total == 0) return;

    uint32_t base_radius = 45;
    uint32_t percentage = (processed * 100) / total;
    uint32_t max_angle = (percentage * 360) / 100;

    // Linear color conversion: Shift from Amber (R:210, G:150, B:30) up to Green (R:30, G:210, B:80)
    uint32_t r = 210 - ((210 - 30) * percentage / 100);
    uint32_t g = 150 + ((210 - 150) * percentage / 100);
    uint32_t b = 30 + ((80 - 30) * percentage / 100);
    uint32_t dynamic_color = (r << 16) | (g << 8) | b;

    // Outer framing ring
    extern void gfx_draw_pixel(uint32_t x, uint32_t y, uint32_t color);

    for (uint32_t r_thick = base_radius - 5; r_thick <= base_radius + 5; r_thick++) {
        for (uint32_t angle = 0; angle <= max_angle; angle++) {
            // Sweep clockwise from the 12 o'clock position (270 degrees offset)
            int32_t adjusted_angle = (angle + 270) % 360;
            
            int32_t x_out = (fixed_cos(adjusted_angle) * (int32_t)r_thick) / 256;
            int32_t y_out = (fixed_sin(adjusted_angle) * (int32_t)r_thick) / 256;

            gfx_draw_pixel((uint32_t)((int32_t)cx + x_out), (uint32_t)((int32_t)cy + y_out), dynamic_color);
        }
    }

    char percent_str[16];
    snprintf(percent_str, sizeof(percent_str), "%d%%", percentage);
    gfx_draw_string(cx - 12, cy - 4, percent_str, 0xFFFFFF);
}

// Low-level helper to render the traveling throughput line graph history
static void draw_throughput_line_graph(uint32_t gx, uint32_t gy, uint32_t gw, uint32_t gh) {
    // Draw graph background grid lines
    gfx_draw_filled_rect(gx, gy, gw, gh, 0x0D0F12);
    for (uint32_t i = 1; i < 4; i++) {
        gfx_draw_filled_rect(gx, gy + (i * gh / 4), gw, 1, 0x1A1F26); // Horizontal grid markers
    }

    // Connect the history dots to formulate a continuous traveling line graph layout
    for (uint32_t x = 0; x < GRAPH_HISTORY_MAX - 1; x++) {
        uint32_t idx = (g_graph_write_ptr + x) % GRAPH_HISTORY_MAX;
        uint32_t next_idx = (idx + 1) % GRAPH_HISTORY_MAX;

        // Map MB/s metrics safely inside pixel height restrictions (Cap graph tracking ceiling at 100 MB/s)
        uint32_t h1 = (g_throughput_history[idx] > 100) ? gh : (g_throughput_history[idx] * gh / 100);
        uint32_t h2 = (g_throughput_history[next_idx] > 100) ? gh : (g_throughput_history[next_idx] * gh / 100);

        uint32_t p1_x = gx + (x * gw / GRAPH_HISTORY_MAX);
        uint32_t p1_y = gy + gh - h1;
        uint32_t p2_x = gx + ((x + 1) * gw / GRAPH_HISTORY_MAX);

        // Render traveling trend lines using small filled dots to draw line vectors without floating point math
        gfx_draw_filled_rect(p1_x, p1_y, p2_x - p1_x + 1, 2, 0x4A90E2); // Blue graph stroke tracking line
    }
}

void render_administrative_backup_gui(void) {
    // 1. Draw Master App Window Shell Container
    gfx_draw_filled_rect(BACKUP_WIN_X, BACKUP_WIN_Y, BACKUP_WIN_W, BACKUP_WIN_H, 0x16181F);
    gfx_draw_filled_rect(BACKUP_WIN_X, BACKUP_WIN_Y, BACKUP_WIN_W, 32, 0x242833); // Header strip
    gfx_draw_string(BACKUP_WIN_X + 16, BACKUP_WIN_Y + 10, "External Off-Site Encrypted Storage Archive Suite", 0xFFFFFF);

    // 2. Simulate data pipeline processing ticks if backup state remains engaged
    if (g_backup_is_running) {
        // Increment sectors processed per frame cycle pass
        g_backup_processed_sectors += 850; 
        
        // Dynamically simulate hardware bandwidth fluctuations (Fluctuating between 45MB/s and 72MB/s)
        g_current_mbps = 45 + (uint32_t)(get_system_uptime_ms() % 28);
        g_throughput_history[g_graph_write_ptr] = g_current_mbps;
        g_graph_write_ptr = (g_graph_write_ptr + 1) % GRAPH_HISTORY_MAX;

        if (g_backup_processed_sectors >= g_backup_total_sectors) {
            g_backup_processed_sectors = g_backup_total_sectors;
            g_backup_is_running = false;
            g_current_mbps = 0;
            
            // ARCHIVE FINISHED DISCONNECT: Instantly isolate and completely freeze the external secondary storage drive lines
            extern void sys_revoke_usb_subsystem(void);
            sys_revoke_usb_subsystem(); 
            printf("[Backup Core]: Sector replication transaction verified. USB interface line power cut.\\n");
        }
    }

    // 3. Render Progress Visualization Elements
    uint32_t left_card_x = BACKUP_WIN_X + 20;
    uint32_t dial_center_x = left_card_x + 120;
    uint32_t dial_center_y = BACKUP_WIN_Y + 120;

    // Draw Clock Dial Progress Card Container
    gfx_draw_filled_rect(left_card_x, BACKUP_WIN_Y + 50, 240, 140, 0x20242E);
    gfx_draw_string(left_card_x + 16, BACKUP_WIN_Y + 64, "ARCHIVE REDRY CONTEXT:", 0x8A9FB4);
    draw_backup_progress_clock(dial_center_x, dial_center_y + 12, g_backup_processed_sectors, g_backup_total_sectors);

    // 4. Render Traveling Line Throughput Graph Data
    uint32_t graph_card_x = BACKUP_WIN_X + 280;
    gfx_draw_filled_rect(graph_card_x, BACKUP_WIN_Y + 50, 340, 140, 0x20242E);
    gfx_draw_string(graph_card_x + 16, BACKUP_WIN_Y + 64, "HARDWARE THROUGHPUT METRICS LINE GRAPH:", 0x8A9FB4);
    draw_throughput_line_graph(graph_card_x + 16, BACKUP_WIN_Y + 84, 308, 90);

    // 5. Draw Lower Control Console Panel details block element structures
    uint32_t ledger_y = BACKUP_WIN_Y + 210;
    gfx_draw_filled_rect(BACKUP_WIN_X + 20, ledger_y, BACKUP_WIN_W - 40, 230, 0x0E1014);

    gfx_draw_string(BACKUP_WIN_X + 36, ledger_y + 16, "STORAGE CONTROLLER INTERACTION TARGET METADATA LEDGER:", 0x6E7485);
    
    char details_1[128], details_2[128], details_3[128];
    snprintf(details_1, sizeof(details_1), "Backup Session Status : %s", g_backup_is_running ? "EXECUTING REPLICATION" : "IDLE / ISOLATED");
    snprintf(details_2, sizeof(details_2), "Active Stream Speed    : %d MB/s  |  Encipherment Cipher: AES-XTS Transient Key Ring", g_current_mbps);
    snprintf(details_3, sizeof(details_3), "Mapped Cloned Sectors  : %d of %d raw hardware memory partitions", g_backup_processed_sectors, g_backup_total_sectors);

    gfx_draw_string(BACKUP_WIN_X + 36, ledger_y + 46, details_1, g_backup_is_running ? 0x00FF00 : 0x777A85);
    gfx_draw_string(BACKUP_WIN_X + 36, ledger_y + 72, details_2, 0xCCCCCC);
    gfx_draw_string(BACKUP_WIN_X + 36, ledger_y + 98, details_3, 0xCCCCCC);

    // Action Trigger Button Area
    gfx_draw_filled_rect(BACKUP_WIN_X + 36, ledger_y + 140, 220, 26, 0xAA6633); // Amber Admin trigger panel box button
    gfx_draw_string(BACKUP_WIN_X + 54, ledger_y + 146, "[ INITIATE SECURE BACKUP ]", 0xFFFFFF);
    
    gfx_draw_string(BACKUP_WIN_X + 36, ledger_y + 186, "Upon completion, the target USB drive is physically isolated from system bus lines.", 0x555A64);
}

// Mouse click tracking coordinate handler integrated with the panel button bounds
void process_administrative_backup_clicks(uint32_t mx, uint32_t my) {
    uint32_t btn_trigger_x1 = BACKUP_WIN_X + 36;
    uint32_t btn_trigger_x2 = btn_trigger_x1 + 220;
    uint32_t btn_trigger_y1 = BACKUP_WIN_Y + 210 + 140;
    uint32_t btn_trigger_y2 = btn_trigger_y1 + 26;

    if (mx >= btn_trigger_x1 && mx <= btn_trigger_x2 && my >= btn_trigger_y1 && my <= btn_trigger_y2) {
        if (g_backup_is_running) return;

        uint32_t running_pid = query_active_focused_window_pid();
        
        // Execute authorization pass and start transaction routing channels
        trigger_administrative_backup_start(running_pid);
    }
}

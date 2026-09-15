#include "../../kernel/include/installer_tool.h"
#include <stdio.h>
#include <stdbool.h>

#define INST_TERM_X 80
#define INST_TERM_Y 80

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);

void run_interactive_installation_sequence(void) {
    // 1. Query physical CPUID leaves to auto-detect hardware topology profiles
    sys_probe_hardware_topology();

    // 2. Execute partition mapping based on spec inputs (e.g., allocating a balanced 100GB Windows / 140GB Linux slice)
    sys_execute_drive_partitioning(100 /* Windows GB */, 140 /* Linux GB */);

    // 3. Serialize boot sector loaders and commit dynamic affinity masks
    sys_deploy_system_binaries();
}

void render_installer_terminal_wizard(void) {
    // 1. Intercept drawing pass if the running platform installation has already been completed and locked
    if (query_installation_sealed_status()) {
        // Return blank screens or do not render window layers to keep the setup utility invisible post-boot
        return; 
    }

    gfx_draw_filled_rect(INST_TERM_X, INST_TERM_Y, 480, 240, 0x0A0F14);
    gfx_draw_filled_rect(INST_TERM_X, INST_TERM_Y, 480, 28, 0x1C222D);
    gfx_draw_string(INST_TERM_X + 16, INST_TERM_Y + 8, "Bare-Metal Microkernel Installation Console", 0xFFFFFF);

    gfx_draw_string(INST_TERM_X + 24, INST_TERM_Y + 48, "Target Disk: Primary ATA Host (Port 0x1F0) [GPT Protective MBR]", 0x8A9FB4);
    gfx_draw_string(INST_TERM_X + 24, INST_TERM_Y + 76, "  -> Slice 0: /sys/boot/uefi.efi  [FAT32 System Allocation Block]", 0xCCCCCC);
    gfx_draw_string(INST_TERM_X + 24, INST_TERM_Y + 98, "  -> Slice 1: PERSONALITY_WINDOWS [100 GB Whole-Drive Encrypted]", 0xCCCCCC);
    gfx_draw_string(INST_TERM_X + 24, INST_TERM_Y + 120, "  -> Slice 2: PERSONALITY_LINUX   [140 GB Whole-Drive Encrypted]", 0xCCCCCC);

    gfx_draw_filled_rect(INST_TERM_X + 24, INST_TERM_Y + 160, 180, 24, 0x227744);
    gfx_draw_string(INST_TERM_X + 36, INST_TERM_Y + 166, "[ DEPLOY ARCHITECTURE ]", 0xFFFFFF);
}

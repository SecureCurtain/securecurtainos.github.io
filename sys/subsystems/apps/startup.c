#include <stdbool.h>
#include <stdio.h>
#include <string.h>
#include "startup_ipc.h"

#define STARTUP_SERVICE_PID 9

// Hardcoded baseline inventory repository of system applications
static startup_item_t startup_registry[MAX_STARTUP_ITEMS] = {
    { 101, "File System Router",   "/system/bin/vfs.bin",     1 },
    { 102, "Network Stack Server",  "/system/bin/network.bin", 1 },
    { 103, "Firewall Logging GUI",  "/system/bin/fw_logger.bin",0 },
    { 104, "HIPS Alert Monitor",    "/system/bin/hips_gui.bin", 0 },
    { 105, "Desktop File Manager",  "/system/bin/explorer.bin", 1 }
};

static uint32_t total_registered_items = 5;

// Mock function linking down to your core microkernel scheduler capability
extern void native_spawn_process_from_path(const char* path);
extern void native_ipc_receive_message(uint32_t target_pid, void* packet);
extern void native_ipc_reply_message(uint64_t client_pid, void* packet);
extern int32_t invoke_subsystem_process(const char* daemon_path, const char* app_path, const char* flags);

/**
 * Iterates through the tracking matrix and launches all active components sequentially.
 */
static void execute_startup_sequence(void) {
    for (uint32_t i = 0; i < total_registered_items; i++) {
        if (startup_registry[i].is_enabled == 1) {
            // Invoke the microkernel task manager to spin up a new sandboxed worker ring
            native_spawn_process_from_path(startup_registry[i].binary_path);
        }
    }
}

// === CHRONOLOGICAL DAEMON STARTUP CHAIN BLOCK ===
void initialize_desktop_subsystems(void) {
    // Existing daemons (input.bin, network.bin, installer_zone.bin, etc.) are launched here...
    
    printf("[Startup Core]: Spawning Custom Installer Widget Drop-Zone...\n");
    invoke_subsystem_process("/sys/bin/installer_zone.bin", NULL, "--background-sticky");

    printf("[Startup Core]: Activating Lockscreen Screen Overlay & Power Policy Monitors...\n");
    invoke_subsystem_process("/sys/bin/lock_screen.bin", NULL, "--daemon-persistent");
}

/**
 * Main Thread Loop for startup.bin (Running as PID 9 in Ring 3)
 */
void startup_daemon_main_loop(void) {
    startup_ipc_packet_t incoming_packet;
    startup_ipc_packet_t output_response;

    while (true) {
        // Block thread natively until the microkernel delivers a startup allocation instruction
        native_ipc_receive_message(STARTUP_SERVICE_PID, &incoming_packet);

        switch (incoming_packet.message_type) {

            case STARTUP_CMD_GET_ITEMS: {
                // Bulk-transfer the current registry state array to the requesting GUI client
                output_response.message_type = STARTUP_CMD_GET_ITEMS;
                memcpy(output_response.payload, startup_registry, sizeof(startup_registry));
                
                native_ipc_reply_message(incoming_packet.sender_pid, &output_response);
                break;
            }

            case STARTUP_CMD_TOGGLE_ITEM: {
                uint32_t target_id = *(uint32_t*)incoming_packet.payload;
                
                // Trace and locate the target program ID to invert its initialization state flag
                for (uint32_t i = 0; i < total_registered_items; i++) {
                    if (startup_registry[i].program_id == target_id) {
                        startup_registry[i].is_enabled = (startup_registry[i].is_enabled == 1) ? 0 : 1;
                        break;
                    }
                }
                
                // Return simple ack packet back to unblock the UI framework call
                output_response.message_type = STARTUP_CMD_TOGGLE_ITEM;
                native_ipc_reply_message(incoming_packet.sender_pid, &output_response);
                break;
            }

            case STARTUP_CMD_TRIGGER_BOOT: {
                // Invoked by your session logon system (e.g. init.bin) upon a successful login verification
                if (incoming_packet.sender_pid == 6) { // Only trust the authentication manager (PID 6)
                    execute_startup_sequence();
                    initialize_desktop_subsystems();
                }
                break;
            }
        }
    }
}

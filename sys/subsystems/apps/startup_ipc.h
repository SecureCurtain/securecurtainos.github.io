#pragma once
#include <stdint.h>

// Unique IPC Command IDs
#define STARTUP_CMD_GET_ITEMS    0x801
#define STARTUP_CMD_TOGGLE_ITEM  0x802
#define STARTUP_CMD_TRIGGER_BOOT 0x803

#define MAX_STARTUP_ITEMS 16
#define MAX_PATH_LEN      64
#define MAX_NAME_LEN      32

// Binary structure mapping an individual startup item
typedef struct {
    uint32_t program_id;
    char     display_name[MAX_NAME_LEN];
    char     binary_path[MAX_PATH_LEN];
    uint8_t  is_enabled; // 1 = Automatically launch at boot, 0 = Disabled
} startup_item_t;

// Sized IPC packet payload capable of transporting full startup registry items
typedef struct {
    uint32_t message_type;
    uint64_t sender_pid;
    uint8_t  payload[sizeof(startup_item_t) * MAX_STARTUP_ITEMS];
} startup_ipc_packet_t;

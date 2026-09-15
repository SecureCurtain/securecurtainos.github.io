#pragma once
#include <stdint.h>
#include <stdbool.h>

#define HOTKEY_MAX_REGISTRATIONS 32
#define HOTKEY_MAGIC_TAG         0x484B4559 // "HKEY" binary tracking tag

// Modifier Flag Bitmasks
#define MOD_NONE    0x00
#define MOD_ALT     0x01
#define MOD_CTRL    0x02
#define MOD_SHIFT   0x04
#define MOD_WIN     0x08

// Dynamic System Action Callback Handlers Identifiers
typedef enum {
    ACT_EVICT_WINDOW = 1,
    ACT_LOCK_DISPLAY,
    ACT_SYS_SHUTDOWN,
    ACT_LAUNCH_CHAT,
    ACT_LAUNCH_MAP,
    ACT_CYCLE_CLIPBOARD,
    ACT_USER_CUSTOM
} HotKeyActionType;

// Structural layout for a single hot-key registration map slot
typedef struct {
    uint8_t          modifier_mask;
    uint8_t          target_scancode;
    HotKeyActionType action_type;
    uint32_t         custom_param; // Can be used to store target process PIDs or custom options
    bool             is_active;
} HotKeyBindingNode;

typedef struct {
    uint32_t          magic;
    HotKeyBindingNode bindings[HOTKEY_MAX_REGISTRATIONS];
    uint32_t          total_registered_bindings;
    uint8_t           current_hardware_modifiers; // Active real-time tracker for Alt/Ctrl/Shift state flags
} SecureHotKeyRegistry;

// Microkernel System Level Shortcut Mappings
void init_global_hotkey_manager(void);
bool register_custom_system_hotkey(uint8_t modifiers, uint8_t scancode, HotKeyActionType action, uint32_t param);
bool process_scancode_through_hotkey_intercept(uint8_t scancode, bool is_pressed);
void dispatch_hotkey_system_action(HotKeyActionType action, uint32_t param);
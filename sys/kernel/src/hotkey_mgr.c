#include "hotkey_mgr.h"
#include "kbd_shield.h"
#include "security_panic.h"
#include <string.h>
#include <stdio.h>

static SecureHotKeyRegistry g_hotkey_manager;

// Forward references to your existing system containment triggers
extern void lock_system_display(void);
extern int32_t sys_power_management(uint32_t state);
extern void handle_sandbox_violation(uint32_t pid, uint64_t address, bool is_write);

void init_global_hotkey_manager(void) {
    memset(&g_hotkey_manager, 0, sizeof(SecureHotKeyRegistry));
    g_hotkey_manager.magic = HOTKEY_MAGIC_TAG;
    g_hotkey_manager.total_registered_bindings = 0;
    g_hotkey_manager.current_hardware_modifiers = MOD_NONE;

    printf("[Kernel Hot-Keys]: Native hardware keyboard shortcut routing grid online.\\n");

    // =========================================================================
    // PROVISION AND REGISTRATION OF THE CHRONOLOGICAL STANDARD SYSTEM HOT-KEYS
    // =========================================================================
    // Scancodes mapped: 0x1E = 'A', 0x2E = 'C', 0x30 = 'B', 0x20 = 'D', 0x19 = 'P', 0x12 = 'E'
    
    // 1. Ctrl + Alt + Delete -> Hard Shutdown Command Intercept
    register_custom_system_hotkey(MOD_CTRL | MOD_ALT, 0x53, ACT_SYS_SHUTDOWN, 4 /* POWER_STATE_OFF */);
    
    // 2. Win + L -> Instant Display Lockdown & Session Isolation
    register_custom_system_hotkey(MOD_WIN, 0x26, ACT_LOCK_DISPLAY, 0);
    
    // 3. Ctrl + Shift + C -> Spawn Private VPN Chat Overlay
    register_custom_system_hotkey(MOD_CTRL | MOD_SHIFT, 0x2E, ACT_LAUNCH_CHAT, 106 /* Chat PID */);
    
    // 4. Ctrl + Shift + M -> Bring Up Global Time Zone Map Dashboard
    register_custom_system_hotkey(MOD_CTRL | MOD_SHIFT, 0x32, ACT_LAUNCH_MAP, 107 /* Map PID */);
    
    // 5. Ctrl + Alt + K -> Emergency Sandboxed Application Eviction Kill Command
    register_custom_system_hotkey(MOD_CTRL | MOD_ALT, 0x25, ACT_EVICT_WINDOW, 0 /* Context Evict */);
    
    // 6. Ctrl + Shift + V -> Cycle Through the 5-Action Encrypted Clipboard History Ring
    register_custom_system_hotkey(MOD_CTRL | MOD_SHIFT, 0x2F, ACT_CYCLE_CLIPBOARD, 0);
}

bool register_custom_system_hotkey(uint8_t modifiers, uint8_t scancode, HotKeyActionType action, uint32_t param) {
    if (g_hotkey_manager.total_registered_bindings >= HOTKEY_MAX_REGISTRATIONS) return false;

    // Check for pre-existing binding overrides to update maps cleanly
    for (uint32_t i = 0; i < g_hotkey_manager.total_registered_bindings; i++) {
        if (g_hotkey_manager.bindings[i].is_active && 
            g_hotkey_manager.bindings[i].modifier_mask == modifiers && 
            g_hotkey_manager.bindings[i].target_scancode == scancode) {
            
            g_hotkey_manager.bindings[i].action_type = action;
            g_hotkey_manager.bindings[i].custom_param = param;
            return true;
        }
    }

    HotKeyBindingNode* node = &g_hotkey_manager.bindings[g_hotkey_manager.total_registered_bindings];
    node->modifier_mask = modifiers;
    node->target_scancode = scancode;
    node->action_type = action;
    node->custom_param = param;
    node->is_active = true;

    g_hotkey_manager.total_registered_bindings++;
    printf("[Hot-Key Config]: Bound Shortcut Matrix (Modifiers: 0x%02X, Scancode: 0x%02X -> Action: %d)\\n", modifiers, scancode, action);
    return true;
}

bool process_scancode_through_hotkey_intercept(uint8_t scancode, bool is_pressed) {
    // 1. Maintain hardware modifier state flags dynamically inside the interrupt cycle
    // Standard keyboard modifier scancodes: Left Ctrl=0x1D, Left Shift=0x2A, Left Alt=0x38, Left Win=0x5B
    if (scancode == 0x1D) {
        if (is_pressed) g_hotkey_manager.current_hardware_modifiers |= MOD_CTRL;
        else            g_hotkey_manager.current_hardware_modifiers &= ~MOD_CTRL;
        return false; 
    }
    if (scancode == 0x38) {
        if (is_pressed) g_hotkey_manager.current_hardware_modifiers |= MOD_ALT;
        else            g_hotkey_manager.current_hardware_modifiers &= ~MOD_ALT;
        return false;
    }
    if (scancode == 0x2A) {
        if (is_pressed) g_hotkey_manager.current_hardware_modifiers |= MOD_SHIFT;
        else            g_hotkey_manager.current_hardware_modifiers &= ~MOD_SHIFT;
        return false;
    }
    if (scancode == 0x5B) {
        if (is_pressed) g_hotkey_manager.current_hardware_modifiers |= MOD_WIN;
        else            g_hotkey_manager.current_hardware_modifiers &= ~MOD_WIN;
        return false;
    }

    // Discard evaluations on key releases to prevent double-firing shortcuts
    if (!is_pressed) return false;

    // 2. Scan active registrations matrix list for a shortcut match
    for (uint32_t i = 0; i < g_hotkey_manager.total_registered_bindings; i++) {
        HotKeyBindingNode* node = &g_hotkey_manager.bindings[i];
        
        if (node->is_active && 
            node->modifier_mask == g_hotkey_manager.current_hardware_modifiers && 
            node->target_scancode == scancode) {
            
            // Match confirmed! Route execution parameters and interrupt input path
            dispatch_hotkey_system_action(node->action_type, node->custom_param);
            return true; // True tells the keyboard shield to swallow the scancode so apps don't type it
        }
    }

    return false; // No shortcut match; pass input along normally to sandboxed text fields
}

void dispatch_hotkey_system_action(HotKeyActionType action, uint32_t param) {
    printf("[Hot-Key Intercept]: Executing secure Ring 0 action sequence ID: %d\\n", action);

    switch (action) {
        case ACT_SYS_SHUTDOWN:
            sys_power_management(param); // Direct access to kernel power routines
            break;

        case ACT_LOCK_DISPLAY:
            lock_system_display(); // Force instant display overlay lockout
            break;

        case ACT_LAUNCH_CHAT:
            // Inter-Process signaling to force visibility context to your secure VPN chat window
            printf("[Hot-Key Router]: Restoring visibility focus context to Secure Chat client.\\n");
            break;

        case ACT_LAUNCH_MAP:
            // Inter-Process signaling to maximize your Global Time Zone Map Console
            printf("[Hot-Key Router]: Restoring visibility focus context to Timezone Vector Map.\\n");
            break;

        case ACT_EVICT_WINDOW: {
            extern uint32_t query_active_focused_window_pid(void);
            uint32_t culprit_pid = query_active_focused_window_pid();
            if (culprit_pid > 0) {
                printf("[Emergency Kill]: Hot-key eviction triggered against misbehaving process PID %d\\n", culprit_pid);
                // Force a sandbox eviction trap to immediately clear process contexts from thread scheduling queues
                handle_sandbox_violation(culprit_pid, 0x0000000000000000 /* Explicit termination signal */, false);
            }
            break;
        }

        case ACT_CYCLE_CLIPBOARD:
            // Instructs your Encrypted Clipboard manager to iterate index layers for your next paste action
            printf("[Hot-Key Router]: Cycling encrypted clipboard pointer focus to historical slot.\\n");
            break;

        case ACT_USER_CUSTOM:
            printf("[Hot-Key Router]: Invoking custom registered hook vector ID %d\\n", param);
            break;
    }
}

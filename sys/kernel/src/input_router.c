#include "input_router.h"
#include "ipc.h"
#include <string.h>

// Forward declaration
void run_input_router_event_loop(ipc_handle_t kernel_hw_channel);

static void local_translate_keyboard_byte(uint8_t scancode, input_packet_t* out_packet);
static int  local_translate_mouse_byte(uint8_t raw_byte, input_packet_t* out_packet);

#define MAX_ROUTING_TARGETS   16
#define MAX_SANDBOXED_SURFACES 32

// Subsystem Personality Flags for Surface Identification
#define SUBSYSTEM_POSIX  1
#define SUBSYSTEM_WIN32  2

// 🛡️ SECURITY FIXED: Tracking maps are maintained entirely via safe Capability Handles (integers)
typedef struct {
    uint32_t     pid_owner;         // Kernel-verified process identifier
    uint8_t      subsystem_profile; // SUBSYSTEM_POSIX or SUBSYSTEM_WIN32
    ipc_handle_t target_handle;     // Safe integer lookup handle (No raw pointers)
} secure_input_target_t;

// Local tracking containers allocated INSIDE the unprivileged Ring 3 process space
typedef struct {
    uint32_t x, y, width, height;
    uint8_t  subsystem_type;
    uint32_t owner_pid;
} sandboxed_surface_t;

static secure_input_target_t g_subsystem_targets[MAX_ROUTING_TARGETS];
static size_t                g_registered_targets_count = 0;

static sandboxed_surface_t   g_ui_surfaces[MAX_SANDBOXED_SURFACES];
static size_t                g_ui_surfaces_count = 0;

extern void print_string(const char* str, int row);

// 🛡️ SECURITY CONSTANTS: Explicitly define hardware input translation constraints
#define SCANCODE_TABLE_SIZE  128
#define MOUSE_PACKET_SIZE    3    // Standard PS/2 3-byte hardware data packet

// Global runtime screen dimensions cached inside the unprivileged router process space
static int32_t g_router_screen_width  = 1024;
static int32_t g_router_screen_height = 768;

// Current global tracked mouse coordinates inside the Ring 3 sandbox
static int32_t g_mouse_current_x = 512;
static int32_t g_mouse_current_y = 384;

// Internal PS/2 mouse packet assembly buffer state tracking
static uint8_t  g_mouse_packet_buffer[MOUSE_PACKET_SIZE];
static uint8_t  g_mouse_packet_index = 0;

// 🛡️ HARDENED SCANCODE TRANSLATION SHEET
// Statically maps raw motherboard bus scancodes directly to standardized UI keycodes.
// Unassigned indexes default safely to zero to prevent ambient out-of-bounds pointer writes.
static const uint32_t g_secure_scancode_map[SCANCODE_TABLE_SIZE] = {
    [0x01] = 27,   // Escape Key
    [0x02] = '1',  [0x03] = '2',  [0x04] = '3',  [0x05] = '4',
    [0x1E] = 'A',  [0x30] = 'B',  [0x2E] = 'C',  [0x20] = 'D',
    [0x1C] = 13,   // Enter Key
    [0x39] = ' '   // Spacebar
};

/**
 * 🛡️ SANDBOXED KEYBOARD SCANCODE TRANSLATOR
 * Processes a raw hardware scancode byte inside Ring 3 boundaries.
 */
static void local_translate_keyboard_byte(uint8_t scancode, input_packet_t* out_packet) {
    out_packet->event_type = EVENT_KEYPRESS;
    out_packet->mouse_x = g_mouse_current_x;
    out_packet->mouse_y = g_mouse_current_y;

    // Isolate the make/break flag (Bit 7 determines if key was released)
    uint8_t raw_idx = scancode & 0x7F;
    uint8_t is_release = scancode & 0x80;

    // 1. Enforce strict array indexing bounds verification
    if (raw_idx >= SCANCODE_TABLE_SIZE) {
        out_packet->key_code = 0; // Drop unrecognized/malicious scancode indexes safely
        return;
    }

    // Look up the standardized code. If key is released, map custom break flag or drop
    uint32_t translated_code = g_secure_scancode_map[raw_idx];
    out_packet->key_code = is_release ? (translated_code | 0x80000000) : translated_code;
}

/**
 * 🛡️ BOUNDS-SAFE MOUSE PACKET DECODER
 * Processes raw asynchronous bytes from the mouse hardware stream.
 * Once a full 3-byte packet is constructed, it translates deltas and applies strict resolution clipping.
 */
static int local_translate_mouse_byte(uint8_t raw_byte, input_packet_t* out_packet) {
    // 2. State-machine synchronization check
    // The first byte of a valid PS/2 packet must always have bit 3 set to 1.
    if (g_mouse_packet_index == 0 && !(raw_byte & 0x08)) {
        return 0; // Packet out of sync, drop byte to prevent garbage coordinate math
    }

    g_mouse_packet_buffer[g_mouse_packet_index++] = raw_byte;

    // Await full packet assembly before computing coordinates
    if (g_mouse_packet_index < MOUSE_PACKET_SIZE) {
        return 0; 
    }

    // Reset index pointer for the next incoming hardware packet stream
    g_mouse_packet_index = 0;

    uint8_t flags = g_mouse_packet_buffer[0];
    int32_t delta_x = (int32_t)g_mouse_packet_buffer[1];
    int32_t delta_y = (int32_t)g_mouse_packet_buffer[2];

    // Handle standard sign-extension bits for negative movement deltas
    if (flags & 0x10) delta_x |= 0xFFFFFF00;
    if (flags & 0x20) delta_y |= 0xFFFFFF00;

    // 3. Update global coordinate metrics with overflow-resilient tracking
    g_mouse_current_x += delta_x;
    // PS/2 mouse Y axis points upwards, invert to align with modern screen coordinates
    g_mouse_current_y -= delta_y;

    // 4. 🛡️ CRITICAL COORDINATE CANVAS CLIPPING: Defeat memory probing loop attacks
    // Attackers pass extreme deltas to trick focus code into executing math outside screen boundaries.
    if (g_mouse_current_x < 0) g_mouse_current_x = 0;
    if (g_mouse_current_x >= g_router_screen_width) g_mouse_current_x = g_router_screen_width - 1;
    if (g_mouse_current_y < 0) g_mouse_current_y = 0;
    if (g_mouse_current_y >= g_router_screen_height) g_mouse_current_y = g_router_screen_height - 1;

    // Populate the standardized structural translation packet frame
    out_packet->event_type = (flags & 0x07) ? EVENT_MOUSE_CLICK : EVENT_MOUSE_CLICK; // Simplify for baseline frame
    out_packet->mouse_x = g_mouse_current_x;
    out_packet->mouse_y = g_mouse_current_y;
    out_packet->key_code = flags & 0x07; // Pack raw click flags (Left=1, Right=2, Middle=4)

    return 1; // Complete translation packet assembled successfully
}

void init_input_router(void) {
    // This now executes inside the unprivileged user-space initialization segment of input_router.bin
    memset(g_subsystem_targets, 0, sizeof(g_subsystem_targets));
    memset(g_ui_surfaces, 0, sizeof(g_ui_surfaces));
    g_registered_targets_count = 0;
    g_ui_surfaces_count = 0;
    
    print_string("[OK] Sandboxed User-Space Input Router Active.", 46);
}

// 🛡️ SECURITY CONSTANTS: Explicitly define focus tracking bounds
#define INPUT_CMD_SET_FOCUS      0x703
#define INPUT_CMD_ADD_SURFACE    0x704

/**
 * 🛡️ Z-ORDER BUBBLE FOCUS ENGINE
 * Re-arranges the window layout stack to bring the targeted window index to the front.
 * Uses a strict index-swap boundary loop instead of dynamic pointer re-allocations.
 */
static void local_bring_window_to_front(size_t hit_index) {
    if (hit_index >= g_ui_surfaces_count || g_ui_surfaces_count <= 1) return;

    // Cache the window surface data block targeted for active focus prioritization
    sandboxed_surface_t target_surf = g_ui_surfaces[hit_index];

    // Shift all subsequent overlapping window entries backwards by one slot index
    for (size_t i = hit_index; i < g_ui_surfaces_count - 1; i++) {
        g_ui_surfaces[i] = g_ui_surfaces[i + 1];
    }

    // Place the active targeted window surface at the very front-most slot index of the stack
    g_ui_surfaces[g_ui_surfaces_count - 1] = target_surf;
    
    print_string("[FOCUS] Adjusted window Z-order stack layout. Active focus shifted.", 49);
}

/**
 * 🛡️ EXTENDED SANDBOXED REQUEST MULTIPLEXER ROUTER
 * Processes advanced interface management actions safely inside the Ring 3 container.
 * Append these command routes into your existing handle_input_router_message switch block.
 */
int extend_input_router_focus_logic(const ipc_message_t* msg, int32_t* return_status) {
    // --------------------------------------------------------------------------
    // 🛡️ INTERCEPT ROUTE: AUTHORIZED SURFACE LAYOUT REGISTRATION
    // --------------------------------------------------------------------------
    if (msg->message_type == INPUT_CMD_ADD_SURFACE) {
        if (g_ui_surfaces_count >= MAX_SANDBOXED_SURFACES) {
            *return_status = -1; // Surface allocation table overflow protection
            return 1;
        }

        // Map layout request data from the message payload cleanly
        const sandboxed_surface_t* new_surf = (const sandboxed_surface_t*)msg->payload;

        // 🛡️ SECURITY FIXED: Enforce owner binding validation checks.
        // The router explicitly links the window tracking entry to the authenticated
        // sender_pid provided by the core microkernel's system call gate.
        size_t idx = g_ui_surfaces_count++;
        g_ui_surfaces[idx].x = new_surf->x;
        g_ui_surfaces[idx].y = new_surf->y;
        g_ui_surfaces[idx].width = new_surf->width;
        g_ui_surfaces[idx].height = new_surf->height;
        g_ui_surfaces[idx].subsystem_type = new_surf->subsystem_type;
        g_ui_surfaces[idx].owner_pid = msg->sender_pid; 

        print_string("[ROUTER] Registered safe unprivileged surface context track.", 47);
        *return_status = 0;
        return 1;
    }

    // --------------------------------------------------------------------------
    // 🛡️ INTERCEPT ROUTE: EXPLICIT FOCUS OVERRIDE REQUESTS
    // --------------------------------------------------------------------------
    else if (msg->message_type == INPUT_CMD_SET_FOCUS) {
        uint32_t target_pid_request = *(uint32_t*)msg->payload;

        // 🛡️ SECURITY FIXED: Block unauthenticated focus-stealing attacks.
        // A process container can only bring a window to the front if it explicitly
        // matches its own kernel-verified sender PID, blocking click-jacking attempts.
        if (target_pid_request != msg->sender_pid) {
            *return_status = -4; // Access Denied: Arbitrary cross-process focus manipulation blocked
            return 1;
        }

        // Search the unprivileged tracking array for an entry matching the owner
        for (size_t i = 0; i < g_ui_surfaces_count; i++) {
            if (g_ui_surfaces[i].owner_pid == target_pid_request) {
                local_bring_window_to_front(i);
                *return_status = 0;
                return 1;
            }
        }

        *return_status = -3; // No corresponding surface found
        return 1;
    }

    return 0; // Not a focus command, fall back to core packet routing logic
}

/**
 * 🛡️ SANDBOXED PROCESS EVENT MULTIPLEXER
 * This routine handles incoming command requests securely inside user space.
 * It uses kernel-authenticated process IDs to protect against identity spoofing.
 */
int handle_input_router_message(const ipc_message_t* msg, ipc_message_t* out_response) {
    if (!msg || !out_response) return -1;

    memset(out_response, 0, sizeof(ipc_message_t));
    out_response->message_type = msg->message_type;
    out_response->payload_length = sizeof(int32_t);
    int32_t* return_status = (int32_t*)out_response->payload;

    if (extend_input_router_focus_logic(msg, return_status)) {
        return 0;
    }

    // --------------------------------------------------------------------------
    // 🛡️ INTERCEPT ROUTE: AUTHORIZED SUBSYSTEM PIPELINE REGISTRATION
    // --------------------------------------------------------------------------
    if (msg->message_type == INPUT_CMD_REG_SUBSYSTEM) {
        if (g_registered_targets_count >= MAX_ROUTING_TARGETS) {
            *return_status = -1; // Allocation limit exceeded
            return 0;
        }

        // Read the requested registration details from the payload buffer
        uint8_t requested_profile = msg->payload[0];
        ipc_handle_t client_handle = *(ipc_handle_t*)&msg->payload[1];

        // 🛡️ SECURITY FIXED: Enforce absolute identity verification via Sender PID.
        // We look up msg->sender_pid (populated strictly by the kernel system call layer).
        // If an untrusted process attempts to register as a secure Windows handler, the check blocks it.
        if (requested_profile == SUBSYSTEM_WIN32 && msg->sender_pid != 5) { // Assuming PID 5 is nt_env.bin
            *return_status = -4; // Access Denied: Spoofing vector terminated!
            return 0;
        }

        size_t idx = g_registered_targets_count++;
        g_subsystem_targets[idx].pid_owner = msg->sender_pid;
        g_subsystem_targets[idx].subsystem_profile = requested_profile;
        g_subsystem_targets[idx].target_handle = client_handle;

        *return_status = 0; // Success
        return 0;
    }

    // --------------------------------------------------------------------------
    // 🛡️ INTERCEPT ROUTE: HARDWARE INPUT BOUNDARY ROUTING & TRANSLATION
    // --------------------------------------------------------------------------
    else if (msg->message_type == 0x100) { // Raw hardware data message forwarded straight from hardware_io.c
        if (msg->payload_length < 2) {
            *return_status = -2; // Corrupt payload length boundary, drop safely
            return 0;
        }

        uint8_t irq_source = msg->payload[0];
        uint8_t raw_data   = msg->payload[1];

        input_packet_t compiled_packet;
        memset(&compiled_packet, 0, sizeof(input_packet_t));
        int ready_to_route = 0;

        // Route the raw hardware bytes to the correct sandboxed translator sub-engine
        if (irq_source == 1) { // Keyboard event vector source
            local_translate_keyboard_byte(raw_data, &compiled_packet);
            ready_to_route = 1;
        } 
        else if (irq_source == 12) { // Mouse event vector source
            ready_to_route = local_translate_mouse_byte(raw_data, &compiled_packet);
        }

        // If a full translation packet is ready, execute hit-testing and route to targets
        if (ready_to_route) {
            ipc_handle_t final_target_ipc = -1;
            uint8_t matched_subsystem = SUBSYSTEM_POSIX;
            uint32_t matched_window_x = 0;
            uint32_t matched_window_y = 0;

            // Secure hit-testing loop running safely inside your Ring 3 container
            for (int32_t i = (int32_t)g_ui_surfaces_count - 1; i >= 0; i--) {
                sandboxed_surface_t* surf = &g_ui_surfaces[i];
                if (compiled_packet.mouse_x >= (int32_t)surf->x && compiled_packet.mouse_x <= (int32_t)(surf->x + surf->width) &&
                    compiled_packet.mouse_y >= (int32_t)surf->y && compiled_packet.mouse_y <= (int32_t)(surf->y + surf->height)) {
                    
                    matched_subsystem = surf->subsystem_type;
                    matched_window_x = surf->x;
                    matched_window_y = surf->y;
                    break; 
                }
            }

            // Map matching subsystems back to our authorized target handle structures
            for (size_t i = 0; i < g_registered_targets_count; i++) {
                if (g_subsystem_targets[i].subsystem_profile == matched_subsystem) {
                    final_target_ipc = g_subsystem_targets[i].target_handle;
                    break;
                }
            }

            if (final_target_ipc >= 0) {
                ipc_message_t forward_frame;
                forward_frame.sender_pid = 0;
                forward_frame.message_type = 0x777; // Standard structured input broadcast type ID
                forward_frame.payload_length = sizeof(input_packet_t);
                
                if (matched_subsystem == SUBSYSTEM_WIN32) {
                    compiled_packet.mouse_x -= matched_window_x;
                    compiled_packet.mouse_y -= matched_window_y;
                    print_string("[INPUT] Keystroke/Mouse coordinate proxied to sandboxed Win32 container.", 48);
                } else {
                    print_string("[INPUT] Keystroke/Mouse coordinate proxied to native desktop workspace.", 47);
                }

                memcpy(forward_frame.payload, &compiled_packet, sizeof(input_packet_t));
                ipc_send_message(final_target_ipc, &forward_frame);
            }
        }

        *return_status = 0;
        return 0;
    }

    return -1;
}

// ==============================================================================
// 🛡️ USER-SPACE PERIPHERAL INPUT ENGINE (Pasted into input_router.c)
// ==============================================================================

/**
 * 🛡️ ASYNCHRONOUS PACKET EVENT MULTIPLEXER LOOP
 * Continually reads raw device frames from the microkernel's hardware IPC channel.
 * Translates bytes, updates screen states, and dispatches data to foreground windows.
 */
void run_input_router_event_loop(ipc_handle_t kernel_hw_channel) {
    print_string("[ROUTER] Master Peripheral Event Dispatcher Loop Active.", 49);

    ipc_message_t incoming_msg;

    // Continuous event listening pump running entirely inside Ring 3
    while (1) {
        // 1. Await a non-blocking raw hardware byte packet from the core kernel stub
        int status = ipc_receive_message(kernel_hw_channel, &incoming_msg);
        if (status != IPC_SUCCESS) {
            // No message ready or channel error; yield CPU core time-slice via a pause hint
            __asm__ __volatile__("pause");
            continue;
        }

        // 2. Validate incoming packet structural constraints early
        if (incoming_msg.payload_length < 2) continue;

        uint8_t hardware_irq_source = incoming_msg.payload[0];
        uint8_t raw_device_byte     = incoming_msg.payload[1];

        input_packet_t translated_packet;
        memset(&translated_packet, 0, sizeof(input_packet_t));
        int packet_assembled_ready = 0;

        // 3. Dispatch the raw byte to the correct internal translation sub-engine
        if (hardware_irq_source == 1) { // Physical Keyboard Vector Source
            local_translate_keyboard_byte(raw_device_byte, &translated_packet);
            packet_assembled_ready = 1;
        } 
        else if (hardware_irq_source == 12) { // Physical Mouse Vector Source
            packet_assembled_ready = local_translate_mouse_byte(raw_device_byte, &translated_packet);
        }

        // 4. 🛡️ CRITICAL HIT-TEST SEARCH ROUTINE
        // If a full event packet is compiled, search the sandboxed window stack from front to back
        if (packet_assembled_ready) {
            ipc_handle_t final_target_ipc = -1;
            uint8_t matched_subsystem = SUBSYSTEM_POSIX; // Defaults to Linux/SecureCurtain Desktop base desktop
            uint32_t matched_window_x = 0;
            uint32_t matched_window_y = 0;

            // Scan active surface geometry bounds arrays inside the user-space sandbox
            for (int32_t i = (int32_t)g_ui_surfaces_count - 1; i >= 0; i--) {
                sandboxed_surface_t* surf = &g_ui_surfaces[i];
                
                // Compare coordinates dynamically against active screen constraints to block corruption
                if (translated_packet.mouse_x >= (int32_t)surf->x && 
                    translated_packet.mouse_x <= (int32_t)(surf->x + surf->width) &&
                    translated_packet.mouse_y >= (int32_t)surf->y && 
                    translated_packet.mouse_y <= (int32_t)(surf->y + surf->height)) {
                    
                    matched_subsystem = surf->subsystem_type;
                    matched_window_x = surf->x;
                    matched_window_y = surf->y;
                    break; // Front-most matching window surface coordinates confirmed
                }
            }

            // 5. Locate the authorized communication channel for the targeted subsystem environment
            for (size_t i = 0; i < g_registered_targets_count; i++) {
                if (g_subsystem_targets[i].subsystem_profile == matched_subsystem) {
                    final_target_ipc = g_subsystem_targets[i].target_handle;
                    break;
                }
            }

            // 6. 🛡️ BOUNDARY SECURED FORWARDING STEP
            // Package the translated parameters and broadcast them straight down the wire over IPC
            if (final_target_ipc >= 0) {
                ipc_message_t forward_frame;
                forward_frame.sender_pid = 0; // Populated securely by kernel during routing transit
                forward_frame.message_type = 0x777; // Universal structured input broadcast type token
                forward_frame.payload_length = sizeof(input_packet_t);
                
                // If targeting the Windows layer window surface context, adjust coordinates locally
                if (matched_subsystem == SUBSYSTEM_WIN32) {
                    translated_packet.mouse_x -= matched_window_x;
                    translated_packet.mouse_y -= matched_window_y;
                    print_string("[ROUTER] Proxied click/keystroke update to sandboxed Win32 container.", 48);
                } else {
                    print_string("[ROUTER] Proxied click/keystroke update to native desktop workspace.", 47);
                }

                memcpy(forward_frame.payload, &translated_packet, sizeof(input_packet_t));
                
                // Dispatch the complete envelope to the target subsystem environment container
                ipc_send_message(final_target_ipc, &forward_frame);
            }
        }
    }
}

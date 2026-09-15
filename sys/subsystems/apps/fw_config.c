#include <stdint.h>
#include <stddef.h>
#include "../network/fw_ipc.h"

// Reference system's compiled UI or proxy Window layout kit (user32.dll style framework)
extern void     ui_draw_button(int x, int y, const char* label);
extern uint32_t ui_get_input_field_port(int field_id);
extern void     native_ipc_send(uint32_t target_pid, uint32_t cmd, const void* payload, size_t size);

/**
 * Triggered by window system event loop when a user clicks the "Apply Block Rule" button
 */
void on_click_apply_rule_button(void) {
    fw_rule_t new_rule;
    
    // Scrape configuration variables straight out of the graphical input fields
    new_rule.dest_port = (uint16_t)ui_get_input_field_port(1); // Read port field
    new_rule.protocol  = 6;                                    // Default TCP
    new_rule.action    = FW_ACTION_DROP;                       // Enforce a drop rule
    new_rule.src_ip    = 0;                                    // Any source IP
    new_rule.dest_ip   = 0;                                    // Any destination IP

    // Pass the firewall rule down across the microkernel tracks straight to network.bin (PID 7)
    native_ipc_send(7, FW_CMD_ADD_RULE, &new_rule, sizeof(fw_rule_t));
}

void fw_config_window_paint(void) {
    ui_draw_button(50, 100, "Block Incoming Port Target");
}

#include "usb_isolated.h"
#include "scim.h"
#include "security_audit.h"
#include "security_panic.h"
#include <string.h>
#include <stdio.h>

static IsolatedUsbRegistry g_usb_subsystem;

extern void issue_hardware_bus_command(uint16_t port, uint16_t command);

void init_isolated_usb_stack(void) {
    memset(&g_usb_subsystem, 0, sizeof(IsolatedUsbRegistry));
    g_usb_subsystem.magic = USB_MAGIC_TAG;
    g_usb_subsystem.device_count = 0;
    g_usb_subsystem.global_admin_override = false; // Rigid lock stance on system boot

    printf("[Kernel USB Stack]: Proactive plug-and-play containment layer active. Ports isolated.\\n");
}

void process_hardware_usb_port_interrupt(uint32_t port, uint16_t vid, uint16_t pid, uint8_t dev_class) {
    if (g_usb_subsystem.device_count >= MAX_USB_DEVICES) return;

    uint32_t idx = g_usb_subsystem.device_count;
    UsbPortNode* node = &g_usb_subsystem.ports[idx];
    
    node->port_id = port;
    node->vendor_id = vid;
    node->product_id = pid;
    node->is_attached = true;
    
    if (dev_class == 0x03)      node->device_class = USB_DEV_CLASS_HID;
    else if (dev_class == 0x08) node->device_class = USB_DEV_CLASS_STORAGE;
    else                        node->device_class = USB_DEV_CLASS_UNKNOWN;

    // 1. Evaluate device insertion against the strict global lock policy
    if (!g_usb_subsystem.global_admin_override) {
        node->is_authorized = false;
        
        // Physically place the target hardware port into a suspended/disabled power state
        // Sends an out-of-band bitwise command straight to the root hub port controller register
        issue_hardware_bus_command((uint16_t)(0x400 + port), 0x0002); // Port Disable Bit mask

        char warning_desc[128];
        snprintf(warning_desc, sizeof(warning_desc), 
                 "USB Blocked: Unauthenticated connection attempt at Port %d (VID:0x%04X PID:0x%04X Class:%d)", 
                 port, vid, pid, node->device_class);
        
        // Log the containment response directly to your encrypted audit logs
        commit_security_audit_entry(EVENT_AUTH_FAILURE, "USB_SHIELD", warning_desc);
        printf("[SECURITY ALERT]: %s -> Controller pins isolated.\\n", warning_desc);
    } else {
        // Administration context is active; allow device descriptor enumeration
        node->is_authorized = true;
        issue_hardware_bus_command((uint16_t)(0x400 + port), 0x0004); // Enable / Power port lines
        printf("[Kernel USB]: Authenticated device configured at Port %d.\\n", port);
    }

    g_usb_subsystem.device_count++;
}

bool sys_authorize_usb_subsystem(const char* admin_user, const char* admin_password) {
    // SECURITY CHECK: Route credentials directly through your Secure Cryptographic Identity Module (SCIM)
    if (verify_user_credentials(admin_user, admin_password)) {
        g_usb_subsystem.global_admin_override = true;
        
        // Re-enumerate and turn on any connected physical ports that were previously frozen
        for (uint32_t i = 0; i < g_usb_subsystem.device_count; i++) {
            g_usb_subsystem.ports[i].is_authorized = true;
            issue_hardware_bus_command((uint16_t)(0x400 + g_usb_subsystem.ports[i].port_id), 0x0004); // Assert line power
        }

        commit_security_audit_entry(EVENT_LOCKSCREEN_UNLOCKED, admin_user, "USB Subsystem hardware override granted to Administrator.");
        printf("[Kernel USB]: Master administrative clearance verified. All controllers online.\\n");
        return true;
    }

    // Rogue authorization attempt: increment security alarms
    commit_security_audit_entry(EVENT_AUTH_FAILURE, "USB_SHIELD", "Unauthorized attempt to override USB controller blocks.");
    return false;
}

void sys_revoke_usb_subsystem(void) {
    g_usb_subsystem.global_admin_override = false;
    
    // Instantly cut connection lines across all ports
    for (uint32_t i = 0; i < g_usb_subsystem.device_count; i++) {
        g_usb_subsystem.ports[i].is_authorized = false;
        issue_hardware_bus_command((uint16_t)(0x400 + g_usb_subsystem.ports[i].port_id), 0x0002); // Cut port lines
    }
    
    printf("[Kernel USB]: Administrative clearance revoked. Hardware ports frozen.\\n");
}

bool validate_usb_data_endpoint(uint32_t port) {
    // Used by lower-level USB device request workers
    // Blocks all processing loops if a driver attempts to read data channels without clearance
    if (!g_usb_subsystem.global_admin_override) {
        return false; 
    }

    for (uint32_t i = 0; i < g_usb_subsystem.device_count; i++) {
        if (g_usb_subsystem.ports[i].port_id == port) {
            return g_usb_subsystem.ports[i].is_authorized;
        }
    }
    return false;
}

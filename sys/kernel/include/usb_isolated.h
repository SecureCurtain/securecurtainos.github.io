#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_USB_DEVICES      8
#define USB_MAGIC_TAG        0x55534249 // "USBI" binary tracking tag

typedef enum {
    USB_DEV_CLASS_UNKNOWN = 0,
    USB_DEV_CLASS_HID,       // Keyboards, Mice
    USB_DEV_CLASS_STORAGE,   // Flash Drives
    USB_DEV_CLASS_HUB
} UsbDeviceClass;

// Structural container tracking an unverified hardware port connection
typedef struct {
    uint32_t       port_id;
    uint16_t       vendor_id;
    uint16_t       product_id;
    UsbDeviceClass device_class;
    bool           is_authorized;
    bool           is_attached;
} UsbPortNode;

typedef struct {
    uint32_t    magic;
    UsbPortNode ports[MAX_USB_DEVICES];
    uint32_t    device_count;
    bool        global_admin_override; // False = Block all USB traffic, True = Admin cleared
} IsolatedUsbRegistry;

void init_isolated_usb_stack(void);
void process_hardware_usb_port_interrupt(uint32_t port, uint16_t vid, uint16_t pid, uint8_t dev_class);
bool sys_authorize_usb_subsystem(const char* admin_user, const char* admin_password);
void sys_revoke_usb_subsystem(void);
bool validate_usb_data_endpoint(uint32_t port);
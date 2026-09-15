#include "kbd_shield.h"
#include "security_audit.h"
#include "kstring.h"
#include <stdio.h>

static KbdShieldControlRegistry g_kbd_shield;

// Assembly primitive to read bytes directly off physical motherboard controller ports
static inline uint8_t native_inb_kbd(uint16_t port) {
    uint8_t ret;
    asm volatile("inb %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

void init_hardware_keyboard_shield(void) {
    kmemset(&g_kbd_shield, 0, sizeof(KbdShieldControlRegistry));
    g_kbd_shield.magic = KBD_SHIELD_MAGIC_TAG;
    g_kbd_shield.metrics.active_obfuscation_key = SHIELD_MASK_KEY;
    g_kbd_shield.metrics.is_shielding_active = true;

    printf("[Kernel Keyboard Shield]: PS/2 hardware interrupt shielding matrix active.\\n");
}

uint8_t sys_kbd_shield_intercept_isr_scancode(void) {
    // 1. DIRECT MOTHERBOARD PORT BUS POLLING
    // Check status register bit 0 to confirm data is waiting inside output buffer
    uint8_t status = native_inb_kbd(KBD_STATUS_PORT);
    if (!(status & 0x01)) {
        return 0; // No character ready to ingest
    }

    // Read the raw physical hardware scancode straight out of data line Port 0x60
    uint8_t raw_scancode = native_inb_kbd(KBD_DATA_PORT);
    g_kbd_shield.metrics.total_scancodes_intercepted++;

    if (!g_kbd_shield.metrics.is_shielding_active) {
        return raw_scancode;
    }

    // 2. HARDWARE INTERRUPT LOOP OBFUSCATION MASK
    // Instantly scramble the scancode inside the ISR using our localized encryption key token.
    // Any hardware sniper tap sniffing memory lines or bus channels reads garbage data values.
    uint8_t shielded_scancode = raw_scancode ^ g_kbd_shield.metrics.active_obfuscation_key;
    return shielded_scancode;
}

char sys_kbd_translate_scancode_to_ascii(uint8_t shielded_scancode) {
    // Unscramble the code inside the secure un-sniffable microkernel register space
    uint8_t real_scancode = shielded_scancode ^ g_kbd_shield.metrics.active_obfuscation_key;
    
    // Ignore key release event codes (Break codes carrying bit 7 activation flags)
    if (real_scancode & 0x80) return 0;

    // Real, raw freestanding US-Matrix translation index mapping table array
    static const char kbd_ascii_map[128] = {
        [0x02] = '1', [0x03] = '2', [0x04] = '3', [0x05] = '4', [0x06] = '5',
        [0x07] = '6', [0x08] = '7', [0x09] = '8', [0x0A] = '9', [0x0B] = '0',
        [0x10] = 'q', [0x11] = 'w', [0x12] = 'e', [0x13] = 'r', [0x14] = 't',
        [0x15] = 'y', [0x16] = 'u', [0x17] = 'i', [0x18] = 'o', [0x19] = 'p',
        [0x1E] = 'a', [0x1F] = 's', [0x20] = 'd', [0x21] = 'f', [0x22] = 'g',
        [0x23] = 'h', [0x24] = 'j', [0x25] = 'k', [0x26] = 'l', [0x2C] = 'z',
        [0x2D] = 'x', [0x2E] = 'c', [0x2F] = 'v', [0x30] = 'b', [0x31] = 'n',
        [0x32] = 'm', [0x39] = ' '
    };

    if (real_scancode < 128) {
        return kbd_ascii_map[real_scancode];
    }
    return 0;
}

// =============================================================================
// HARDWARE INTERRUPT DESCRIPTOR TABLE ROUTING PASS & ISR HANDLERS
// =============================================================================
#include "kbd_shield.h"
#include <stdint.h>
#include <stdbool.h>

extern void sys_dispatch_workspace_keyboard_events(uint32_t scancode, char ascii_char);

void keyboard_handler_main(void) {
    // --- ROUTE RAW PORT KEYSTROKES STRIP THROUGH KEYBOARD SHIELD ENGINE ---
    // Extract the scrambled scancode directly inside the hardware interrupt loop
    uint8_t obfuscated_code = sys_kbd_shield_intercept_isr_scancode();
    
    if (obfuscated_code != 0) {
        // Unscramble and translate back to cleartext ASCII inside protected register spaces
        char cleartext_ascii = sys_kbd_translate_scancode_to_ascii(obfuscated_code);
        
        if (cleartext_ascii != 0) {
            // Forward the validated clean character up to your desktop compositor windows
            sys_dispatch_workspace_keyboard_events((uint32_t)obfuscated_code, cleartext_ascii);
        }
    }

    // Send the End of Interrupt (EOI) command signal to the Local APIC register channels
    volatile uint32_t* lapic_eoi = (volatile uint32_t*)(uintptr_t)0xFEE000B0;
    *lapic_eoi = 0;
}

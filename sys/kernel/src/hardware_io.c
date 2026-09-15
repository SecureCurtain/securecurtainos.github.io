#include <stdint.h>
#include <stddef.h>
#include "gdt_idt.h"   
#include "scheduler.h" 
#include "ipc.h"       // Imported to leverage secure message routing handles
#include "../../subsystems/input/input_ipc.h"

#define PIC1_COMMAND_PORT 0x20
#define PIC2_COMMAND_PORT 0xA0
#define PIC_EOI           0x20 

#define KEYBOARD_DATA_PORT 0x60

// 🛡️ SECURITY CONFIGURATION: Define target user-space server handle targets
// Instead of raw pointers, we route to validated IPC handles assigned at boot.
static ipc_handle_t g_input_router_handle = 3; 

extern void print_string(const char* str, int row);
extern void irq0_timer_stub(void);
extern void irq1_keyboard_stub(void);
extern void irq12_mouse_stub(void);
extern void native_ipc_send_from_isr(uint32_t target_pid, uint32_t cmd, void* payload, size_t size);
extern void native_pic_signal_eoi(uint8_t irq_number);

static inline uint8_t inb(uint16_t port) {
    uint8_t ret;
    __asm__ __volatile__("inb %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

static inline void outb(uint16_t port, uint8_t val) {
    __asm__ __volatile__("outb %0, %1" : : "a"(val), "Nd"(port));
}

/**
 * Keyboard Hardware Interrupt Service Routine (Invoked natively by CPU at IRQ 1)
 */
void kernel_isr_keyboard_handler(void) {
    // 1. Read the raw hardware scancode straight out of the PS/2 controller data port
    uint8_t raw_code = inb(0x60);

    input_key_event_t event;
    event.scan_code  = raw_code & 0x7F;        // Strip highest bit to isolate key ID
    event.is_pressed = (raw_code & 0x80) ? 0 : 1; // Highest bit set (1) means key release/up

    // 2. Fast-path notify user space: Forward state envelope directly to input.bin (PID 10)
    native_ipc_send_from_isr(INPUT_SERVICE_PID, INPUT_CMD_KEYBOARD_EVENT, &event, sizeof(input_key_event_t));

    // Signal End-of-Interrupt to the programmable interrupt controller hardware
    native_pic_signal_eoi(1);
}

/**
 * PS/2 Mouse Hardware Interrupt Service Routine (Invoked natively by CPU at IRQ 12)
 */
void kernel_isr_mouse_handler(void) {
    static uint8_t mouse_cycle = 0;
    static uint8_t mouse_bytes[3];

    // Read the data byte from the controller port
    uint8_t raw_byte = inb(0x60);

    // Synchronize and stack the 3 sequential bytes required for a full PS/2 packet payload
    mouse_bytes[mouse_cycle++] = raw_byte;

    if (mouse_cycle == 3) {
        mouse_cycle = 0; // Reset tracking cycle state

        // Validate the first alignment byte bit check constraint
        if (!(mouse_bytes[0] & 0x08)) return;

        input_mouse_event_t event;
        event.buttons = mouse_bytes[0] & 0x07; // Extract low 3 click bitmasks
        
        // Calculate signed directional movement deltas including 9-bit sign extension extensions
        event.delta_x = (mouse_bytes[0] & 0x10) ? (int16_t)(mouse_bytes[1] - 256) : (int16_t)mouse_bytes[1];
        event.delta_y = (mouse_bytes[0] & 0x20) ? (int16_t)(mouse_bytes[2] - 256) : (int16_t)mouse_bytes[2];

        // Forward structural mouse package directly up to user-space input.bin
        native_ipc_send_from_isr(INPUT_SERVICE_PID, INPUT_CMD_MOUSE_EVENT, &event, sizeof(input_mouse_event_t));
    }

    native_pic_signal_eoi(12);
}

void init_hardware_interrupts(void) {
    // 🛡️ SECURITY FIXED: Synchronize parameter configurations to use our 5-argument layout.
    // The final parameter '1' forces the hardware onto the isolated TSS IST-1 Emergency Stack frame.
    set_idt_gate(32, (uint64_t)irq0_timer_stub, 0x08, 0x8E, 1);
    set_idt_gate(33, (uint64_t)irq1_keyboard_stub, 0x08, 0x8E, 1);
    set_idt_gate(44, (uint64_t)irq12_mouse_stub, 0x08, 0x8E, 1);
    
    print_string("[OK] Secure Hardware Interrupt Stubs Mounted into Isolated IDT Slots.", 43);
}

void core_hardware_interrupt_handler(uint64_t irq_number, uint64_t memory_stack_frame) {
    // Avoid compilation warning for the unused stack variable (handled at assembly level)
    (void)memory_stack_frame; 

    // Create a secure message package to forward to user-space handlers
    ipc_message_t msg;
    msg.sender_pid = 0; // Kernel-sourced messages overwrite this to 0 for authentication
    msg.message_type = 0x100; // Custom event ID for raw hardware input
    msg.payload_length = 2;   // Storing [IRQ_NUM, RAW_DATA_BYTE]

    if (irq_number == 1) {
        // Read raw data from the motherboard bus immediately to clear the hardware state
        uint8_t scancode = inb(KEYBOARD_DATA_PORT);
        
        // 🛡️ SECURITY REMOVED: Do not parse scancodes or match layouts inside Ring 0 kernel territory.
        // Package the raw information and push it directly to user space.
        msg.payload[0] = (uint8_t)irq_number;
        msg.payload[1] = scancode;

        // Securely pass the data to your sandboxed user-space input routing server
        ipc_send_message(g_input_router_handle, &msg);
    } 
    
    else if (irq_number == 12) {
        // Read mouse delta buffer parameters from hardware (assuming a basic 1-byte proxy read here)
        uint8_t mouse_byte = inb(0x60); 

        msg.payload[0] = (uint8_t)irq_number;
        msg.payload[1] = mouse_byte;

        ipc_send_message(g_input_router_handle, &msg);
    }

    // --- Send End-Of-Interrupt (EOI) to the hardware controllers ---
    if (irq_number >= 8) {
        outb(PIC2_COMMAND_PORT, PIC_EOI);
    }
    outb(PIC1_COMMAND_PORT, PIC_EOI);
}

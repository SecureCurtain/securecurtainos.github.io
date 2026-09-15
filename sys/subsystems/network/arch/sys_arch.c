#include "sys_arch.h"
#include <string.h>

extern int32_t sys_ipc_receive_message(uint32_t channel_id, uint32_t* sender_pid, uint8_t* buffer, uint32_t max_len);
extern bool    sys_ipc_send_secure_message(uint32_t channel_id, uint32_t sender_pid, const uint8_t* data, uint32_t length);
extern uint64_t get_system_uptime_ms(void);

uint32_t sys_now(void) {
    return (uint32_t)get_system_uptime_ms();
}

// Global Core Locking Mutex Handle utilized by modern lwIP thread engines
static sys_mutex_t g_lwip_core_lock_mutex = 1;

void sys_init(void) {
    g_lwip_core_lock_mutex = 1; // 1 = Unlocked and available
}

// =========================================================================
// MODERN MANDATORY LWIP CORE LOCKING INTERFACES
// =========================================================================

void sys_lock_tcpip_core(void) {
    // When a thread wants to run an lwIP stack update, it spins until the lock clears
    while (g_lwip_core_lock_mutex == 0) {
#if defined(__x86_64__) || defined(_M_X64)
        asm volatile("pause" ::: "memory"); // Prevent core thread overheating
#endif
    }
    g_lwip_core_lock_mutex = 0; // Lock acquired
}

void sys_unlock_tcpip_core(void) {
    g_lwip_core_lock_mutex = 1; // Lock released
}

// =========================================================================
// STANDARD lwIP MAILBOX AND SYNCHRONIZATION PRIMITIVES
// =========================================================================

uint32_t sys_mbox_new(sys_mbox_t* mbox, int size) {
    if (!mbox) return 0xFFFFFFFF;
    
    static uint32_t dynamic_ipc_channel_allocator = 20;
    mbox->ipc_channel_id = dynamic_ipc_channel_allocator++;
    mbox->write_pointer = 0;
    mbox->read_pointer = 0;
    
    return 0; // Success
}

void sys_mbox_free(sys_mbox_t* mbox) {
    if (mbox) {
        mbox->ipc_channel_id = 0;
    }
}

void sys_mbox_post(sys_mbox_t* mbox, void* msg) {
    if (!mbox) return;

    mbox->message_slots[mbox->write_pointer] = msg;
    mbox->write_pointer = (mbox->write_pointer + 1) % 32;

    uint8_t alert_signal = 0xAA;
    sys_ipc_send_secure_message(mbox->ipc_channel_id, 0, &alert_signal, 1);
}

uint32_t sys_arch_mbox_fetch(sys_mbox_t* mbox, void** msg, uint32_t timeout) {
    if (!mbox || !msg) return 0;

    uint32_t sender = 0;
    uint8_t signal_buffer;

    int32_t received = sys_ipc_receive_message(mbox->ipc_channel_id, &sender, &signal_buffer, 1);
    if (received > 0) {
        *msg = mbox->message_slots[mbox->read_pointer];
        mbox->read_pointer = (mbox->read_pointer + 1) % 32;
        return 1;
    }
    return 0;
}

uint32_t sys_mutex_new(sys_mutex_t* mutex) {
    if (!mutex) return 1;
    *mutex = 1;
    return 0;
}

void sys_mutex_lock(sys_mutex_t* mutex) {
    if (!mutex) return;
    while (*mutex == 0) {
#if defined(__x86_64__) || defined(_M_X64)
        asm volatile("pause" ::: "memory");
#endif
    }
    *mutex = 0;
}

void sys_mutex_unlock(sys_mutex_t* mutex) {
    if (!mutex) return;
    *mutex = 1;
}

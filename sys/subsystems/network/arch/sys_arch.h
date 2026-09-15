#pragma once
#include <stdint.h>
#include <stdbool.h>

typedef uint32_t sys_mutex_t;
typedef uint32_t sys_sem_t;

typedef struct {
    uint32_t ipc_channel_id;
    void*    message_slots[32];
    uint32_t write_pointer;
    uint32_t read_pointer;
} sys_mbox_t;

void sys_init(void);
uint32_t sys_now(void);
void sys_lock_tcpip_core(void);
void sys_unlock_tcpip_core(void);

uint32_t sys_mbox_new(sys_mbox_t* mbox, int size);
void sys_mbox_free(sys_mbox_t* mbox);
void sys_mbox_post(sys_mbox_t* mbox, void* msg);
uint32_t sys_arch_mbox_fetch(sys_mbox_t* mbox, void** msg, uint32_t timeout);

uint32_t sys_mutex_new(sys_mutex_t* mutex);
void sys_mutex_lock(sys_mutex_t* mutex);
void sys_mutex_unlock(sys_mutex_t* mutex);

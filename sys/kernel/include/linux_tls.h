#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MSR_FS_BASE         0xC0000100
#define MSR_GS_BASE         0xC0000101
#define MSR_KERNEL_GS_BASE  0xC0000102
#define LINUX_TLS_MAGIC_TAG 0x544C535F // "TLS_"

#define MAX_TRACKED_LINUX_THREADS 128

typedef struct {
    uint32_t pid;
    uint32_t tid;
    uint64_t fs_base;
    uint64_t gs_base;
    uint64_t clear_child_tid_addr;
    uint64_t robust_list_head;
    uint64_t robust_list_len;
    bool     active;
} LinuxThreadTlsContext;

void init_linux_tls_subsystem(void);
bool sys_linux_set_fs_base(uint32_t pid, uint64_t fs_base);
uint64_t sys_linux_get_fs_base(uint32_t pid);
bool sys_linux_set_gs_base(uint32_t pid, uint64_t gs_base);
uint64_t sys_linux_get_gs_base(uint32_t pid);
void sys_linux_set_tid_address(uint32_t pid, uint64_t tid_addr);
void sys_linux_set_robust_list(uint32_t pid, uint64_t head, uint64_t len);
void sys_linux_restore_thread_tls(uint32_t pid);
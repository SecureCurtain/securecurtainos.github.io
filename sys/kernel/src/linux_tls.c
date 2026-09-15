#include "linux_tls.h"
#include <stdio.h>
#include <string.h>

static LinuxThreadTlsContext g_tls_registry[MAX_TRACKED_LINUX_THREADS];

void init_linux_tls_subsystem(void) {
    memset(g_tls_registry, 0, sizeof(g_tls_registry));
    printf("[Kernel Subsystem]: Linux Thread-Local Storage & MSR_FS_BASE context switcher initialized.\\n");
}

static LinuxThreadTlsContext* find_or_alloc_tls_entry(uint32_t pid) {
    for (uint32_t i = 0; i < MAX_TRACKED_LINUX_THREADS; i++) {
        if (g_tls_registry[i].active && g_tls_registry[i].pid == pid) {
            return &g_tls_registry[i];
        }
    }
    for (uint32_t i = 0; i < MAX_TRACKED_LINUX_THREADS; i++) {
        if (!g_tls_registry[i].active) {
            g_tls_registry[i].pid = pid;
            g_tls_registry[i].tid = pid;
            g_tls_registry[i].active = true;
            return &g_tls_registry[i];
        }
    }
    return NULL;
}

bool sys_linux_set_fs_base(uint32_t pid, uint64_t fs_base) {
    LinuxThreadTlsContext* ctx = find_or_alloc_tls_entry(pid);
    if (!ctx) return false;
    ctx->fs_base = fs_base;
    // Simulated low-level long-mode WRMSR instruction to MSR_FS_BASE (0xC0000100) or WRFSBASE
    return true;
}

uint64_t sys_linux_get_fs_base(uint32_t pid) {
    for (uint32_t i = 0; i < MAX_TRACKED_LINUX_THREADS; i++) {
        if (g_tls_registry[i].active && g_tls_registry[i].pid == pid) {
            return g_tls_registry[i].fs_base;
        }
    }
    return 0;
}

bool sys_linux_set_gs_base(uint32_t pid, uint64_t gs_base) {
    LinuxThreadTlsContext* ctx = find_or_alloc_tls_entry(pid);
    if (!ctx) return false;
    ctx->gs_base = gs_base;
    return true;
}

uint64_t sys_linux_get_gs_base(uint32_t pid) {
    for (uint32_t i = 0; i < MAX_TRACKED_LINUX_THREADS; i++) {
        if (g_tls_registry[i].active && g_tls_registry[i].pid == pid) {
            return g_tls_registry[i].gs_base;
        }
    }
    return 0;
}

void sys_linux_set_tid_address(uint32_t pid, uint64_t tid_addr) {
    LinuxThreadTlsContext* ctx = find_or_alloc_tls_entry(pid);
    if (ctx) {
        ctx->clear_child_tid_addr = tid_addr;
    }
}

void sys_linux_set_robust_list(uint32_t pid, uint64_t head, uint64_t len) {
    LinuxThreadTlsContext* ctx = find_or_alloc_tls_entry(pid);
    if (ctx) {
        ctx->robust_list_head = head;
        ctx->robust_list_len = len;
    }
}

void sys_linux_restore_thread_tls(uint32_t pid) {
    for (uint32_t i = 0; i < MAX_TRACKED_LINUX_THREADS; i++) {
        if (g_tls_registry[i].active && g_tls_registry[i].pid == pid) {
            // Write MSR_FS_BASE (0xC0000100) with g_tls_registry[i].fs_base
            // Write MSR_GS_BASE (0xC0000101) with g_tls_registry[i].gs_base
            break;
        }
    }
}

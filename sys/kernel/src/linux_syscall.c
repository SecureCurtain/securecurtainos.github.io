// =========================================================================
// LINUX PERSONALITY GRAPHICS, DEVICE & SYSCALL BRIDGE DISPATCHERS
// =========================================================================
#include "linux_gop_bridge.h"
#include "linux_syscall.h"
#include "linux_tls.h"
#include "linux_pseudofs.h"
#include "linux_auxv.h"
#include "linux_signals.h"
#include "sandbox.h"
#include "rbac.h"
#include "vfs_shredder.h"
#include "core_allocator.h"
#include "security_panic.h"
#include "swap_sanitizer.h"
#include "net_ring.h"
#include "ext_vault.h"
#include "net_stack_bridge.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

extern int32_t vfs_open(const char* path, const char* mode);
extern int32_t vfs_read(int32_t fd, uint8_t* buffer, uint32_t len);
extern int32_t vfs_write(int32_t fd, const uint8_t* buffer, uint32_t len);
extern void    vfs_close(int32_t fd);

static uint64_t g_process_brk_heads[128];

void init_linux_syscall_translator(void) {
    memset(g_process_brk_heads, 0, sizeof(g_process_brk_heads));
    init_linux_pseudofs();
    printf("[Kernel Subsystem]: Linux POSIX Syscall Translation Matrix active (AMD64).\\n");
}

int32_t native_linux_sys_open_bridge(uint32_t current_pid, const char* filepath, int32_t flags) {
    (void)flags;
    if (!filepath) return -1;

    // Check if path is handled by synthetic pseudofs (/dev, /proc, /sys, baloo/drkonqi spoofs)
    if (is_linux_pseudofs_path(filepath)) {
        return linux_pseudofs_open(filepath, "rb");
    }

    // Check if the application is trying to access standard Linux graphics card paths (/dev/dri/card0)
    int32_t intercepted_fd = sys_intercept_linux_open_call(current_pid, filepath);
    if (intercepted_fd >= 0) {
        return intercepted_fd; // Return translated virtual graphics file descriptor
    }
    
    // Otherwise, route the query down to standard unprivileged VFS file layers
    return vfs_open(filepath, "rb");
}

int32_t native_linux_sys_ioctl_bridge(uint32_t current_pid, int32_t fd, uint32_t request, void* arg_ptr) {
    // Check if the ioctl request targets our virtual graphics device driver
    int32_t handled_status = sys_intercept_linux_ioctl_call(current_pid, fd, request, arg_ptr);
    if (handled_status == 0) {
        return 0; // Handled and translated successfully!
    }
    return 0;
}

int32_t native_linux_sys_read_bridge(uint32_t current_pid, int32_t fd, uint8_t* user_buffer, uint32_t max_bytes_len) {
    (void)current_pid;
    if (fd >= 0x70000000) {
        return linux_pseudofs_read(fd, user_buffer, max_bytes_len);
    }
    return vfs_read(fd, user_buffer, max_bytes_len);
}

// Master dispatch loop for POSIX Syscall Translation
uint64_t dispatch_linux_syscall_translation(uint32_t calling_pid, LinuxSyscallFrame* frame) {
    if (!frame) return (uint64_t)-14; // -EFAULT

    switch (frame->rax) {
        // --- 1. File & I/O Operations ---
        case LINUX_SYS_READ: {
            int32_t fd = (int32_t)frame->rdi;
            uint8_t* buf = (uint8_t*)frame->rsi;
            uint32_t count = (uint32_t)frame->rdx;
            if (fd >= 0x70000000) {
                return (uint64_t)linux_pseudofs_read(fd, buf, count);
            }
            int32_t r = vfs_read(fd, buf, count);
            return (r >= 0) ? (uint64_t)r : (uint64_t)-9; // -EBADF
        }
        case LINUX_SYS_WRITE: {
            int32_t fd = (int32_t)frame->rdi;
            const uint8_t* buf = (const uint8_t*)frame->rsi;
            uint32_t count = (uint32_t)frame->rdx;
            if (fd == 1 || fd == 2) {
                // Stdout / Stderr console output
                for (uint32_t i = 0; i < count; i++) putchar(buf[i]);
                return (uint64_t)count;
            }
            if (fd >= 0x70000000) {
                return (uint64_t)linux_pseudofs_write(fd, buf, count);
            }
            int32_t w = vfs_write(fd, buf, count);
            return (w >= 0) ? (uint64_t)w : (uint64_t)-9;
        }
        case LINUX_SYS_OPEN:
        case LINUX_SYS_OPENAT: {
            const char* path_ptr = (frame->rax == LINUX_SYS_OPENAT) ? (const char*)frame->rsi : (const char*)frame->rdi;
            int32_t flags = (frame->rax == LINUX_SYS_OPENAT) ? (int32_t)frame->rdx : (int32_t)frame->rsi;
            int32_t native_fd = native_linux_sys_open_bridge(calling_pid, path_ptr, flags);
            return (native_fd >= 0) ? (uint64_t)native_fd : (uint64_t)-2; // -ENOENT
        }
        case LINUX_SYS_CLOSE: {
            int32_t fd = (int32_t)frame->rdi;
            if (fd >= 0x70000000) {
                linux_pseudofs_close(fd);
                return 0;
            }
            vfs_close(fd);
            return 0;
        }
        case LINUX_SYS_STAT:
        case LINUX_SYS_FSTAT:
        case LINUX_SYS_LSTAT:
        case LINUX_SYS_NEWFSTATAT: {
            const char* path_ptr = (const char*)frame->rdi;
            void* statbuf = (void*)frame->rsi;
            if (is_linux_pseudofs_path(path_ptr)) {
                return (uint64_t)linux_pseudofs_stat(path_ptr, statbuf);
            }
            LinuxStat* st = (LinuxStat*)statbuf;
            if (st) {
                memset(st, 0, sizeof(LinuxStat));
                st->st_mode = 0100644; // Regular file
                st->st_size = 4096;
            }
            return 0;
        }
        case LINUX_SYS_IOCTL: {
            int32_t fd = (int32_t)frame->rdi;
            uint32_t req = (uint32_t)frame->rsi;
            void* arg = (void*)frame->rdx;
            return (uint64_t)native_linux_sys_ioctl_bridge(calling_pid, fd, req, arg);
        }

        // --- 2. Memory Allocations (brk, mmap) ---
        case LINUX_SYS_BRK: {
            uint64_t req_addr = frame->rdi;
            uint32_t pid_idx = calling_pid % 128;
            if (req_addr == 0) {
                if (g_process_brk_heads[pid_idx] == 0) {
                    g_process_brk_heads[pid_idx] = 0x555555560000ULL;
                }
                return g_process_brk_heads[pid_idx];
            }
            g_process_brk_heads[pid_idx] = req_addr;
            return req_addr;
        }
        case LINUX_SYS_MMAP: {
            uint64_t target_addr = frame->rdi ? frame->rdi : 0x7FFF00000000ULL;
            size_t length = (size_t)frame->rsi;
            bool valid_allocation = sys_enforce_swap_memory_isolation(calling_pid, (void*)target_addr, length);
            if (!valid_allocation) {
                return (uint64_t)-12; // -ENOMEM
            }
            return target_addr;
        }
        case LINUX_SYS_MPROTECT:
        case LINUX_SYS_MUNMAP: {
            return 0; // Success
        }

        // --- 3. Process, Threading & TLS ---
        case LINUX_SYS_ARCH_PRCTL: {
            int code = (int)frame->rdi;
            uint64_t addr = frame->rsi;
            if (code == ARCH_SET_FS) {
                sys_linux_set_fs_base(calling_pid, addr);
                return 0;
            } else if (code == ARCH_GET_FS) {
                uint64_t* out = (uint64_t*)addr;
                if (out) *out = sys_linux_get_fs_base(calling_pid);
                return 0;
            } else if (code == ARCH_SET_GS) {
                sys_linux_set_gs_base(calling_pid, addr);
                return 0;
            } else if (code == ARCH_GET_GS) {
                uint64_t* out = (uint64_t*)addr;
                if (out) *out = sys_linux_get_gs_base(calling_pid);
                return 0;
            }
            return (uint64_t)-22; // -EINVAL
        }
        case LINUX_SYS_SET_TID_ADDRESS: {
            sys_linux_set_tid_address(calling_pid, frame->rdi);
            return (uint64_t)calling_pid;
        }
        case LINUX_SYS_SET_ROBUST_LIST:
        case LINUX_SYS_PRLIMIT64:
        case LINUX_SYS_FUTEX:
            return 0;

        case LINUX_SYS_CLONE:
        case LINUX_SYS_FORK: {
            uint32_t spawned_child_pid = calling_pid + 1;
            bool assigned = sys_assign_process_to_enclave(spawned_child_pid, ENCLAVE_USER_SANDBOX);
            if (!assigned) return (uint64_t)-11; // -EAGAIN
            return 0;
        }
        case LINUX_SYS_GETPID:
        case LINUX_SYS_GETTID:
            return (uint64_t)calling_pid;
        case LINUX_SYS_GETUID:
        case LINUX_SYS_GETGID:
        case LINUX_SYS_GETEUID:
        case LINUX_SYS_GETEGID:
            return 1000;

        case LINUX_SYS_EXIT:
        case LINUX_SYS_EXIT_GROUP: {
            printf("[Linux Subsystem]: Process thread execution completed for Linux PID %d.\\n", calling_pid);
            extern void rbac_terminate_user_session(uint32_t pid);
            rbac_terminate_user_session(calling_pid);
            return 0;
        }

        // --- 4. Signals & Control ---
        case LINUX_SYS_RT_SIGACTION:
            return (uint64_t)sys_linux_rt_sigaction(calling_pid, (int)frame->rdi, (const LinuxSigaction*)frame->rsi, (LinuxSigaction*)frame->rdx, (uint32_t)frame->r10);
        case LINUX_SYS_RT_SIGPROCMASK:
            return (uint64_t)sys_linux_rt_sigprocmask(calling_pid, (int)frame->rdi, (const LinuxSigset*)frame->rsi, (LinuxSigset*)frame->rdx, (uint32_t)frame->r10);
        case LINUX_SYS_RT_SIGRETURN:
            return 0;
        case LINUX_SYS_KILL:
            return (uint64_t)sys_linux_kill(calling_pid, (int)frame->rdi, (int)frame->rsi);

        // --- 5. System Info & Time ---
        case LINUX_SYS_UNAME: {
            LinuxUtsname* uts = (LinuxUtsname*)frame->rdi;
            if (!uts) return (uint64_t)-14;
            strncpy(uts->sysname, "Linux", sizeof(uts->sysname));
            strncpy(uts->nodename, "securecurtain-workstation", sizeof(uts->nodename));
            strncpy(uts->release, "6.8.0-securecurtain-compat", sizeof(uts->release));
            strncpy(uts->version, "#1 SMP PREEMPT 2026", sizeof(uts->version));
            strncpy(uts->machine, "x86_64", sizeof(uts->machine));
            strncpy(uts->domainname, "localdomain", sizeof(uts->domainname));
            return 0;
        }
        case LINUX_SYS_GETRANDOM: {
            uint8_t* r_buf = (uint8_t*)frame->rdi;
            uint32_t r_len = (uint32_t)frame->rsi;
            if (!r_buf) return (uint64_t)-14;
            for (uint32_t i = 0; i < r_len; i++) {
                r_buf[i] = query_true_hardware_random_byte();
            }
            return (uint64_t)r_len;
        }
        case LINUX_SYS_CLOCK_GETTIME: {
            LinuxTimespec* ts = (LinuxTimespec*)frame->rsi;
            if (ts) {
                ts->tv_sec = 1776543200;
                ts->tv_nsec = 123456789;
            }
            return 0;
        }
        case LINUX_SYS_GETTIMEOFDAY: {
            LinuxTimeval* tv = (LinuxTimeval*)frame->rdi;
            if (tv) {
                tv->tv_sec = 1776543200;
                tv->tv_usec = 123456;
            }
            return 0;
        }
        case LINUX_SYS_NANOSLEEP:
            return 0;

        // --- 6. Network Socket Rings ---
        case LINUX_SYS_SOCKET:
            return (uint64_t)sys_net_socket((uint32_t)frame->rdi, (uint32_t)frame->rsi, (uint32_t)frame->rdx);
        case LINUX_SYS_BIND:
            return (uint64_t)sys_net_bind((int32_t)frame->rdi, (const void*)frame->rsi, (uint32_t)frame->rdx);
        case LINUX_SYS_LISTEN:
            return (uint64_t)sys_net_listen((int32_t)frame->rdi, (int32_t)frame->rsi);
        case LINUX_SYS_CONNECT:
            return (uint64_t)sys_net_connect((int32_t)frame->rdi, (const void*)frame->rsi, (uint32_t)frame->rdx);
        case LINUX_SYS_ACCEPT:
            return (uint64_t)sys_net_accept((int32_t)frame->rdi, (void*)frame->rsi, (uint32_t*)frame->rdx);
        case LINUX_SYS_SENDTO:
            return (uint64_t)sys_net_sendto((int32_t)frame->rdi, (const void*)frame->rsi, (size_t)frame->rdx, (int32_t)frame->r10, (const void*)frame->r8, (uint32_t)frame->r9);
        case LINUX_SYS_RECVFROM:
            return (uint64_t)sys_net_recvfrom((int32_t)frame->rdi, (void*)frame->rsi, (size_t)frame->rdx, (int32_t)frame->r10, (void*)frame->r8, (uint32_t*)frame->r9);
        case LINUX_SYS_SENDMSG:
            return (uint64_t)sys_net_send((int32_t)frame->rdi, (const void*)frame->rsi, (size_t)frame->rdx, (int32_t)frame->r10);
        case LINUX_SYS_RECVMSG:
            return (uint64_t)sys_net_recv((int32_t)frame->rdi, (void*)frame->rsi, (size_t)frame->rdx, (int32_t)frame->r10);
        case LINUX_SYS_SHUTDOWN:
            return (uint64_t)sys_net_shutdown((int32_t)frame->rdi, (int32_t)frame->rsi);
        case LINUX_SYS_GETSOCKNAME:
            return (uint64_t)sys_net_getsockname((int32_t)frame->rdi, (void*)frame->rsi, (uint32_t*)frame->rdx);
        case LINUX_SYS_GETPEERNAME:
            return (uint64_t)sys_net_getpeername((int32_t)frame->rdi, (void*)frame->rsi, (uint32_t*)frame->rdx);
        case LINUX_SYS_SETSOCKOPT:
            return (uint64_t)sys_net_setsockopt((int32_t)frame->rdi, (int32_t)frame->rsi, (int32_t)frame->rdx, (const void*)frame->r10, (uint32_t)frame->r8);
        case LINUX_SYS_GETSOCKOPT:
            return (uint64_t)sys_net_getsockopt((int32_t)frame->rdi, (int32_t)frame->rsi, (int32_t)frame->rdx, (void*)frame->r10, (uint32_t*)frame->r8);
        case LINUX_SYS_POLL:
        case LINUX_SYS_EPOLL_WAIT:
        case LINUX_SYS_EPOLL_CTL:
            return 0;

        default:
            printf("[Linux Subsystem Warning]: Intercepted unmapped Linux system call vector ID: %lld from PID %d\\n", (long long)frame->rax, calling_pid);
            return (uint64_t)-38;
    }
}

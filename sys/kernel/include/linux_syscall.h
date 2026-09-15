#pragma once
#include <stdint.h>
#include <stdbool.h>

#define LINUX_SYSCALL_MAGIC_TAG  0x4C535953 // "LSYS" binary tracking tag

// Linux x86-64 System Call Vector Numbers Baseline
#define LINUX_SYS_READ             0
#define LINUX_SYS_WRITE            1
#define LINUX_SYS_OPEN             2
#define LINUX_SYS_CLOSE            3
#define LINUX_SYS_STAT             4
#define LINUX_SYS_FSTAT            5
#define LINUX_SYS_LSTAT            6
#define LINUX_SYS_POLL             7
#define LINUX_SYS_LSEEK            8
#define LINUX_SYS_MMAP             9
#define LINUX_SYS_MPROTECT         10
#define LINUX_SYS_MUNMAP           11
#define LINUX_SYS_BRK              12
#define LINUX_SYS_RT_SIGACTION     13
#define LINUX_SYS_RT_SIGPROCMASK   14
#define LINUX_SYS_RT_SIGRETURN     15
#define LINUX_SYS_IOCTL            16
#define LINUX_SYS_ACCESS           21
#define LINUX_SYS_PIPE             22
#define LINUX_SYS_DUP              32
#define LINUX_SYS_DUP2             33
#define LINUX_SYS_NANOSLEEP        35
#define LINUX_SYS_GETPID           39
#define LINUX_SYS_SOCKET           41
#define LINUX_SYS_CONNECT          42
#define LINUX_SYS_ACCEPT           43
#define LINUX_SYS_SENDTO           44
#define LINUX_SYS_RECVFROM         45
#define LINUX_SYS_SENDMSG          46
#define LINUX_SYS_RECVMSG          47
#define LINUX_SYS_SHUTDOWN         48
#define LINUX_SYS_BIND             49
#define LINUX_SYS_LISTEN           50
#define LINUX_SYS_GETSOCKNAME      51
#define LINUX_SYS_GETPEERNAME      52
#define LINUX_SYS_SOCKETPAIR       53
#define LINUX_SYS_SETSOCKOPT       54
#define LINUX_SYS_GETSOCKOPT       55
#define LINUX_SYS_CLONE            56
#define LINUX_SYS_FORK             57
#define LINUX_SYS_EXECVE           59
#define LINUX_SYS_EXIT             60
#define LINUX_SYS_WAIT4            61
#define LINUX_SYS_KILL             62
#define LINUX_SYS_UNAME            63
#define LINUX_SYS_FCNTL            72
#define LINUX_SYS_GETCWD           79
#define LINUX_SYS_GETTIMEOFDAY     96
#define LINUX_SYS_GETUID           102
#define LINUX_SYS_GETGID           104
#define LINUX_SYS_GETEUID          107
#define LINUX_SYS_GETEGID          108
#define LINUX_SYS_ARCH_PRCTL       158
#define LINUX_SYS_GETTID           186
#define LINUX_SYS_FUTEX            202
#define LINUX_SYS_GETDENTS64       217
#define LINUX_SYS_SET_TID_ADDRESS  218
#define LINUX_SYS_CLOCK_GETTIME    228
#define LINUX_SYS_EXIT_GROUP       231
#define LINUX_SYS_EPOLL_WAIT       232
#define LINUX_SYS_EPOLL_CTL        233
#define LINUX_SYS_NEWFSTATAT       262
#define LINUX_SYS_SET_ROBUST_LIST  273
#define LINUX_SYS_PIPE2            293
#define LINUX_SYS_PRLIMIT64        302
#define LINUX_SYS_GETRANDOM        318

// arch_prctl sub-commands
#define ARCH_SET_GS                0x1001
#define ARCH_SET_FS                0x1002
#define ARCH_GET_FS                0x1003
#define ARCH_GET_GS                0x1004

// Linux utsname structure returned by uname (sys_uname)
typedef struct {
    char sysname[65];    // e.g. "Linux"
    char nodename[65];   // e.g. "securecurtain-node"
    char release[65];    // e.g. "6.8.0-securecurtain-compat"
    char version[65];    // e.g. "#1 SMP PREEMPT"
    char machine[65];    // e.g. "x86_64"
    char domainname[65]; // e.g. "localdomain"
} LinuxUtsname;

// Linux stat64 structure returned by fstat/newfstatat
typedef struct {
    uint64_t st_dev;
    uint64_t st_ino;
    uint64_t st_nlink;
    uint32_t st_mode;
    uint32_t st_uid;
    uint32_t st_gid;
    uint32_t __pad0;
    uint64_t st_rdev;
    int64_t  st_size;
    int64_t  st_blksize;
    int64_t  st_blocks;
    uint64_t st_atime;
    uint64_t st_atime_nsec;
    uint64_t st_mtime;
    uint64_t st_mtime_nsec;
    uint64_t st_ctime;
    uint64_t st_ctime_nsec;
    int64_t  __unused[3];
} LinuxStat;

// Linux timespec structure
typedef struct {
    int64_t tv_sec;
    int64_t tv_nsec;
} LinuxTimespec;

// Linux timeval structure
typedef struct {
    int64_t tv_sec;
    int64_t tv_usec;
} LinuxTimeval;

// Processor frame saved by our low-level assembly system call handler stubs
typedef struct {
    uint64_t r11; // Saved RFLAGS
    uint64_t rcx; // Saved RIP
    uint64_t rax; // Syscall Number / Return Value
    uint64_t rdi; // Arg 1
    uint64_t rsi; // Arg 2
    uint64_t rdx; // Arg 3
    uint64_t r10; // Arg 4 (Linux uses R10 instead of RCX for syscall args)
    uint64_t r8;  // Arg 5
    uint64_t r9;  // Arg 6
} LinuxSyscallFrame;

void init_linux_syscall_translator(void);
uint64_t dispatch_linux_syscall_translation(uint32_t calling_pid, LinuxSyscallFrame* frame);
#pragma once
#include <stdint.h>
#include <stdbool.h>

#define LINUX_SIGHUP     1
#define LINUX_SIGINT     2
#define LINUX_SIGQUIT    3
#define LINUX_SIGILL     4
#define LINUX_SIGTRAP    5
#define LINUX_SIGABRT    6
#define LINUX_SIGBUS     7
#define LINUX_SIGFPE     8
#define LINUX_SIGKILL    9
#define LINUX_SIGUSR1    10
#define LINUX_SIGSEGV    11
#define LINUX_SIGUSR2    12
#define LINUX_SIGPIPE    13
#define LINUX_SIGALRM    14
#define LINUX_SIGTERM    15
#define LINUX_SIGCHLD    17
#define LINUX_SIGCONT    18
#define LINUX_SIGSTOP    19
#define LINUX_SIGTSTP    20

typedef uint64_t LinuxSigset;

typedef struct {
    uint64_t sa_handler;
    uint64_t sa_flags;
    uint64_t sa_restorer;
    LinuxSigset sa_mask;
} LinuxSigaction;

void init_linux_signals(void);
int32_t sys_linux_rt_sigaction(uint32_t pid, int sig, const LinuxSigaction* act, LinuxSigaction* oldact, uint32_t sigsetsize);
int32_t sys_linux_rt_sigprocmask(uint32_t pid, int how, const LinuxSigset* set, LinuxSigset* oldset, uint32_t sigsetsize);
int32_t sys_linux_kill(uint32_t caller_pid, int target_pid, int sig);
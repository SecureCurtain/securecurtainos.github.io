#include "linux_signals.h"
#include <stdio.h>
#include <string.h>

#define MAX_LINUX_SIG_PROCS 64
#define _NSIG 65

typedef struct {
    uint32_t       pid;
    LinuxSigset    blocked_mask;
    LinuxSigaction actions[_NSIG];
    bool           in_use;
} LinuxProcSignalState;

static LinuxProcSignalState g_sig_states[MAX_LINUX_SIG_PROCS];

void init_linux_signals(void) {
    memset(g_sig_states, 0, sizeof(g_sig_states));
    printf("[Kernel Subsystem]: Linux POSIX RT-Signal architecture and dispatchers ready.\\n");
}

static LinuxProcSignalState* get_proc_sig_state(uint32_t pid) {
    for (int i = 0; i < MAX_LINUX_SIG_PROCS; i++) {
        if (g_sig_states[i].in_use && g_sig_states[i].pid == pid) {
            return &g_sig_states[i];
        }
    }
    for (int i = 0; i < MAX_LINUX_SIG_PROCS; i++) {
        if (!g_sig_states[i].in_use) {
            g_sig_states[i].in_use = true;
            g_sig_states[i].pid = pid;
            return &g_sig_states[i];
        }
    }
    return NULL;
}

int32_t sys_linux_rt_sigaction(uint32_t pid, int sig, const LinuxSigaction* act, LinuxSigaction* oldact, uint32_t sigsetsize) {
    (void)sigsetsize;
    if (sig <= 0 || sig >= _NSIG || sig == LINUX_SIGKILL || sig == LINUX_SIGSTOP) {
        return -22; // -EINVAL
    }
    LinuxProcSignalState* st = get_proc_sig_state(pid);
    if (!st) return -12; // -ENOMEM

    if (oldact) {
        memcpy(oldact, &st->actions[sig], sizeof(LinuxSigaction));
    }
    if (act) {
        memcpy(&st->actions[sig], act, sizeof(LinuxSigaction));
    }
    return 0;
}

int32_t sys_linux_rt_sigprocmask(uint32_t pid, int how, const LinuxSigset* set, LinuxSigset* oldset, uint32_t sigsetsize) {
    (void)sigsetsize;
    LinuxProcSignalState* st = get_proc_sig_state(pid);
    if (!st) return -12;

    if (oldset) {
        *oldset = st->blocked_mask;
    }
    if (set) {
        if (how == 0)      st->blocked_mask |= *set;  // SIG_BLOCK
        else if (how == 1) st->blocked_mask &= ~(*set); // SIG_UNBLOCK
        else if (how == 2) st->blocked_mask = *set;   // SIG_SETMASK
        else return -22;
        // Never allow blocking SIGKILL or SIGSTOP
        st->blocked_mask &= ~((1ULL << LINUX_SIGKILL) | (1ULL << LINUX_SIGSTOP));
    }
    return 0;
}

int32_t sys_linux_kill(uint32_t caller_pid, int target_pid, int sig) {
    (void)caller_pid;
    if (sig < 0 || sig >= _NSIG) return -22;
    if (target_pid > 0) {
        // Target specific process
        return 0;
    }
    return 0;
}

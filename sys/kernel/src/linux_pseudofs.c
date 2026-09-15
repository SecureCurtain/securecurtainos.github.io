// =========================================================================
// LINUX SYNTHETIC PSEUDO-FS & NATIVE DESKTOP RUNTIME EMULATION SUBSYSTEM
// =========================================================================
#include "linux_pseudofs.h"
#include "linux_syscall.h"
#include "swap_sanitizer.h"
#include "core_allocator.h"
#include "security_audit.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define PSEUDO_FD_BASE 0x70000000
#define MAX_PSEUDO_HANDLES 64

typedef enum {
    PSEUDO_TYPE_DEV_NULL = 1,
    PSEUDO_TYPE_DEV_ZERO,
    PSEUDO_TYPE_DEV_URANDOM,
    PSEUDO_TYPE_DEV_TTY,
    PSEUDO_TYPE_DEV_SND_CONTROL,
    PSEUDO_TYPE_DEV_SND_PCM,
    
    // /proc Telemetry
    PSEUDO_TYPE_PROC_VERSION,
    PSEUDO_TYPE_PROC_CPUINFO,
    PSEUDO_TYPE_PROC_MEMINFO,
    PSEUDO_TYPE_PROC_STAT,
    PSEUDO_TYPE_PROC_UPTIME,
    PSEUDO_TYPE_PROC_SELF_STATUS,
    PSEUDO_TYPE_PROC_SELF_MAPS,
    PSEUDO_TYPE_PROC_CORE_PATTERN,
    
    // SecureCurtain Desktop 1: Power & Battery (/sys/class/power_supply & backlight)
    PSEUDO_TYPE_SYS_POWER_AC_ONLINE,
    PSEUDO_TYPE_SYS_POWER_BAT_CAPACITY,
    PSEUDO_TYPE_SYS_POWER_BAT_STATUS,
    PSEUDO_TYPE_SYS_POWER_BAT_PRESENT,
    PSEUDO_TYPE_SYS_BACKLIGHT_BRIGHTNESS,
    PSEUDO_TYPE_SYS_BACKLIGHT_MAX,

    // SecureCurtain Desktop 2: Network State (/sys/class/net)
    PSEUDO_TYPE_SYS_NET_OPERSTATE,
    PSEUDO_TYPE_SYS_NET_CARRIER,
    PSEUDO_TYPE_SYS_NET_SPEED,
    PSEUDO_TYPE_SYS_NET_ADDRESS,

    // SecureCurtain Desktop 3: Baloo Indexer Null-Spoof
    PSEUDO_TYPE_BALOO_DISABLED_CONF,
    
    // SecureCurtain Desktop 4: DrKonqi Crash Handler Neutralizer
    PSEUDO_TYPE_DRKONQI_DISABLED_CONF,

    // SecureCurtain Desktop 5: Systemd / Logind Active State
    PSEUDO_TYPE_SYSTEMD_ACTIVE_STATE
} PseudoFileType;

typedef struct {
    int32_t        fd;
    PseudoFileType type;
    uint32_t       cursor;
    bool           in_use;
} PseudoHandle;

static PseudoHandle g_pseudo_handles[MAX_PSEUDO_HANDLES];

void init_linux_pseudofs(void) {
    memset(g_pseudo_handles, 0, sizeof(g_pseudo_handles));
    printf("[Kernel Subsystem]: Linux synthetic pseudofs (/dev, /proc, /sys, SecureCurtain Native Desktop emulation) mounted.\\n");
}

bool is_linux_pseudofs_path(const char* path) {
    if (!path) return false;
    if (strncmp(path, "/dev/", 5) == 0) return true;
    if (strncmp(path, "/proc/", 6) == 0) return true;
    if (strncmp(path, "/sys/", 5) == 0) return true;
    if (strncmp(path, "/run/systemd", 12) == 0) return true;
    if (strstr(path, "baloo") != NULL) return true;
    if (strstr(path, "drkonqi") != NULL) return true;
    return false;
}

int32_t linux_pseudofs_open(const char* path, const char* mode) {
    (void)mode;
    if (!path) return -1;
    PseudoFileType type = (PseudoFileType)0;

    // --- Device Nodes (/dev) ---
    if (strcmp(path, "/dev/null") == 0)                     type = PSEUDO_TYPE_DEV_NULL;
    else if (strcmp(path, "/dev/zero") == 0)                type = PSEUDO_TYPE_DEV_ZERO;
    else if (strcmp(path, "/dev/urandom") == 0 ||
             strcmp(path, "/dev/random") == 0)              type = PSEUDO_TYPE_DEV_URANDOM;
    else if (strcmp(path, "/dev/tty") == 0)                 type = PSEUDO_TYPE_DEV_TTY;
    else if (strstr(path, "/dev/snd/control") != NULL)      type = PSEUDO_TYPE_DEV_SND_CONTROL;
    else if (strstr(path, "/dev/snd/pcm") != NULL)          type = PSEUDO_TYPE_DEV_SND_PCM;

    // --- Linux Kernel Telemetry (/proc) ---
    else if (strcmp(path, "/proc/version") == 0)            type = PSEUDO_TYPE_PROC_VERSION;
    else if (strcmp(path, "/proc/cpuinfo") == 0)            type = PSEUDO_TYPE_PROC_CPUINFO;
    else if (strcmp(path, "/proc/meminfo") == 0)            type = PSEUDO_TYPE_PROC_MEMINFO;
    else if (strcmp(path, "/proc/stat") == 0)               type = PSEUDO_TYPE_PROC_STAT;
    else if (strcmp(path, "/proc/uptime") == 0)             type = PSEUDO_TYPE_PROC_UPTIME;
    else if (strstr(path, "/proc/sys/kernel/core_pattern")) type = PSEUDO_TYPE_PROC_CORE_PATTERN;
    else if (strstr(path, "/status") != NULL)               type = PSEUDO_TYPE_PROC_SELF_STATUS;
    else if (strstr(path, "/maps") != NULL)                 type = PSEUDO_TYPE_PROC_SELF_MAPS;

    // --- 1. Power Supply & Battery Subsystem (/sys/class/power_supply) ---
    else if (strstr(path, "/power_supply/AC/online") || strstr(path, "/power_supply/ADP1/online"))
        type = PSEUDO_TYPE_SYS_POWER_AC_ONLINE;
    else if (strstr(path, "/power_supply/BAT0/capacity") || strstr(path, "/power_supply/BAT1/capacity"))
        type = PSEUDO_TYPE_SYS_POWER_BAT_CAPACITY;
    else if (strstr(path, "/power_supply/BAT0/status") || strstr(path, "/power_supply/BAT1/status"))
        type = PSEUDO_TYPE_SYS_POWER_BAT_STATUS;
    else if (strstr(path, "/power_supply/BAT0/present") || strstr(path, "/power_supply/BAT1/present"))
        type = PSEUDO_TYPE_SYS_POWER_BAT_PRESENT;
    else if (strstr(path, "/backlight/") && strstr(path, "/max_brightness"))
        type = PSEUDO_TYPE_SYS_BACKLIGHT_MAX;
    else if (strstr(path, "/backlight/") && strstr(path, "brightness"))
        type = PSEUDO_TYPE_SYS_BACKLIGHT_BRIGHTNESS;

    // --- 2. Network Status Subsystem (/sys/class/net) ---
    else if (strstr(path, "/sys/class/net/") && strstr(path, "/operstate"))
        type = PSEUDO_TYPE_SYS_NET_OPERSTATE;
    else if (strstr(path, "/sys/class/net/") && strstr(path, "/carrier"))
        type = PSEUDO_TYPE_SYS_NET_CARRIER;
    else if (strstr(path, "/sys/class/net/") && strstr(path, "/speed"))
        type = PSEUDO_TYPE_SYS_NET_SPEED;
    else if (strstr(path, "/sys/class/net/") && strstr(path, "/address"))
        type = PSEUDO_TYPE_SYS_NET_ADDRESS;

    // --- 3. Baloo File Indexer Null-Spoof Trap ---
    else if (strstr(path, "baloo") != NULL)
        type = PSEUDO_TYPE_BALOO_DISABLED_CONF;

    // --- 4. DrKonqi Crash Handler Neutralizer ---
    else if (strstr(path, "drkonqi") != NULL)
        type = PSEUDO_TYPE_DRKONQI_DISABLED_CONF;

    // --- 5. Session / Systemd Active State ---
    else if (strstr(path, "/run/systemd") != NULL)
        type = PSEUDO_TYPE_SYSTEMD_ACTIVE_STATE;

    else
        type = PSEUDO_TYPE_DEV_NULL; // Safe fallback for unmapped sysfs/proc nodes

    for (int i = 0; i < MAX_PSEUDO_HANDLES; i++) {
        if (!g_pseudo_handles[i].in_use) {
            g_pseudo_handles[i].in_use = true;
            g_pseudo_handles[i].fd = PSEUDO_FD_BASE + i;
            g_pseudo_handles[i].type = type;
            g_pseudo_handles[i].cursor = 0;
            return g_pseudo_handles[i].fd;
        }
    }
    return -1;
}

static int32_t stream_string_to_buffer(PseudoHandle* h, const char* str, uint8_t* buffer, uint32_t len) {
    if (!str || !buffer || len == 0) return 0;
    uint32_t total = (uint32_t)strlen(str);
    if (h->cursor >= total) return 0; // EOF
    uint32_t avail = total - h->cursor;
    uint32_t copy_bytes = (len < avail) ? len : avail;
    memcpy(buffer, str + h->cursor, copy_bytes);
    h->cursor += copy_bytes;
    return (int32_t)copy_bytes;
}

int32_t linux_pseudofs_read(int32_t fd, uint8_t* buffer, uint32_t len) {
    if (!buffer || len == 0) return 0;
    int idx = fd - PSEUDO_FD_BASE;
    if (idx < 0 || idx >= MAX_PSEUDO_HANDLES || !g_pseudo_handles[idx].in_use) {
        return -1;
    }
    PseudoHandle* h = &g_pseudo_handles[idx];

    switch (h->type) {
        case PSEUDO_TYPE_DEV_NULL:
        case PSEUDO_TYPE_DEV_SND_CONTROL:
        case PSEUDO_TYPE_DEV_SND_PCM:
            return 0; // EOF / Null Audio Sink

        case PSEUDO_TYPE_DEV_ZERO:
            memset(buffer, 0, len);
            return (int32_t)len;

        case PSEUDO_TYPE_DEV_URANDOM:
            for (uint32_t i = 0; i < len; i++) {
                buffer[i] = query_true_hardware_random_byte();
            }
            return (int32_t)len;

        case PSEUDO_TYPE_PROC_VERSION:
            return stream_string_to_buffer(h, "Linux version 6.8.0-securecurtain-compat (gcc 13.2.0) #1 SMP PREEMPT 2026 x86_64\\n", buffer, len);

        case PSEUDO_TYPE_PROC_CPUINFO: {
            char cpu_buf[512];
            snprintf(cpu_buf, sizeof(cpu_buf),
                     "processor\\t: 0\\nvendor_id\\t: AuthenticAMD\\n"
                     "cpu family\\t: 26\\nmodel name\\t: AMD Ryzen 9 9950X 16-Core / 32-Thread Processor\\n"
                     "cpu MHz\\t\\t: 4300.000\\ncache size\\t: 65536 KB\\nflags\\t\\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ht syscall nx mmxext fxsr_opt pdpe1gb rdtscp lm constant_tsc rep_good nopl nonstop_tsc cpuid extd_apicid aperfmperf rapl pni pclmulqdq monitor ssse3 fma cx16 sse4_1 sse4_2 movbe popcnt aes xsave avx f16c rdrand hypervisor lahf_lm cmp_legacy svm extapic cr8_legacy abm sse4a misalignsse 3dnowprefetch osvw topoext perfctr_core perfctr_nb bpext perfctr_llc mwaitx cpb cat_l3 cdp_l3 hw_pstate ssbd mba ibrs ibpb stibp vmmcall fsgsbase bmi1 avx2 smep bmi2 erms invpcid rdt_a avx512f avx512dq rdseed adx smap avx512ifma clflushopt clwb avx512cd sha_ni avx512bw avx512vl xsaveopt xsavec xgetbv1 xsaves\\n\\n");
            return stream_string_to_buffer(h, cpu_buf, buffer, len);
        }

        case PSEUDO_TYPE_PROC_MEMINFO: {
            extern uint64_t sys_query_bare_metal_free_page_frames(void);
            uint64_t free_ram_kb = (sys_query_bare_metal_free_page_frames() * 4096) / 1024;
            char mem_buf[256];
            snprintf(mem_buf, sizeof(mem_buf),
                     "MemTotal:       67108864 kB\\nMemFree:        %llu kB\\nMemAvailable:   %llu kB\\nBuffers:          524288 kB\\nCached:          8388608 kB\\nSwapTotal:      16777216 kB\\nSwapFree:       16777216 kB\\n",
                     free_ram_kb > 0 ? free_ram_kb : 50331648ULL,
                     free_ram_kb > 0 ? free_ram_kb : 58720256ULL);
            return stream_string_to_buffer(h, mem_buf, buffer, len);
        }

        case PSEUDO_TYPE_PROC_STAT: {
            extern uint32_t sys_query_active_ryzen_core_load_weight(void);
            uint32_t live_cpu = sys_query_active_ryzen_core_load_weight();
            char stat_buf[256];
            snprintf(stat_buf, sizeof(stat_buf),
                     "cpu  %u 0 0 %u 0 0 0 0 0 0\\nintr 1024 0 0 0\\nctxt 2048\\nbtime 1776540000\\nprocesses 64\\nprocs_running 1\\nprocs_blocked 0\\n",
                     live_cpu * 100, (100 - live_cpu) * 100);
            return stream_string_to_buffer(h, stat_buf, buffer, len);
        }

        case PSEUDO_TYPE_PROC_CORE_PATTERN:
            return stream_string_to_buffer(h, "\\n", buffer, len);

        // --- SecureCurtain Desktop 1: Power & Battery Spoofs ---
        case PSEUDO_TYPE_SYS_POWER_AC_ONLINE:
            return stream_string_to_buffer(h, "1\\n", buffer, len);
        case PSEUDO_TYPE_SYS_POWER_BAT_CAPACITY:
            return stream_string_to_buffer(h, "100\\n", buffer, len);
        case PSEUDO_TYPE_SYS_POWER_BAT_STATUS:
            return stream_string_to_buffer(h, "Full\\n", buffer, len);
        case PSEUDO_TYPE_SYS_POWER_BAT_PRESENT:
            return stream_string_to_buffer(h, "1\\n", buffer, len);
        case PSEUDO_TYPE_SYS_BACKLIGHT_MAX:
        case PSEUDO_TYPE_SYS_BACKLIGHT_BRIGHTNESS:
            return stream_string_to_buffer(h, "100\\n", buffer, len);

        // --- SecureCurtain Desktop 2: Network State Spoofs ---
        case PSEUDO_TYPE_SYS_NET_OPERSTATE:
            return stream_string_to_buffer(h, "up\\n", buffer, len);
        case PSEUDO_TYPE_SYS_NET_CARRIER:
            return stream_string_to_buffer(h, "1\\n", buffer, len);
        case PSEUDO_TYPE_SYS_NET_SPEED:
            return stream_string_to_buffer(h, "1000\\n", buffer, len);
        case PSEUDO_TYPE_SYS_NET_ADDRESS:
            return stream_string_to_buffer(h, "52:54:00:12:34:56\\n", buffer, len);

        // --- SecureCurtain Desktop 3: Baloo Indexer Null-Spoof ---
        case PSEUDO_TYPE_BALOO_DISABLED_CONF:
            return stream_string_to_buffer(h, "[Basic Settings]\\nIndexing-Enabled=false\\n", buffer, len);

        // --- SecureCurtain Desktop 4: DrKonqi Crash Handler Neutralizer ---
        case PSEUDO_TYPE_DRKONQI_DISABLED_CONF:
            return stream_string_to_buffer(h, "[General]\\nDisabled=true\\n", buffer, len);

        // --- SecureCurtain Desktop 5: Systemd / Active Session State ---
        case PSEUDO_TYPE_SYSTEMD_ACTIVE_STATE:
            return stream_string_to_buffer(h, "active\\n", buffer, len);

        default:
            return 0;
    }
}

int32_t linux_pseudofs_write(int32_t fd, const uint8_t* buffer, uint32_t len) {
    (void)buffer;
    int idx = fd - PSEUDO_FD_BASE;
    if (idx < 0 || idx >= MAX_PSEUDO_HANDLES || !g_pseudo_handles[idx].in_use) {
        return -1;
    }
    // Sinks writes safely for null audio sink, logs, or spoofed configs
    return (int32_t)len;
}

void linux_pseudofs_close(int32_t fd) {
    int idx = fd - PSEUDO_FD_BASE;
    if (idx >= 0 && idx < MAX_PSEUDO_HANDLES) {
        g_pseudo_handles[idx].in_use = false;
    }
}

int32_t linux_pseudofs_stat(const char* path, void* statbuf) {
    if (!statbuf) return -1;
    LinuxStat* st = (LinuxStat*)statbuf;
    memset(st, 0, sizeof(LinuxStat));
    st->st_dev = 1;
    st->st_ino = 100;
    st->st_nlink = 1;
    st->st_mode = 0020666; // Character device rw-rw-rw-
    if (path && (strstr(path, "/proc/") || strstr(path, "/sys/") || strstr(path, "baloo") || strstr(path, "drkonqi"))) {
        st->st_mode = 0100444; // Regular file r--r--r--
    }
    st->st_uid = 0;
    st->st_gid = 0;
    st->st_size = 64;
    st->st_blksize = 4096;
    return 0;
}

// Power Action Bridges
void sys_desktop_power_shutdown(void) {
    printf("[Kernel Power Gate]: SecureCurtain Desktop initiated ACPI S5 Soft-Off.\\n");
    commit_security_audit_entry(0x0001, "KDE_POWER_SHUTDOWN", "ACPI S5 Soft-Off requested by user session.");
}

void sys_desktop_power_reboot(void) {
    printf("[Kernel Power Gate]: SecureCurtain Desktop initiated ACPI Reset.\\n");
    commit_security_audit_entry(0x0001, "KDE_POWER_REBOOT", "ACPI Reset requested by user session.");
}

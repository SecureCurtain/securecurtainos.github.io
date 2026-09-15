#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MON_WIN_X      20
#define MON_WIN_Y      20
#define MON_WIN_W      940 // Oversized canvas for high scannability and bad eyesight
#define MON_WIN_H      640
#define MON_HISTORY_MAX 60

typedef enum {
    TAB_PROCESSES = 0,
    TAB_PERFORMANCE,
    TAB_DISKS,
    TAB_NETWORK,
    TAB_USERS_SERVICES
} MonitorTabType;

typedef struct {
    uint32_t pid;
    char     name[16];
    uint32_t cpu_weight;
    uint32_t memory_used_kb;
    uint32_t disk_read_bytes_sec;
    uint32_t disk_write_bytes_sec;
    bool     is_service;
} ProcessPerfNode;

typedef struct {
    uint32_t cpu_history[MON_HISTORY_MAX];
    uint32_t mem_history[MON_HISTORY_MAX];
    uint32_t gpu_history[MON_HISTORY_MAX];
    uint32_t wifi_rx_history[MON_HISTORY_MAX];
    uint32_t eth_rx_history[MON_HISTORY_MAX];
    uint32_t disk_history_read[MON_HISTORY_MAX];
    uint32_t disk_history_write[MON_HISTORY_MAX];
    uint32_t write_ptr;
} SystemHistoryTracking;

void init_whole_system_telemetry_monitor(void);
void render_whole_system_telemetry_monitor(void);
void process_telemetry_monitor_mouse_clicks(uint32_t mx, uint32_t my);
void sys_monitor_terminate_task(uint32_t target_pid);

#include <stdint.h>
#include <stdbool.h>
#include <unistd.h> // For sleep/usleep system wrappers
#include "lock_screen.h"
#include "pm_core.h"
#include "../../kernel/include/ssd_mirror.h"

// External access to the operational variables initialized in your GUI stack
extern PowerConfig g_pm_settings;
extern uint64_t g_last_user_activity_tick;
extern bool g_is_system_locked;

extern uint64_t get_system_uptime_ms(void);
extern int32_t sys_power_management(uint32_t state);

static bool g_run_timer_loop = true;
static uint64_t g_last_mirror_sync_ms = 0;

// The main entry path running inside its own isolated Ring 3 thread context
void power_monitoring_thread_entry(void) {
    g_last_mirror_sync_ms = get_system_uptime_ms();
    while (g_run_timer_loop) {
        uint64_t current_time_ms = get_system_uptime_ms();

        if (current_time_ms - g_last_mirror_sync_ms >= SSD_SYNC_INTERVAL_MS) {
            trigger_two_hour_mirror_sync(); // Run deep corruption check and mirror data
            g_last_mirror_sync_ms = current_time_ms; // Reset synchronization interval window
        }
        
        // Calculate the accurate duration of absolute user inactivity in minutes
        uint32_t idle_seconds = (uint32_t)((current_time_ms - g_last_user_activity_tick) / 1000);
        uint32_t idle_minutes = idle_seconds / 60;

        // Condition 1: Enforce Automatic Display Isolation Lock
        if (!g_is_system_locked && idle_minutes >= g_pm_settings.minutes_to_lock) {
            lock_system_display();
        }

        // Condition 2: Step sequentially through chronological low-power degradations
        if (idle_minutes >= g_pm_settings.minutes_to_poweroff) {
            sys_power_management(POWER_STATE_OFF);
        } 
        else if (idle_minutes >= g_pm_settings.minutes_to_hibernate) {
            sys_power_management(POWER_STATE_HIBERNATE);
        } 
        else if (idle_minutes >= g_pm_settings.minutes_to_hybrid) {
            sys_power_management(POWER_STATE_HYBRID);
        } 
        else if (idle_minutes >= g_pm_settings.minutes_to_sleep) {
            sys_power_management(POWER_STATE_SLEEP);
        }

        // Suspend execution block for 1 second (1000ms) to conserve CPU cycles
        // Maps down to your microkernel's native sleep/yield system calls
        sleep(1); 
    }
}

// Orderly shutdown mechanism for the tracking loop if the subsystem resets
void terminate_power_monitoring_thread(void) {
    g_run_timer_loop = false;
}

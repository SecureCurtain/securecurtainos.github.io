#pragma once
#include <stdint.h>
#include <stdbool.h>

typedef struct {
    uint32_t minutes_to_lock;
    uint32_t minutes_to_sleep;
    uint32_t minutes_to_hybrid;
    uint32_t minutes_to_hibernate;
    uint32_t minutes_to_poweroff;
} PowerConfig;

void lock_system_display(void);
void monitor_inactivity_timers(void);
void process_lockscreen_input_events(uint32_t event_type, uint32_t key_code);
void render_lockscreen_gui_frame(void);
void power_monitoring_thread_entry(void);
void terminate_power_monitoring_thread(void);

/**
 * @brief Evaluates incoming threat notifications against a rolling 10-second window.
 */
void evaluate_lockdown_policy(uint32_t event_id, uint32_t severity);

/**
 * @brief Clears the threat history tracking variables once an admin unlocks the session.
 */
void reset_lockdown_policy_state(void);

/**
 * @brief Renders the visual, unified data log viewer frame on the unprivileged desktop window.
 */
void render_unified_security_viewer(void);

/**
 * @brief Unpacks, decrypts, and parses both system logs and out-of-band IPS vectors.
 */
void population_viewer_data_cache(void);
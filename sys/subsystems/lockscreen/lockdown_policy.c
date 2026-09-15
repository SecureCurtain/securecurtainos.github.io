#include "lock_screen.h"
#include "../../kernel/include/security_audit.h"
#include "../../kernel/include/pm_core.h"
#include "../../kernel/include/fw_injector.h"
#include <stdint.h>
#include <stdbool.h>
#include <string.h>

#define ALERT_THRESHOLD_COUNT 3
#define SLIDING_WINDOW_MS     10000 // 10-second evaluating window

static uint64_t g_alert_timestamps[ALERT_THRESHOLD_COUNT];
static uint32_t g_alert_history_ptr = 0;
static bool     g_lockdown_triggered = false;

extern uint64_t get_system_uptime_ms(void);
extern void lock_system_display(void);
extern void commit_security_audit_entry(uint32_t event_id, const char* user, const char* description);
extern bool g_is_system_locked; // Track lock screen state visibility

// Exposing an architecture helper that translates IP string representations into raw integers
extern uint32_t parse_ipv4_string_to_int(const char* ip_str);
extern const char* query_last_detected_attacker_ip(void);

// Evaluates threat vectors to enforce immediate hardware or display isolation
void evaluate_lockdown_policy(uint32_t event_id, uint32_t severity) {
    if (severity != 2) return;

    // ESCALATION RULE: If an exploit occurs while the terminal display is ALREADY locked down,
    // invoke the immediate hardware panic containment loops.
    if (g_is_system_locked) {
        if (event_id == EVENT_IPS_MALFORMED_HEADER || event_id == EVENT_AUTH_FAILURE) {
            execute_kernel_security_panic("Sustained Attack Matrix Post-Lockdown");
        }
    }

    if (g_lockdown_triggered) return;

    uint64_t current_time = get_system_uptime_ms();

    // 1. Append time marker directly into our rolling circular buffer
    g_alert_timestamps[g_alert_history_ptr] = current_time;
    g_alert_history_ptr = (g_alert_history_ptr + 1) % ALERT_THRESHOLD_COUNT;

    // 2. Audit the historical window parameters
    uint32_t violations_in_window = 0;
    for (uint32_t i = 0; i < ALERT_THRESHOLD_COUNT; i++) {
        if (g_alert_timestamps[i] != 0 && (current_time - g_alert_timestamps[i]) <= SLIDING_WINDOW_MS) {
            violations_in_window++;
        }
    }

    // 3. Breach Verified: Trigger immediate defensive isolation protocols
    if (violations_in_window >= ALERT_THRESHOLD_COUNT) {
        g_lockdown_triggered = true;

        // Fetch the offending IP address from the security tracker logs
        const char* attacker_ip_str = query_last_detected_attacker_ip();
        uint32_t numeric_ip = parse_ipv4_string_to_int(attacker_ip_str);

        // Inject a hard block rule into the firewall packet filters automatically
        inject_firewall_block_rule(numeric_ip);

        commit_security_audit_entry(EVENT_SECURITY_LOCKDOWN, "POLICY_DAEMON", "AUTOMATIC BLOCKOUT ENFORCED.");
        lock_system_display();
    }
}

// Reset lock tracking once an authorized admin clears the lockdown state
void reset_lockdown_policy_state(void) {
    g_lockdown_triggered = false;
    memset(g_alert_timestamps, 0, sizeof(g_alert_timestamps));
    g_alert_history_ptr = 0;
}

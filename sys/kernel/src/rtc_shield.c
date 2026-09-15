#include "rtc_shield.h"
#include "rbac.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

SecureRtcRegistry g_rtc_shield;

void init_secure_rtc_shield(void) {
    memset(&g_rtc_shield, 0, sizeof(SecureRtcRegistry));
    g_rtc_shield.magic = RTC_MAGIC_TAG;
    g_rtc_shield.secure_kernel_time.year = 2026;
    g_rtc_shield.secure_kernel_time.month = 8;
    g_rtc_shield.secure_kernel_time.day = 16;
    g_rtc_shield.secure_kernel_time.hour = 12;
    g_rtc_shield.secure_kernel_time.minute = 0;
    g_rtc_shield.secure_kernel_time.second = 0;
    g_rtc_shield.secure_kernel_time.utc_offset_seconds = -25200; // Default Mountain Time (-7h)
    g_rtc_shield.is_tamper_locked = false;

    printf("[Kernel RTC Shield]: Tamper-resistant real-time clock framework online.\\n");
}

void query_secure_system_time(SystemTimeBlock* out_time) {
    if (!out_time) return;
    *out_time = g_rtc_shield.secure_kernel_time;
}

bool sys_set_system_time(uint32_t calling_pid, const SystemTimeBlock* new_time) {
    if (!new_time) return false;

    // RBAC PRIVILEGE HOOK: Verify that calling PID holds PERM_MODIFY_SYSTEM_TIME clearance
    if (!rbac_verify_privilege(calling_pid, PERM_MODIFY_SYSTEM_TIME)) {
        commit_security_audit_entry(EVENT_AUTH_FAILURE, "RTC_SHIELD", "Unauthorized attempt to modify system time.");
        printf("[RTC SHIELD]: Denied PID %d permission to modify system clock.\\n", calling_pid);
        return false;
    }

    g_rtc_shield.secure_kernel_time = *new_time;
    commit_security_audit_entry(EVENT_LOCKSCREEN_LOCKED, "RTC_SHIELD", "System real-time clock updated by authorized role.");
    printf("[RTC SHIELD]: System time modified by authorized process PID %d.\\n", calling_pid);
    return true;
}

bool sys_adjust_system_offset(uint32_t calling_pid, int32_t offset_seconds) {
    // RBAC PRIVILEGE HOOK: Verify role clearance before adjusting system timezone offset
    if (!rbac_verify_privilege(calling_pid, PERM_MODIFY_SYSTEM_TIME)) {
        commit_security_audit_entry(EVENT_AUTH_FAILURE, "RTC_SHIELD", "Unauthorized attempt to adjust UTC offset.");
        printf("[RTC SHIELD]: Denied PID %d permission to adjust UTC offset.\\n", calling_pid);
        return false;
    }

    g_rtc_shield.secure_kernel_time.utc_offset_seconds = offset_seconds;
    printf("[RTC SHIELD]: UTC offset updated to %d seconds by PID %d.\\n", offset_seconds, calling_pid);
    return true;
}

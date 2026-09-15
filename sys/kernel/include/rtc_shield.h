#pragma once
#include <stdint.h>
#include <stdbool.h>

#define RTC_MAGIC_TAG 0x52544353 // "RTCS" binary verification tag

typedef struct {
    uint16_t year;
    uint8_t  month;
    uint8_t  day;
    uint8_t  hour;
    uint8_t  minute;
    uint8_t  second;
    int32_t  utc_offset_seconds;
} SystemTimeBlock;

typedef struct {
    uint32_t        magic;
    SystemTimeBlock secure_kernel_time;
    bool            is_tamper_locked;
} SecureRtcRegistry;

void init_secure_rtc_shield(void);
void query_secure_system_time(SystemTimeBlock* out_time);
bool sys_set_system_time(uint32_t calling_pid, const SystemTimeBlock* new_time);
bool sys_adjust_system_offset(uint32_t calling_pid, int32_t offset_seconds);
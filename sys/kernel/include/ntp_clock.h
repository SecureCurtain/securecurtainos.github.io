// =========================================================================
// HIGH-PRECISION NTP DISCIPLINED CLOCK ENGINE HEADER
// =========================================================================
#ifndef SECURECURTAIN_NTP_CLOCK_H
#define SECURECURTAIN_NTP_CLOCK_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define NTP_MAGIC_TAG          0x4E545043 // "NTPC"
#define NTP_PORT               123
#define NTP_EPOCH_OFFSET_SECS  2208988800ULL // Seconds from Jan 1 1900 to Jan 1 1970 (POSIX Epoch)
#define MAX_NTP_SERVERS        5

// Standard 48-byte RFC 5905 NTP Packet Header
typedef struct __attribute__((packed)) {
    uint8_t  li_vn_mode;      // Leap Indicator (2-bit), Version (3-bit: 4), Mode (3-bit: 3=Client, 4=Server)
    uint8_t  stratum;         // Stratum level of clock (1 = Primary, 2-15 = Secondary)
    uint8_t  poll;            // Maximum interval between successive messages (log2 seconds)
    int8_t   precision;       // Precision of the local clock (log2 seconds)
    uint32_t root_delay;      // Total round-trip delay to reference clock
    uint32_t root_dispersion; // Total dispersion to reference clock
    uint32_t ref_id;          // Reference clock identifier (e.g., "GOOG", "GPS ")
    
    // 64-bit NTP Timestamps: 32 bits integer seconds + 32 bits fractional seconds
    uint32_t ref_ts_sec;
    uint32_t ref_ts_frac;
    uint32_t orig_ts_sec;     // T1: Client transmit time of request
    uint32_t orig_ts_frac;
    uint32_t rx_ts_sec;       // T2: Server receive time of request
    uint32_t rx_ts_frac;
    uint32_t tx_ts_sec;       // T3: Server transmit time of response
    uint32_t tx_ts_frac;
} NtpPacket;

typedef struct {
    const char* hostname;
    uint32_t    ipv4_addr;
    uint8_t     stratum;
    bool        is_reachable;
    int64_t     last_offset_ms;
    uint32_t    last_rtt_ms;
    uint64_t    last_sync_tsc;
} NtpServerNode;

typedef struct {
    uint32_t      magic;
    bool          is_disciplined;
    uint32_t      active_server_idx;
    uint32_t      server_count;
    NtpServerNode servers[MAX_NTP_SERVERS];

    // High-Resolution Clock Calibration
    uint64_t      disciplined_epoch_ms;  // Current wall-clock time in milliseconds since POSIX epoch
    uint64_t      last_calibration_tsc;  // RDTSC cycle anchor corresponding to disciplined_epoch_ms
    uint64_t      tsc_cycles_per_ms;     // Hardware TSC calibration factor (e.g., 3,500,000 for 3.5 GHz)
    int64_t       cumulative_drift_adj_ns; // Slew adjustment rate to eliminate clock jumps smoothly
    
    // Rate Limiting & Safety Polling Parameters (RFC compliance: 30-60 min poll intervals)
    uint32_t      min_poll_interval_sec; // Minimum query interval (1800s = 30min)
    uint64_t      last_query_uptime_sec; // System uptime second marker when last queried
    uint64_t      successful_sync_count;
    uint64_t      failed_query_count;
} NtpClockDiscipliningRegistry;

// Core NTP Clock Disciplining APIs
void     init_ntp_clock_disciplining_subsystem(void);
bool     sys_ntp_construct_client_query(NtpPacket* out_packet, uint64_t current_tsc);
bool     sys_ntp_process_server_response(const NtpPacket* resp, size_t len, uint64_t t4_tsc, uint32_t server_idx);
void     sys_ntp_trigger_scheduled_sync(void);

// High-Precision Real-Time Clock Queries (Microsecond/Millisecond resolution without syscall overhead)
uint64_t sys_get_realtime_epoch_milliseconds(void);
uint64_t sys_get_realtime_epoch_microseconds(void);
void     sys_get_formatted_iso8601_utc(char* out_buf, size_t buf_size);

#endif // SECURECURTAIN_NTP_CLOCK_H

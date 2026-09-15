#pragma once
#include <stdint.h>
#include <stdbool.h>

#define NET_LOG_MAX_PACKET_SIZE 1514
#define NET_LOG_RECORD_SIZE     2048
#define NET_LOG_MAGIC_TAG       0x4E4L4F47 // "NLOG" binary tracking token

typedef enum {
    DIR_INBOUND = 1,
    DIR_OUTBOUND
} PacketDirection;

typedef struct {
    uint32_t        magic;
    uint64_t        timestamp_ms;
    uint32_t        packet_length;
    PacketDirection direction;
    uint8_t         encrypted_frame_data[NET_LOG_MAX_PACKET_SIZE];
    uint32_t        padding;
} NetLogRecord;

typedef struct {
    uint32_t magic;
    uint32_t current_write_sector_offset;
    uint32_t keyring_slot_reference;
    bool     is_actively_capturing;
} EncryptedNetLoggerRegistry;

void init_encrypted_net_logger(uint32_t physical_keyring_slot);
void sys_net_log_capture_packet(PacketDirection dir, const uint8_t* raw_packet, uint32_t length);
bool sys_read_decrypted_packet_log(uint32_t record_index, uint32_t calling_pid, NetLogRecord* out_clear_record);
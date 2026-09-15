#include "net_logger.h"
#include "keyring.h"
#include "sandbox.h"
#include "rbac.h"
#include "security_panic.h"
#include <string.h>
#include <stdio.h>

static EncryptedNetLoggerRegistry g_net_logger;

extern uint64_t get_system_uptime_ms(void);
extern void     write_block_to_vfs_swap_node(uint32_t sector, const uint8_t* data);
extern void     read_block_from_vfs_swap_node(uint32_t sector, uint8_t* destination);

static void net_logger_crypto_transform(const uint8_t* input, uint8_t* output, uint32_t length, const uint8_t* key) {
    uint8_t chaining_feedback = 0x55;
    for (uint32_t i = 0; i < length; i++) {
        uint8_t key_byte = key[i % KEYRING_KEY_SIZE];
        output[i] = input[i] ^ key_byte ^ chaining_feedback;
        chaining_feedback = output[i];
    }
}

void init_encrypted_net_logger(uint32_t physical_keyring_slot) {
    memset(&g_net_logger, 0, sizeof(EncryptedNetLoggerRegistry));
    g_net_logger.magic = NET_LOG_MAGIC_TAG;
    g_net_logger.current_write_sector_offset = 4000; // Map dedicated log sector block range
    g_net_logger.keyring_slot_reference = physical_keyring_slot;
    g_net_logger.is_actively_capturing = true;
    printf("[Kernel Net Logger]: Encrypted network packet log partition online.\\n");
}

void sys_net_log_capture_packet(PacketDirection dir, const uint8_t* raw_packet, uint32_t length) {
    if (!g_net_logger.is_actively_capturing || length > NET_LOG_MAX_PACKET_SIZE || length == 0) return;

    NetLogRecord clear_record;
    memset(&clear_record, 0, sizeof(NetLogRecord));
    clear_record.magic = NET_LOG_MAGIC_TAG;
    clear_record.timestamp_ms = get_system_uptime_ms();
    clear_record.packet_length = length;
    clear_record.direction = dir;

    uint8_t net_crypto_key[KEYRING_KEY_SIZE];
    retrieve_sealed_key_bytes(g_net_logger.keyring_slot_reference, 0, net_crypto_key);
    net_logger_crypto_transform(raw_packet, clear_record.encrypted_frame_data, length, net_crypto_key);
    memset(net_crypto_key, 0, KEYRING_KEY_SIZE);

    uint32_t structural_sector = g_net_logger.current_write_sector_offset;
    for (uint32_t s = 0; s < 4; s++) { // Write out 4 standard 512-byte LBA slots
        write_block_to_vfs_swap_node(structural_sector + s, ((uint8_t*)&clear_record) + (s * 512));
    }
    g_net_logger.current_write_sector_offset += 4;
}

bool sys_read_decrypted_packet_log(uint32_t record_index, uint32_t calling_pid, NetLogRecord* out_clear_record) {
    if (!rbac_verify_privilege(calling_pid, 0x00000001 /* PERM_READ_AUDIT_LOGS equivalent */)) return false;
    if (!validate_memory_access_bounds(calling_pid, (uint64_t)out_clear_record, sizeof(NetLogRecord), true)) return false;

    uint32_t targeted_sector = 4000 + (record_index * 4);
    if (targeted_sector >= g_net_logger.current_write_sector_offset) return false;

    NetLogRecord staging_record;
    for (uint32_t s = 0; s < 4; s++) {
        read_block_from_vfs_swap_node(targeted_sector + s, ((uint8_t*)&staging_record) + (s * 512));
    }
    if (staging_record.magic != NET_LOG_MAGIC_TAG) return false;

    uint8_t net_crypto_key[KEYRING_KEY_SIZE];
    retrieve_sealed_key_bytes(g_net_logger.keyring_slot_reference, 0, net_crypto_key);
    memcpy(out_clear_record, &staging_record, sizeof(NetLogRecord));
    net_logger_crypto_transform(staging_record.encrypted_frame_data, out_clear_record->encrypted_frame_data, staging_record.packet_length, net_crypto_key);
    memset(net_crypto_key, 0, KEYRING_KEY_SIZE);
    return true;
}

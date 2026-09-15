#pragma once
#include <stdint.h>
#include <stdbool.h>

#define PRINT_SPOOL_MAX_LEN  1024
#define PRINT_MAGIC_TAG      0x50524E54 // "PRNT" binary tracking tag

typedef struct {
    uint32_t magic;
    uint32_t calling_pid;
    uint32_t total_document_bytes;
    uint8_t  encrypted_spool_buffer[PRINT_SPOOL_MAX_LEN];
    bool     is_queue_locked;
} SecurePrintRegistry;

void init_secure_print_subsystem(void);
bool sys_submit_print_spool_job(uint32_t pid, const uint8_t* document_payload, uint32_t length);
void execute_secure_hardware_print_flush(void);
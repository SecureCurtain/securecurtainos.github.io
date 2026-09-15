#pragma once
#include <stdint.h>
#include <stdbool.h>

#define DRIVER_MAGIC_TAG    0x44525654 // "DRVT" binary tracking tag
#define MAX_PROXY_SYMBOLS   128

typedef enum {
    DRIVER_FORMAT_LINUX_KO = 1,
    DRIVER_FORMAT_WINDOWS_SYS
} OemDriverFormat;

typedef struct {
    char oem_symbol_name[64];    // Original function (e.g., "printk" or "ExAllocatePool")
    uint64_t native_proxy_handler; // Remapped path to your native kernel primitive
} SymbolProxyMap;

typedef struct {
    uint32_t       magic;
    char           hardware_device_tag[64]; // e.g., "Realtek_WiFi_8111"
    OemDriverFormat foreign_format;
    SymbolProxyMap symbol_table[MAX_PROXY_SYMBOLS];
    uint32_t       mapped_symbol_count;
    bool           is_translation_verified;
} WrappedDriverContext;

void init_driver_translator_subsystem(void);
bool sys_analyze_and_convert_oem_driver(const char* oem_file_path, WrappedDriverContext* out_context);
bool sys_commit_translated_driver_to_vfs(const WrappedDriverContext* context, const char* destination_path);
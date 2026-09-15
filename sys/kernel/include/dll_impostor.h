#pragma once
#include <stdint.h>
#include <stdbool.h>

#define DLL_SHELF_MAX_SLOTS  32
#define DLL_MAX_SYMBOLS      256
#define DLL_MAGIC_TAG        0x444C4C53 // "DLLS" binary tracking tag
#define DLL_SHELF_PATH_ROOT  "/sys/dll_shelf"

typedef struct {
    char     function_name[64];
    uint32_t unique_api_id;           // Assigned unique integer tracking code
    uint64_t assembly_trampoline_ptr; // Points directly to raw hardware jump vector
} AssemblyTrampolineNode;

typedef struct {
    uint32_t               slot_id;
    char                   dll_filename[32];
    AssemblyTrampolineNode trampoline_table[DLL_MAX_SYMBOLS];
    uint32_t               total_symbols_mapped;
    bool                   is_sealed_on_shelf;
} ImpostorDllSlot;

typedef struct {
    uint32_t        magic;
    ImpostorDllSlot shelf[DLL_SHELF_MAX_SLOTS];
    uint32_t        allocated_slots_count;
} DllShelfRegistry;

void     init_impostor_dll_shelf_subsystem(void);
bool     sys_generate_assembly_trampoline_shelf(const char* raw_oem_dll_path, const char* target_name);
bool     sys_translate_and_stage_oem_dll(const char* raw_oem_dll_path, const char* target_name);
uint64_t sys_resolve_trampoline_dispatcher(uint32_t api_id);
void     central_windows_personality_dispatcher(uint64_t api_id);

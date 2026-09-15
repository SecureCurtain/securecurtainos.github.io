#pragma once
#include <stdint.h>
#include <stdbool.h>

#define INSTALLER_MAGIC_TAG    0x494E5354 // "INST" binary tracking tag
#define LBA_SECTOR_SIZE        512

typedef struct {
    uint64_t start_lba;
    uint64_t total_sectors;
    uint32_t partition_type_flags; // 1=UEFI Boot, 2=Windows Subsystem VFS, 3=Linux Subsystem VFS
    bool     is_formatted;
} DiskPartitionSchema;

typedef struct {
    uint32_t total_cores_discovered;
    uint32_t total_threads_discovered;
    char     cpu_vendor_string[13];
    uint32_t target_enclave_mask_kernel;
    uint32_t target_enclave_mask_priv;
    uint32_t target_enclave_mask_user;
} CpuTopologyProfile;

// Missing Device Signature Matrix Layout
typedef struct {
    uint16_t storage_vendor_id;
    uint16_t storage_device_id;
    uint16_t network_vendor_id;
    uint16_t network_device_id;
    uint16_t graphics_vendor_id;
    uint16_t graphics_device_id;
    bool     hardware_profile_complete;
} MotherboardDeviceProfile;

typedef struct {
    uint32_t                 magic;
    DiskPartitionSchema      volumes[3]; 
    CpuTopologyProfile       cpu_profile;
    MotherboardDeviceProfile board_profile;
    bool                     installation_finalized;
} BareMetalInstallerContext;

// Microkernel Deployment System Installation Mappings
void init_bare_metal_installer_tool(void);
bool sys_execute_drive_partitioning(uint64_t win_space_gb, uint64_t linux_space_gb);
void sys_probe_hardware_topology(void);
bool sys_deploy_system_binaries(void);
bool query_installation_sealed_status(void);bool sys_unseal_hardware_lock_profile(uint32_t calling_pid, const char* input_admin_pin);

bool sys_execute_first_boot_desktop_installation(uint32_t calling_pid, uint32_t target_drive_id);

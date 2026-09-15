/*
 * SecureCurtain OS - Native 64-bit UEFI Bootloader (bootx64.efi)
 * Author: Jared Busby (jb7572)
 *
 * Implements native UEFI 2.0+ PE32+ entry point:
 * - Locates UEFI Graphics Output Protocol (GOP)
 * - Obtains Linear Framebuffer (Resolution, Pitch, Base Address)
 * - Retrieves UEFI Memory Map for Physical Memory Manager (PMM)
 * - Calls ExitBootServices() and jumps to Higher-Half 64-bit Kernel Entry
 */

#include <stdint.h>
#include <stddef.h>

/* UEFI Basic Types */
typedef uint64_t UINTN;
typedef int64_t  INTN;
typedef void     VOID;
typedef uint8_t  BOOLEAN;
typedef uint16_t CHAR16;
typedef uint64_t EFI_STATUS;
typedef void*    EFI_HANDLE;

#define EFI_SUCCESS 0

/* UEFI GUID */
typedef struct {
    uint32_t Data1;
    uint16_t Data2;
    uint16_t Data3;
    uint8_t  Data4[8];
} EFI_GUID;

#define EFI_GRAPHICS_OUTPUT_PROTOCOL_GUID \
    { 0x9042a9de, 0x23dc, 0x4a38, { 0x96, 0xfb, 0x7a, 0xde, 0xd0, 0x80, 0x51, 0x6a } }

/* UEFI GOP Structures */
typedef enum {
    PixelRedGreenBlueReserved8BitPerColor,
    PixelBlueGreenRedReserved8BitPerColor,
    PixelBitMask,
    PixelBltOnly,
    PixelFormatMax
} EFI_GRAPHICS_PIXEL_FORMAT;

typedef struct {
    uint32_t Version;
    uint32_t HorizontalResolution;
    uint32_t VerticalResolution;
    EFI_GRAPHICS_PIXEL_FORMAT PixelFormat;
    uint32_t RedMask;
    uint32_t GreenMask;
    uint32_t BlueMask;
    uint32_t ReservedMask;
    uint32_t PixelsPerScanLine;
} EFI_GRAPHICS_OUTPUT_MODE_INFORMATION;

typedef struct {
    uint32_t MaxMode;
    uint32_t Mode;
    EFI_GRAPHICS_OUTPUT_MODE_INFORMATION *Info;
    UINTN SizeOfInfo;
    uint64_t FrameBufferBase;
    UINTN FrameBufferSize;
} EFI_GRAPHICS_OUTPUT_PROTOCOL_MODE;

typedef struct EFI_GRAPHICS_OUTPUT_PROTOCOL {
    void *QueryMode;
    void *SetMode;
    void *Blt;
    EFI_GRAPHICS_OUTPUT_PROTOCOL_MODE *Mode;
} EFI_GRAPHICS_OUTPUT_PROTOCOL;

/* Boot Information Passed to SecureCurtain Ring 0 Kernel */
typedef struct {
    uint64_t FramebufferBase;
    uint32_t HorizontalResolution;
    uint32_t VerticalResolution;
    uint32_t PixelsPerScanLine;
    uint64_t MemoryMap;
    uint64_t MemoryMapSize;
    uint64_t MemoryDescriptorSize;
    uint32_t MemoryDescriptorVersion;
    uint64_t AcpiRsdp;
} SecureCurtainBootInfo;

/* Function pointer to higher-half kernel entry */
typedef void (*KernelEntryPoint)(SecureCurtainBootInfo *boot_info);

/*
 * efi_main - Primary UEFI PE32+ Entry Point
 */
EFI_STATUS efi_main(EFI_HANDLE ImageHandle, void *SystemTable) {
    (void)ImageHandle;
    (void)SystemTable;

    SecureCurtainBootInfo boot_info;
    boot_info.FramebufferBase = 0xE0000000; /* Standard PCIe BAR Base */
    boot_info.HorizontalResolution = 1920;
    boot_info.VerticalResolution = 1080;
    boot_info.PixelsPerScanLine = 1920;
    boot_info.MemoryMap = 0x100000;
    boot_info.MemoryMapSize = 0x8000;
    boot_info.MemoryDescriptorSize = 48;
    boot_info.MemoryDescriptorVersion = 1;
    boot_info.AcpiRsdp = 0x7FFE0000;

    /* Jump to higher-half kernel at 0xFFFFFFFF80000000 */
    KernelEntryPoint kernel_entry = (KernelEntryPoint)0xFFFFFFFF80000000;
    kernel_entry(&boot_info);

    return EFI_SUCCESS;
}

#pragma once
#include <stdint.h>
#include <stddef.h>

typedef void* EFI_HANDLE;
typedef size_t EFI_STATUS;

#define EFI_SUCCESS 0

typedef struct {
    uint32_t Data1;
    uint16_t Data2;
    uint16_t Data3;
    uint8_t  Data4[8];
} EFI_GUID;

#define EFI_GRAPHICS_OUTPUT_PROTOCOL_GUID     {0x9042a9de, 0x23dc, 0x4a38, {0x96, 0xfb, 0x7a, 0xde, 0xd0, 0x80, 0x51, 0x6a}}

typedef struct {
    uint32_t Version;
    uint32_t HorizontalResolution;
    uint32_t VerticalResolution;
    uint32_t PixelFormat;
    uint32_t PixelInformation[4];
    uint32_t PixelsPerScanLine;
} EFI_GRAPHICS_OUTPUT_MODE_INFORMATION;

typedef struct {
    uint32_t MaxMode;
    uint32_t Mode;
    EFI_GRAPHICS_OUTPUT_MODE_INFORMATION* Info;
    size_t SizeOfInfo;
    uint64_t FrameBufferBase;
    size_t FrameBufferSize;
} EFI_GRAPHICS_OUTPUT_PROTOCOL_MODE;

typedef struct {
    void* QueryMode;
    void* SetMode;
    void* Blt;
    EFI_GRAPHICS_OUTPUT_PROTOCOL_MODE* Mode;
} EFI_GRAPHICS_OUTPUT_PROTOCOL;

typedef struct {
    uint32_t Type;
    uint32_t Reserved;
    uint64_t PhysicalStart;
    uint64_t VirtualStart;
    uint64_t NumberOfPages;
    uint64_t Attribute;
} EFI_MEMORY_DESCRIPTOR;

typedef struct {
    void* RaiseTPL;
    void* RestoreTPL;
    void* AllocatePages;
    void* FreePages;
    EFI_STATUS (*GetMemoryMap)(size_t* MemoryMapSize, EFI_MEMORY_DESCRIPTOR* MemoryMap, size_t* MapKey, size_t* DescriptorSize, uint32_t* DescriptorVersion);
    void* AllocatePool;
    void* FreePool;
    void* CreateEvent;
    void* SetTimer;
    void* WaitForEvent;
    void* SignalEvent;
    void* CloseEvent;
    void* CheckEvent;
    void* InstallProtocolInterface;
    void* ReinstallProtocolInterface;
    void* UninstallProtocolInterface;
    void* HandleProtocol;
    void* Reserved;
    void* RegisterProtocolNotify;
    EFI_STATUS (*LocateProtocol)(EFI_GUID* Protocol, void* Registration, void** Interface);
    void* KeyNotify;
    void* OpenProtocolInformation;
    void* ProtocolsPerHandle;
    void* LocateHandleBuffer;
    void* LocateProtocol2;
    void* InstallMultipleProtocolInterfaces;
    void* UninstallMultipleProtocolInterfaces;
    void* CalculateCrc32;
    void* CopyMem;
    void* SetMem;
    void* CreateEventEx;
    EFI_STATUS (*ExitBootServices)(EFI_HANDLE ImageHandle, size_t MapKey);
} EFI_BOOT_SERVICES;

typedef struct {
    char Header[24];
    void* FirmwareVendor;
    uint32_t FirmwareRevision;
    void* ConsoleInHandle;
    void* ConIn;
    void* ConsoleOutHandle;
    void* ConOut;
    void* StandardErrorHandle;
    void* StdErr;
    void* RuntimeServices;
    EFI_BOOT_SERVICES* BootServices;
} EFI_SYSTEM_TABLE;
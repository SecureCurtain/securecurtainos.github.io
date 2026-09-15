/* SecureCurtain OS - Windows PE32+ (COFF / Portable Executable 64-bit) Header
 * Author: Jared Busby (jb7572)
 * Purpose: Windows Persona Dual-Execution Support
 * Target: x86_64 Long Mode
 */

#ifndef _SECURECURTAIN_PE_H
#define _SECURECURTAIN_PE_H

#include <stdint.h>
#include <stddef.h>

#define IMAGE_DOS_SIGNATURE                0x5A4D      // "MZ"
#define IMAGE_NT_SIGNATURE                 0x00004550  // "PE\0\0"
#define IMAGE_FILE_MACHINE_AMD64           0x8664      // x64

#define IMAGE_SUBSYSTEM_WINDOWS_GUI        2
#define IMAGE_SUBSYSTEM_WINDOWS_CUI        3           // Console Application

typedef struct {
    uint16_t e_magic;    // Magic number ("MZ")
    uint16_t e_cblp;
    uint16_t e_cp;
    uint16_t e_crlc;
    uint16_t e_cparhdr;
    uint16_t e_minalloc;
    uint16_t e_maxalloc;
    uint16_t e_ss;
    uint16_t e_sp;
    uint16_t e_csum;
    uint16_t e_ip;
    uint16_t e_cs;
    uint16_t e_lfarlc;
    uint16_t e_ovno;
    uint16_t e_res[4];
    uint16_t e_oemid;
    uint16_t e_oeminfo;
    uint16_t e_res2[10];
    int32_t  e_lfanew;   // File address of new exe header (NT Header offset)
} __attribute__((packed)) IMAGE_DOS_HEADER;

typedef struct {
    uint16_t Machine;
    uint16_t NumberOfSections;
    uint32_t TimeDateStamp;
    uint32_t PointerToSymbolTable;
    uint32_t NumberOfSymbols;
    uint16_t SizeOfOptionalHeader;
    uint16_t Characteristics;
} __attribute__((packed)) IMAGE_FILE_HEADER;

typedef struct {
    uint32_t VirtualAddress;
    uint32_t Size;
} __attribute__((packed)) IMAGE_DATA_DIRECTORY;

typedef struct {
    uint16_t Magic; // 0x20B for PE32+ (64-bit)
    uint8_t  MajorLinkerVersion;
    uint8_t  MinorLinkerVersion;
    uint32_t SizeOfCode;
    uint32_t SizeOfInitializedData;
    uint32_t SizeOfUninitializedData;
    uint32_t AddressOfEntryPoint;
    uint32_t BaseOfCode;
    uint64_t ImageBase;
    uint32_t SectionAlignment;
    uint32_t FileAlignment;
    uint16_t MajorOperatingSystemVersion;
    uint16_t MinorOperatingSystemVersion;
    uint16_t MajorImageVersion;
    uint16_t MinorImageVersion;
    uint16_t MajorSubsystemVersion;
    uint16_t MinorSubsystemVersion;
    uint32_t Win32VersionValue;
    uint32_t SizeOfImage;
    uint32_t SizeOfHeaders;
    uint32_t CheckSum;
    uint16_t Subsystem;
    uint16_t DllCharacteristics;
    uint64_t SizeOfStackReserve;
    uint64_t SizeOfStackCommit;
    uint64_t SizeOfHeapReserve;
    uint64_t SizeOfHeapCommit;
    uint32_t LoaderFlags;
    uint32_t NumberOfRvaAndSizes;
    IMAGE_DATA_DIRECTORY DataDirectory[16];
} __attribute__((packed)) IMAGE_OPTIONAL_HEADER64;

typedef struct {
    uint32_t Signature; // "PE\0\0"
    IMAGE_FILE_HEADER FileHeader;
    IMAGE_OPTIONAL_HEADER64 OptionalHeader;
} __attribute__((packed)) IMAGE_NT_HEADERS64;

typedef struct {
    char     Name[8];
    uint32_t VirtualSize;
    uint32_t VirtualAddress;
    uint32_t SizeOfRawData;
    uint32_t PointerToRawData;
    uint32_t PointerToRelocations;
    uint32_t PointerToLinenumbers;
    uint16_t NumberOfRelocations;
    uint16_t NumberOfLinenumbers;
    uint32_t Characteristics;
} __attribute__((packed)) IMAGE_SECTION_HEADER;

#define IMAGE_DIRECTORY_ENTRY_EXPORT          0
#define IMAGE_DIRECTORY_ENTRY_IMPORT          1
#define IMAGE_DIRECTORY_ENTRY_RESOURCE        2
#define IMAGE_DIRECTORY_ENTRY_EXCEPTION       3
#define IMAGE_DIRECTORY_ENTRY_SECURITY        4
#define IMAGE_DIRECTORY_ENTRY_BASERELOC       5
#define IMAGE_DIRECTORY_ENTRY_DEBUG           6
#define IMAGE_DIRECTORY_ENTRY_TLS             9
#define IMAGE_DIRECTORY_ENTRY_IAT             12

typedef struct {
    uint32_t Characteristics;
    uint32_t TimeDateStamp;
    uint32_t MajorVersion;
    uint32_t MinorVersion;
    uint32_t Name;
    uint32_t Base;
    uint32_t NumberOfFunctions;
    uint32_t NumberOfNames;
    uint32_t AddressOfFunctions;
    uint32_t AddressOfNames;
    uint32_t AddressOfNameOrdinals;
} __attribute__((packed)) IMAGE_EXPORT_DIRECTORY;

typedef struct {
    union {
        uint32_t Characteristics;
        uint32_t OriginalFirstThunk;
    };
    uint32_t TimeDateStamp;
    uint32_t ForwarderChain;
    uint32_t Name;
    uint32_t FirstThunk;
} __attribute__((packed)) IMAGE_IMPORT_DESCRIPTOR;

typedef struct {
    union {
        uint64_t ForwarderString;
        uint64_t Function;
        uint64_t Ordinal;
        uint64_t AddressOfData;
    } u1;
} __attribute__((packed)) IMAGE_THUNK_DATA64;

typedef struct {
    uint16_t Hint;
    char     Name[1];
} __attribute__((packed)) IMAGE_IMPORT_BY_NAME;

#define IMAGE_ORDINAL_FLAG64 0x8000000000000000ULL

#endif /* _SECURECURTAIN_PE_H */

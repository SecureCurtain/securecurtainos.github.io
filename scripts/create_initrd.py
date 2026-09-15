#!/usr/bin/env python3
"""
SecureCurtain OS - Automated Initramfs (USTAR Boot Ramdisk) Generator
Author: Jared Busby (jb7572)

Generates a bootable USTAR initrd.img containing:
  - /initrd/init.elf (Linux Persona Ring 3 test binary)
  - /initrd/init.exe (Windows Persona Ring 3 test binary)
  - /initrd/config.sys
  - /initrd/welcome.txt
"""

import sys
import os
import tarfile
import struct
import io
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BUILD_DIR = ROOT_DIR / "build"
INITRD_OUTPUT = BUILD_DIR / "initrd.img"

def create_synthesized_elf64():
    """
    Creates a minimal valid x86_64 ELF executable:
    Contains an ELF header, one PT_LOAD program header, and machine code that
    executes sys_write and sys_exit.
    """
    # x86_64 machine code:
    #   mov rax, 1           ; sys_write
    #   mov rdi, 1           ; fd 1 (stdout)
    #   lea rsi, [rip + msg] ; pointer to message
    #   mov rdx, len         ; length
    #   syscall
    #   mov rax, 60          ; sys_exit
    #   xor rdi, rdi         ; status 0
    #   syscall
    #   hlt
    msg = b"[INITRD:ELF64] Ring 3 Linux userland payload running!\n"
    
    # Assembly bytes
    # 48 c7 c0 01 00 00 00       mov rax, 1
    # 48 c7 c7 01 00 00 00       mov rdi, 1
    # 48 8d 35 1d 00 00 00       lea rsi, [rip + 29]
    # 48 c7 c2 <len> 00 00 00    mov rdx, len
    # 0f 05                      syscall
    # 48 c7 c0 3c 00 00 00       mov rax, 60
    # 48 31 ff                   xor rdi, rdi
    # 0f 05                      syscall
    # f4                         hlt
    code = bytearray([
        0x48, 0xc7, 0xc0, 0x01, 0x00, 0x00, 0x00,
        0x48, 0xc7, 0xc7, 0x01, 0x00, 0x00, 0x00,
        0x48, 0x8d, 0x35, 0x1d, 0x00, 0x00, 0x00,
        0x48, 0xc7, 0xc2, len(msg), 0x00, 0x00, 0x00,
        0x0f, 0x05,
        0x48, 0xc7, 0xc0, 0x3c, 0x00, 0x00, 0x00,
        0x48, 0x31, 0xff,
        0x0f, 0x05,
        0xf4
    ])
    code.extend(msg)

    # Padding code to 0x100
    load_vaddr = 0x400000
    entry_point = load_vaddr + 0x78 # Entry offset right after headers

    # Construct ELF64 Header (64 bytes)
    e_ident = bytearray(16)
    e_ident[0:4] = b"\x7fELF"
    e_ident[4] = 2 # ELFCLASS64
    e_ident[5] = 1 # ELFDATA2LSB (Little Endian)
    e_ident[6] = 1 # EV_CURRENT
    e_ident[7] = 0 # System V ABI

    ehdr = struct.pack(
        "<16sHHIQQQIHHHHHH",
        bytes(e_ident),
        2,        # ET_EXEC
        62,       # EM_X86_64
        1,        # EV_CURRENT
        entry_point,
        64,       # e_phoff (immediately follows Ehdr)
        0,        # e_shoff
        0,        # e_flags
        64,       # e_ehsize
        56,       # e_phentsize
        1,        # e_phnum
        64,       # e_shentsize
        0,        # e_shnum
        0         # e_shstrndx
    )

    # Program Header (56 bytes)
    file_size = 64 + 56 + len(code)
    phdr = struct.pack(
        "<IIQQQQQQ",
        1,          # PT_LOAD
        5,          # PF_R | PF_X
        0,          # p_offset
        load_vaddr, # p_vaddr
        load_vaddr, # p_paddr
        file_size,  # p_filesz
        file_size,  # p_memsz
        0x1000      # p_align
    )

    return ehdr + phdr + bytes(code)

def create_synthesized_pe32plus():
    """
    Creates a minimal valid x86_64 Windows PE32+ executable:
    Contains DOS Header (MZ), NT Headers, Section Header (.text),
    and machine code invoking Win32 NT system calls.
    """
    msg = b"[INITRD:WIN32] Ring 3 Windows Persona PE32+ running!\n"
    
    # Machine code:
    #   mov r10, 1           ; arg1 = 1 (console stdout)
    #   mov rdx, <ptr>       ; arg2 = buffer
    #   mov r8, <len>        ; arg3 = length
    #   mov eax, 0x0008      ; NtWriteFile
    #   syscall
    #   mov r10, 0           ; exit code 0
    #   mov eax, 0x002c      ; NtTerminateProcess
    #   syscall
    #   hlt
    code = bytearray([
        0x49, 0xc7, 0xc2, 0x01, 0x00, 0x00, 0x00, # mov r10, 1
        0x48, 0x8d, 0x15, 0x20, 0x00, 0x00, 0x00, # lea rdx, [rip + 32]
        0x49, 0xc7, 0xc0, len(msg), 0x00, 0x00, 0x00, # mov r8, len
        0xb8, 0x08, 0x00, 0x00, 0x00,             # mov eax, 0x0008 (NtWriteFile)
        0x0f, 0x05,                               # syscall
        0x49, 0xc7, 0xc2, 0x00, 0x00, 0x00, 0x00, # mov r10, 0
        0xb8, 0x2c, 0x00, 0x00, 0x00,             # mov eax, 0x002c (NtTerminateProcess)
        0x0f, 0x05,                               # syscall
        0xf4                                      # hlt
    ])
    code.extend(msg)

    image_base = 0x140000000
    entry_rva = 0x1000

    dos_header = bytearray(64)
    dos_header[0:2] = b"MZ"
    dos_header[60:64] = struct.pack("<I", 64) # e_lfanew = 64

    # NT Signature: PE\0\0
    nt_sig = b"PE\x00\x00"

    # File Header (20 bytes)
    file_header = struct.pack(
        "<HHIIIHH",
        0x8664,  # Machine: AMD64
        1,       # NumberOfSections
        0,       # TimeDateStamp
        0,       # PointerToSymbolTable
        0,       # NumberOfSymbols
        240,     # SizeOfOptionalHeader
        0x0022   # Characteristics: EXECUTABLE_IMAGE | LARGE_ADDRESS_AWARE
    )

    # Optional Header 64 (240 bytes)
    opt_header = bytearray(240)
    struct.pack_into(
        "<HBBIIIIIQIIHHHHHHIIIIHHQQQQII",
        opt_header,
        0,
        0x020B,       # Magic: PE32+ (64-bit)
        1, 0,         # Linker version
        len(code),    # SizeOfCode
        0, 0,         # Initialized / Uninitialized data
        entry_rva,    # AddressOfEntryPoint
        0x1000,       # BaseOfCode
        image_base,   # ImageBase (64-bit)
        0x1000,       # SectionAlignment
        0x200,        # FileAlignment
        6, 0, 6, 0, 6, 0, # OS / Image / Subsystem versions
        0,            # Win32VersionValue
        0x2000,       # SizeOfImage
        0x200,        # SizeOfHeaders
        0,            # CheckSum
        3,            # Subsystem: IMAGE_SUBSYSTEM_WINDOWS_CUI (Console)
        0x8160,       # DllCharacteristics
        0x100000, 0x1000, # Stack reserve / commit
        0x100000, 0x1000, # Heap reserve / commit
        0,            # LoaderFlags
        16            # NumberOfRvaAndSizes
    )

    # Section Header (.text, 40 bytes)
    sec_header = bytearray(40)
    sec_name = b".text\x00\x00\x00"
    struct.pack_into(
        "<8sIIIIIIHHI",
        sec_header,
        0,
        sec_name,
        len(code),    # VirtualSize
        0x1000,       # VirtualAddress
        0x200,        # SizeOfRawData
        0x200,        # PointerToRawData
        0, 0, 0, 0,
        0x60000020    # Characteristics: CODE | EXECUTE | READ
    )

    headers = bytes(dos_header) + nt_sig + file_header + bytes(opt_header) + bytes(sec_header)
    # Pad headers to FileAlignment (512 bytes)
    headers = headers.ljust(512, b"\x00")

    # Pad code to FileAlignment
    raw_code = bytes(code).ljust(512, b"\x00")

    return headers + raw_code

def build_initrd(output_path=INITRD_OUTPUT):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"[*] Packaging USTAR Boot Ramdisk -> {output_path}...")

    elf_data = create_synthesized_elf64()
    pe_data = create_synthesized_pe32plus()

    welcome_text = (
        "======================================================================\n"
        "  SecureCurtain OS - Dual-Persona Bare-Metal Microkernel Ramdisk\n"
        "  Architecture: x86_64 Long Mode\n"
        "  Subsystems: Linux POSIX + Windows NT Dual Userland Execution\n"
        "======================================================================\n"
    ).encode("utf-8")

    config_sys = (
        "[boot]\n"
        "default_persona=linux\n"
        "allow_windows_pe=1\n"
        "root=/dev/nvme0n1p2\n"
        "audit=strict\n"
    ).encode("utf-8")

    with tarfile.open(output_path, "w", format=tarfile.USTAR_FORMAT) as tar:
        # Add init.elf
        ti_elf = tarfile.TarInfo(name="init.elf")
        ti_elf.size = len(elf_data)
        ti_elf.mode = 0o755
        tar.addfile(ti_elf, io.BytesIO(elf_data))

        # Add init.exe
        ti_pe = tarfile.TarInfo(name="init.exe")
        ti_pe.size = len(pe_data)
        ti_pe.mode = 0o755
        tar.addfile(ti_pe, io.BytesIO(pe_data))

        # Add welcome.txt
        ti_txt = tarfile.TarInfo(name="welcome.txt")
        ti_txt.size = len(welcome_text)
        ti_txt.mode = 0o644
        tar.addfile(ti_txt, io.BytesIO(welcome_text))

        # Add config.sys
        ti_cfg = tarfile.TarInfo(name="config.sys")
        ti_cfg.size = len(config_sys)
        ti_cfg.mode = 0o644
        tar.addfile(ti_cfg, io.BytesIO(config_sys))

        # Include compiled user-space subsystem binaries from build/bin and sys/dist/user_space_payload/bin
        bin_sources = [
            (BUILD_DIR / "bin", "bin"),
            (ROOT_DIR / "sys" / "dist" / "user_space_payload" / "bin", "bin"),
            (ROOT_DIR / "sysroot" / "system" / "bin", "system/bin"),
        ]
        added_files = set()
        for src_dir, arc_prefix in bin_sources:
            if src_dir.exists():
                for f in src_dir.glob("*"):
                    if f.is_file() and f.name not in added_files:
                        added_files.add(f.name)
                        arc_name = f"{arc_prefix}/{f.name}"
                        with open(f, "rb") as bf:
                            bdata = bf.read()
                        ti_b = tarfile.TarInfo(name=arc_name)
                        ti_b.size = len(bdata)
                        ti_b.mode = 0o755
                        tar.addfile(ti_b, io.BytesIO(bdata))
                        print(f"  [+] Bundled into initrd: {arc_name} ({len(bdata)} bytes)")

        # Include complete Linux Kernel Driver Server source & header trees
        linux_driver_dir = ROOT_DIR / "sys" / "kernel" / "src" / "linux"
        if linux_driver_dir.exists():
            print("  [*] Bundling Linux Kernel Driver Server tree into initrd...")
            for fpath in linux_driver_dir.rglob("*"):
                if fpath.is_file():
                    rel_p = fpath.relative_to(linux_driver_dir)
                    arc_name = f"drivers/linux/{rel_p.as_posix()}"
                    with open(fpath, "rb") as df:
                        ddata = df.read()
                    ti_d = tarfile.TarInfo(name=arc_name)
                    ti_d.size = len(ddata)
                    ti_d.mode = 0o644
                    tar.addfile(ti_d, io.BytesIO(ddata))
            print(f"  [+] Included Linux Driver Server tree from {linux_driver_dir}")

    size_kb = output_path.stat().st_size / 1024
    print(f"[+] USTAR Initrd successfully created: {output_path} ({size_kb:.1f} KB)")
    return True

if __name__ == "__main__":
    build_initrd()

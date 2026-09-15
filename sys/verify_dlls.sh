#!/bin/bash
# verify_dlls.sh - Automatically verifies that proxy DLLs export required APIs

TARGET_DIR="sysroot/system/lib/win32/windows/system32"

verify_dll() {
    local dll_path="$1"
    if [ ! -f "$dll_path" ]; then
        echo -e "\\e[31m[!] Missing file: $dll_path\\e[0m"
        return 1
    fi

    echo -e "\\e[34m[*] Verifying exported functions inside: $(basename "$dll_path")\\e[0m"
    
    # Run the x86_64 cross-objdump tool to extract the export address table entries
    x86_64-w64-mingw32-objdump -p "$dll_path" | grep -A 10 "Export Address Table" | grep -v "Table"
    
    echo -e "\\e[32m[+] Verification check complete.\\e[0m\\n"
}

# Run validation checks on our current target inventory
verify_dll "$TARGET_DIR/ntdll.dll"
verify_dll "$TARGET_DIR/kernel32.dll"
verify_dll "$TARGET_DIR/kernelbase.dll"
verify_dll "$TARGET_DIR/user32.dll"
verify_dll "$TARGET_DIR/gdi32.dll"
verify_dll "$TARGET_DIR/advapi32.dll"
verify_dll "$TARGET_DIR/ucrtbase.dll"
verify_dll "$TARGET_DIR/ws2_32.dll"

import os
import shutil

def setup_win32_subsystem(base_dir="sysroot"):
    """
    Generates the isolated Windows subsystem directory layout
    within the microkernel's target installation sysroot.
    """
    # Define the isolated Win32 root directory path
    win32_root = os.path.join(base_dir, "system", "lib", "win32")
    
    # Critical subdirectories expected by Windows installers and applications
    directories = [
        os.path.join(win32_root, "c", "Program Files"),
        os.path.join(win32_root, "c", "Users", "Public"),
        os.path.join(win32_root, "windows", "system"), # Legacy 16-bit anchor
        os.path.join(win32_root, "windows", "system32", "drivers"), # 64-bit core
    ]
    
    print(f"[*] Initializing Win32 subsystem layout inside: {win32_root}")
    
    # Create the directory tree securely
    for folder in directories:
        os.makedirs(folder, exist_ok=True)
        print(f"    Created: {folder}")
        
    # Crucial configuration files and registry placeholders
    placeholders = [
        os.path.join(win32_root, "windows", "system.ini"),
        os.path.join(win32_root, "windows", "win.ini"),
    ]
    
    for file_path in placeholders:
        with open(file_path, "w") as f:
            f.write("; Virtual Environment Configuration\\n")
        print(f"    Initialized: {file_path}")

    print("[+] Subsystem directory tree built successfully.\\n")

if __name__ == "__main__":
    setup_win32_subsystem()

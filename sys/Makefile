# ==============================================================================
# Microkernel Windows Subsystem Master Multi-DLL Build Engine
# ==============================================================================

# Append your hardware MMU driver targets into your core system build block definitions list
KERNEL_SRCS   = kernel/src/main.c kernel/src/kernel.c kernel/src/interrupt.c kernel/src/nt_sync.c kernel/src/mmu.c

SYSROOT       ?= sysroot
TARGET_DIR    = $(SYSROOT)/system/lib/win32/windows/system32
BIN_DIR       = $(SYSROOT)/system/bin

# Two different compilers for two different execution worlds
HOST_CC       = gcc
MINGW_CC      = x86_64-w64-mingw32-gcc

CFLAGS_DLL    = -O2 -Wall -Wextra -nostdlib -nodefaultlibs
LDFLAGS_DLL   = -shared -Wl,--subsystem,windows

# Locate source structures
SRCS          = $(wildcard subsystems/win32/*.c)
# Filter out loader.c and dll_entry.c from the DLL compilation pool
DLL_SRCS      = $(filter-out subsystems/win32/loader.c subsystems/win32/dll_entry.c, $(SRCS))
DLLS          = $(patsubst subsystems/win32/%.c,$(TARGET_DIR)/%.dll,$(DLL_SRCS))

LOADER_SRC    = subsystems/win32/loader.c
LOADER_OUT    = $(BIN_DIR)/loader.bin
DLL_ENTRY_SRC = subsystems/win32/dll_entry.c

# Append to your existing file system compilation variables
VFS_SRC       = subsystems/vfs/vfs.c subsystems/vfs/ntfs_parser.c subsystems/vfs/ntfs_directory.c subsystems/vfs/ntfs_overflow.c
VFS_OUT       = $(BIN_DIR)/vfs.bin

# Add the new binaries to your output file generation arrays
CONFIG_APP_OUT  = $(SYSROOT)/system/bin/fw_config.bin
LOGGER_APP_OUT  = $(SYSROOT)/system/bin/fw_logger.bin
HIPS_GUI_OUT    = $(SYSROOT)/system/bin/hips_gui.bin
STARTUP_OUT     = $(BIN_DIR)/startup.bin
STARTUP_GUI_OUT = $(BIN_DIR)/startup_gui.bin
INPUT_OUT       = $(BIN_DIR)/input.bin

.PHONY: all clean prep_dirs verify

# The full system compilation pipeline sequence
all: prep_dirs $(DLLS) $(LOADER_OUT) $(NETWORK_OUT) $(VFS_OUT) $(CONFIG_APP_OUT) $(LOGGER_APP_OUT) $(HIPS_GUI_OUT) $(STARTUP_OUT) $(STARTUP_GUI_OUT) $(INPUT_OUT) verify

prep_dirs:
	@mkdir -p $(BIN_DIR) $(TARGET_DIR)
	@python3 build_subsystem.py $(SYSROOT)

# Pattern rule: Compiles proxy DLLs using MinGW
$(TARGET_DIR)/%.dll: subsystems/win32/%.c subsystems/win32/%.def $(DLL_ENTRY_SRC)
	@mkdir -p $(@D)
	@echo "[*] Compiling clean-room proxy: $(notdir $@)"
	@$(MINGW_CC) $(CFLAGS_DLL) $(LDFLAGS_DLL) -o $@ $< $(DLL_ENTRY_SRC) $(patsubst %.c,%.def,$<)

# Rule to compile your native microkernel program loader 
$(LOADER_OUT): $(LOADER_SRC)
	@mkdir -p $(@D)
	@echo "[*] Compiling native microkernel program loader: $(notdir $@)"
	@$(HOST_CC) -O2 -Wall -c $< -o $@

$(VFS_OUT): $(VFS_SRC)
	@mkdir -p $(@D)
	@echo "[*] Compiling user-space Virtual File System Router: $(notdir $@)"
	@$(HOST_CC) -O2 -Wall -c $< -o $@

$(CONFIG_APP_OUT): subsystems/apps/fw_config.c
	@mkdir -p $(@D)
	@echo "[*] Compiling Firewall Configuration GUI: $(notdir $@)"
	@$(HOST_CC) -O2 -Wall -c $< -o $@

$(LOGGER_APP_OUT): subsystems/apps/fw_logger.c
	@mkdir -p $(@D)
	@echo "[*] Compiling Firewall Logging GUI: $(notdir $@)"
	@$(HOST_CC) -O2 -Wall -c $< -o $@

$(HIPS_GUI_OUT): subsystems/apps/hips_gui.c
	@mkdir -p $(@D)
	@echo "[*] Compiling HIPS Drag-and-Drop Management GUI: $(notdir $@)"
	@$(HOST_CC) -O2 -Wall -c $< -o $@

$(STARTUP_OUT): subsystems/apps/startup.c
	@mkdir -p $(@D)
	@echo "[*] Compiling Startup Orchestration Service Daemon: $(notdir $@)"
	@$(HOST_CC) -O2 -Wall -c $< -o $@

$(STARTUP_GUI_OUT): subsystems/apps/startup_gui.c
	@mkdir -p $(@D)
	@echo "[*] Compiling Startup Configuration GUI: $(notdir $@)"
	@$(HOST_CC) -O2 -Wall -c $< -o $@

$(INPUT_OUT): subsystems/input/input.c
	@mkdir -p $(@D)
	@echo "[*] Compiling user-space Hardware Input Routing Server: $(notdir $@)"
	@$(HOST_CC) -O2 -Wall -c $< -o $@

verify:
	@chmod +x ./verify_dlls.sh 2>/dev/null || true
	@bash ./verify_dlls.sh

clean:
	@echo "[*] Cleaning all subsystem target binaries..."
	@rm -f $(TARGET_DIR)/*.dll
	@rm -f $(LOADER_OUT)
	@rm -f $(VFS_OUT)
	@rm -f $(CONFIG_APP_OUT)
	@rm -f $(LOGGER_APP_OUT)
	@rm -f $(HIPS_GUI_OUT)
	@rm -f $(STARTUP_OUT)
	@rm -f $(STARTUP_GUI_OUT)
	@rm -f $(INPUT_OUT)

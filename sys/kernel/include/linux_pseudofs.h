// =========================================================================
// LINUX SYNTHETIC PSEUDO-FS & NATIVE DESKTOP EMULATION LAYER HEADER
// =========================================================================
#ifndef SECURECURTAIN_LINUX_PSEUDOFS_H
#define SECURECURTAIN_LINUX_PSEUDOFS_H

#include <stdint.h>
#include <stdbool.h>

void    init_linux_pseudofs(void);
bool    is_linux_pseudofs_path(const char* path);
int32_t linux_pseudofs_open(const char* path, const char* mode);
int32_t linux_pseudofs_read(int32_t fd, uint8_t* buffer, uint32_t len);
int32_t linux_pseudofs_write(int32_t fd, const uint8_t* buffer, uint32_t len);
void    linux_pseudofs_close(int32_t fd);
int32_t linux_pseudofs_stat(const char* path, void* statbuf);

// Specific SecureCurtain Native Desktop emulation triggers
void    sys_desktop_power_shutdown(void);
void    sys_desktop_power_reboot(void);

#endif

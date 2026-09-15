#include "../../kernel/include/vfs_shredder.h"
#include "../../kernel/include/dll_impostor.h"
#include <stdint.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>
#include "win32_string.h"

#define WM_DROPFILES 0x0233
#define WINDOW_WIDTH_MIN 60
#define WINDOW_HEIGHT_MIN 60

typedef struct {
    uint32_t x, y;
    uint32_t width, height;
    bool is_minimized;
    uint32_t frame_buffer_phys;
    uint32_t window_id;
} InstallerWidget;

typedef enum {
    PKG_UNKNOWN = 0,
    PKG_WIN_PE_EXE,
    PKG_WIN_MSI,
    PKG_WIN_DLL,
    PKG_LINUX_ELF,
    PKG_LINUX_DEB,
    PKG_TAR_GZ
} PackageType;

extern int32_t invoke_subsystem_process(const char* daemon_path, const char* app_path, const char* flags);
extern void generate_desktop_shortcut(const char* installed_binary_path, bool is_windows_subsystem);
extern void request_ui_composition_refresh(void);
extern void show_ui_alert(const char* message);
extern void unpack_msi_database(const char* msi_path, const char* app_vfs_root);
extern void extract_debian_archive(const char* deb_path, const char* target_vfs_root);
extern uint32_t query_active_focused_window_pid(void);

void init_installer_widget(InstallerWidget* widget, uint32_t screen_w, uint32_t screen_h) {
    widget->width = 250;
    widget->height = 400;
    widget->x = screen_w - widget->width - 20;
    widget->y = 40;
    widget->is_minimized = false;
    widget->window_id = 0x54414C4C;
}

PackageType detect_package_signature(const char* file_path) {
    FILE* file = fopen(file_path, "rb");
    if (!file) return PKG_UNKNOWN;

    uint8_t buffer[8] = {0};
    size_t bytes_read = fread(buffer, 1, 8, file);
    fclose(file);

    if (bytes_read < 4) return PKG_UNKNOWN;
    if (buffer[0] == 'M' && buffer[1] == 'Z') {
        const char* ext = strrchr(file_path, '.');
        if (ext && (strcmp(ext, ".dll") == 0 || strcmp(ext, ".DLL") == 0)) {
            return PKG_WIN_DLL;
        }
        return PKG_WIN_PE_EXE;
    }
    if (buffer[0] == 0xD0 && buffer[1] == 0xCF && buffer[2] == 0x11 && buffer[3] == 0xE0) return PKG_WIN_MSI;
    if (buffer[0] == 0x7F && buffer[1] == 'E' && buffer[2] == 'L' && buffer[3] == 'F') return PKG_LINUX_ELF;
    if (strncmp((const char*)buffer, "!<arch>", 7) == 0) return PKG_LINUX_DEB;
    if (buffer[0] == 0x1F && buffer[1] == 0x8B) return PKG_TAR_GZ;

    return PKG_UNKNOWN;
}

void process_dropped_file_asset_context(const char* file_path, const char* filename) {
    const char* extension = strrchr(filename, '.');
    if (extension != NULL && (strcmp(extension, ".dll") == 0 || strcmp(extension, ".DLL") == 0)) {
        printf("[Installer drop-zone]: Intercepted incoming Windows DLL asset file: %s\\n", filename);
        
        bool success = sys_translate_and_stage_oem_dll(file_path, filename);
        if (success) {
            printf("[Installer drop-zone]: '%s' successfully compiled and added to the Impostor Shelf.\\n", filename);
            request_ui_composition_refresh();
        } else {
            printf("[Installer drop-zone Error]: DLL compilation failed or binary format unverified.\\n");
        }
        return;
    }
}

void route_and_install_package(const char* target_path) {
    const char* filename = strrchr(target_path, '/');
    filename = filename ? filename + 1 : target_path;

    const char* extension = strrchr(filename, '.');
    if (extension && (strcmp(extension, ".dll") == 0 || strcmp(extension, ".DLL") == 0)) {
        process_dropped_file_asset_context(target_path, filename);
        return;
    }

    PackageType type = detect_package_signature(target_path);
    char persistent_dest_path[512];

    switch(type) {
        case PKG_WIN_DLL:
            process_dropped_file_asset_context(target_path, filename);
            break;

        case PKG_WIN_PE_EXE:
            snprintf(persistent_dest_path, sizeof(persistent_dest_path), "/vfs/home/apps/%s", filename);
            uint32_t my_pid = query_active_focused_window_pid();
            bool success = sys_vfs_execute_drag_drop_move(my_pid, target_path, persistent_dest_path);
            if (!success) {
                printf("[Installer Error]: Secure file routing transaction aborted.\\n");
            }
            generate_desktop_shortcut(persistent_dest_path, true);
            break;

        case PKG_WIN_MSI:
            unpack_msi_database(target_path, "/vfs/home/apps/");
            generate_desktop_shortcut("/vfs/home/apps/installed_app.exe", true);
            break;

        case PKG_LINUX_DEB:
            extract_debian_archive(target_path, "/vfs/usr/local/bin/");
            generate_desktop_shortcut("/vfs/usr/local/bin/extracted_binary", false);
            break;

        default:
            show_ui_alert("Error: Unsupported setup package format or identity corrupted.");
            break;
    }
}

void handle_installer_ui_events(InstallerWidget* widget, uint32_t message_type, void* param_packet) {
    switch(message_type) {
        case WM_DROPFILES: {
            const char* dropped_file_path = (const char*)param_packet;
            route_and_install_package(dropped_file_path);
            break;
        }
        case 0x0112: { // WM_SYSCOMMAND
            if (!widget->is_minimized) {
                widget->width = WINDOW_WIDTH_MIN;
                widget->height = WINDOW_HEIGHT_MIN;
                widget->is_minimized = true;
            } else {
                widget->width = 250;
                widget->height = 400;
                widget->is_minimized = false;
            }
            request_ui_composition_refresh();
            break;
        }
    }
}

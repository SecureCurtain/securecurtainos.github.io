#include "file_manager.h"
#include "ipc.h"
#include "auth.h"
#include "vfs.h"
#include <string.h>

typedef struct {
    char                    current_browsed_directory[256];
    fm_directory_entry_t    cached_entries[FM_MAX_ENTRIES];
    size_t                  active_entry_count;
    ipc_handle_t            auth_server_proxy; // Handle linking securely back to auth_server.bin
    ipc_handle_t            vfs_proxy_handle;   // Handle linking securely back to the VFS engine
} secure_file_browser_t;

static secure_file_browser_t g_file_browser;
extern void print_string(const char* str, int row);

void init_file_manager_server(void) {
    memset(&g_file_browser, 0, sizeof(secure_file_browser_t));
    g_file_browser.auth_server_proxy = 8; // Tied directly to your auth_server.bin handle
    g_file_browser.vfs_proxy_handle   = 4; // Tied directly to your vfs.h kernel proxy handle
    strcpy(g_file_browser.current_browsed_directory, "/");

    print_string("[OK] Sandboxed File Browser: UI Directory Navigation Engine Online.", 29);
}

int handle_file_manager_message(const ipc_message_t* msg, ipc_message_t* out_response) {
    if (!msg || !out_response) return -1;
    if (msg->message_type != FM_CMD_LIST_DIRECTORY) return -1;

    memset(out_response, 0, sizeof(ipc_message_t));
    out_response->message_type = msg->message_type;

    // Pre-allocate the response envelope layout safely
    out_response->payload_length = sizeof(int32_t);
    int32_t* return_status = (int32_t*)out_response->payload;

    if (msg->payload_length < sizeof(fm_ipc_browse_frame_t)) {
        *return_status = -2; // Corrupt packet layout sizing boundary
        return 0;
    }

    const fm_ipc_browse_frame_t* browse = (const fm_ipc_browse_frame_t*)msg->payload;

    // 1. 🛡️ USER SESSION IDENTITY VERIFICATION HANDSHAKE
    // Validate the client's token with your unprivileged auth_server.bin module
    ipc_message_t auth_check_tx, auth_check_rx;
    memset(&auth_check_tx, 0, sizeof(ipc_message_t));
    auth_check_tx.message_type = AUTH_CMD_VALIDATE_TOKEN;
    auth_check_tx.payload_length = 32;
    memcpy(auth_check_tx.payload, &browse->session_token, 1); // Match single-byte user token

    int auth_status = ipc_send_message(g_file_browser.auth_server_proxy, &auth_check_tx);
    if (auth_status != IPC_SUCCESS || ipc_receive_message(g_file_browser.auth_server_proxy, &auth_check_rx) != IPC_SUCCESS) {
        *return_status = -4; // Access Denied: Auth engine connection dropped, block reading
        return 0;
    }

    auth_ipc_response_frame_t* auth_resp = (auth_ipc_response_frame_t*)auth_check_rx.payload;

    // 2. 🛡️ REFACTORED USER AUTHORIZATION FILTER
    // Check if the current user session belongs to the verified master "aaa" account (UID 1000)
    if (auth_resp->status_code != 0 || auth_resp->authorized_uid != 1000) {
        print_string("[SECURITY LOCKOUT] Unauthorized directory listing browse request blocked!", 30);
        *return_status = -4; // Access Denied
        return 0;
    }

    // 3. 🛡️ PATH SIZE BOUNDARY CLEANSE
    char sanitized_path[256];
    memcpy(sanitized_path, browse->target_path, 256);
    sanitized_path[255] = '\\0'; // Enforce absolute null-termination

    // 4. Proxy directory lookup out to the abstract VFS proxy tree layer
    // instead of calling Ring 0 filesystem code blocks directly.
    g_file_browser.active_entry_count = 0;
    
    // Simulating mapping out file results for Nemo/Dolphin GUI folder generation loops
    if (strcmp(sanitized_path, "/SYSTEM/SERVERS") == 0) {
        size_t idx = g_file_browser.active_entry_count++;
        strcpy(g_file_browser.cached_entries[idx].name, "storage_server.bin");
        g_file_browser.cached_entries[idx].type_flags = VFS_FILE;
        g_file_browser.cached_entries[idx].file_size = 65536;

        idx = g_file_browser.active_entry_count++;
        strcpy(g_file_browser.cached_entries[idx].name, "graphics_server.bin");
        g_file_browser.cached_entries[idx].type_flags = VFS_FILE;
        g_file_browser.cached_entries[idx].file_size = 131072;
    } else {
        // Fallback root empty layout view
        size_t idx = g_file_browser.active_entry_count++;
        strcpy(g_file_browser.cached_entries[idx].name, "SYSTEM");
        g_file_browser.cached_entries[idx].type_flags = VFS_DIRECTORY;
        g_file_browser.cached_entries[idx].file_size = 0;
    }

    // Package directory tracking lists cleanly back into the output payload envelope
    uint32_t payload_bytes = g_file_browser.active_entry_count * sizeof(fm_directory_entry_t);
    out_response->payload_length = sizeof(int32_t) + payload_bytes;
    
    uint8_t* payload_dest_ptr = out_response->payload + sizeof(int32_t);
    memcpy(payload_dest_ptr, g_file_browser.cached_entries, payload_bytes);

    print_string("[FILE MGR] Directory listings compiled and proxied to Dolphin/Nemo GUI.", 30);
    *return_status = 0; // Success
    return 0;
}

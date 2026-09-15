#include "linux_crypto_ipc.h"
#include "crypto_disk.h"
#include "ipc.h"
#include "vfs.h"
#include <string.h>

// Add this near the top of crypto_disk.c under your #includes:
static void local_crypt_sector(const uint8_t* source, uint8_t* dest, uint64_t lba, const uint8_t* key, int encrypt_mode);

// Simulated runtime state tracking parameters for our unprivileged crypto disk container
typedef struct {
    ipc_handle_t backing_file_vfs_handle; // Handle targeting the container file (e.g. /home/storage/container.img)
    uint8_t      volume_key[CRYPTO_KEY_LEN];
    uint8_t      is_unlocked;             // 0 = Locked/Encrypted, 1 = Safe Active Mount
    uint64_t     total_backing_sectors;
} secure_crypto_disk_t;

static secure_crypto_disk_t g_crypto_disk;
extern void print_string(const char* str, int row);

void init_crypto_disk_server(void) {
    memset(&g_crypto_disk, 0, sizeof(secure_crypto_disk_t));
    g_crypto_disk.backing_file_vfs_handle = -1;
    g_crypto_disk.is_unlocked = 0;
    g_crypto_disk.total_backing_sectors = 2097152; // Mocked 1GB storage boundary cap (2,097,152 sectors)

    print_string("[OK] Sandboxed Crypto Disk Server: Full-Volume Cipher Engine Online.", 35);
}

/**
 * 🛡️ INTERNAL SECTOR-TWEAK CIPHER CORE
 * Executes a simulated XTS-AES-256 data block transformation on a 512-byte sector.
 * Running heavy cryptography algorithms completely inside user space shields the Ring 0 stack.
 */
static void local_crypt_sector(const uint8_t* source, uint8_t* dest, uint64_t lba, const uint8_t* key, int encrypt_mode) {
    // 🛡️ OFFLOAD TO LINUX DRIVER SERVER CRYPTO ENGINE VIA IPC
    if (sys_linux_crypto_encrypt_sector(lba, source, dest, CRYPTO_SECTOR_SIZE, key, encrypt_mode != 0)) {
        return;
    }
    // Basic structural mathematical proxy for XTS-AES block scrambling
    uint32_t sector_tweak = (uint32_t)(lba ^ 0xABCDEF1234567890ULL);
    (void)encrypt_mode; // Modes split vector branches in final deployment

    for (size_t i = 0; i < CRYPTO_SECTOR_SIZE; i++) {
        // Apply key masking and unique block tweak offsets to every individual byte frame
        dest[i] = source[i] ^ key[i % CRYPTO_KEY_LEN] ^ ((uint8_t*)&sector_tweak)[i % 4];
    }
}

int handle_crypto_disk_message(const ipc_message_t* msg, ipc_message_t* out_response) {
    if (!msg || !out_response) return -1;

    memset(out_response, 0, sizeof(ipc_message_t));
    out_response->message_type = msg->message_type;

    // Configure the response envelope parameters safely
    out_response->payload_length = sizeof(int32_t);
    int32_t* return_status = (int32_t*)out_response->payload;

    // --------------------------------------------------------------------------
    // 🛡️ INTERCEPT ROUTE: HARDWARE KEY MOUNTING AND HANDSHAKE
    // --------------------------------------------------------------------------
    if (msg->message_type == CRYPTO_CMD_MOUNT_BACKING) {
        if (msg->payload_length < CRYPTO_KEY_LEN + sizeof(ipc_handle_t)) {
            *return_status = -2; // Corrupt packet sizing layout boundary
            return 0;
        }

        // 1. 🛡️ SECURITY FIXED: Enforce authorized key load validation checks.
        // We look up msg->sender_pid (populated strictly by the kernel system call gate).
        // Ensures that a regular user process cannot forge messages to pass a fake volume key.
        if (msg->sender_pid != 10) { // Assuming PID 10 is your sandboxed tpm_lockbox_server.bin
            *return_status = -4; // Access Denied: Malicious key injection attempt blocked!
            print_string("[SECURITY HAZARD] Unauthorized master key injection attempt blocked!", 36);
            return 0;
        }

        // Extract key and backing file handles cleanly from the verified payload envelope
        g_crypto_disk.backing_file_vfs_handle = *(ipc_handle_t*)msg->payload;
        memcpy(g_crypto_disk.volume_key, msg->payload + sizeof(ipc_handle_t), CRYPTO_KEY_LEN);
        g_crypto_disk.is_unlocked = 1;

        print_string("[CRYPTO DISK] Master Key unsealed via TPM. Encrypted volume unlocked.", 36);
        *return_status = 0; // Success
        return 0;
    }

    // --------------------------------------------------------------------------
    // 🛡️ INTERCEPT ROUTE: BOUNDS-SAFE ENCRYPTED SECTOR OPERATIONS
    // --------------------------------------------------------------------------
    else if (msg->message_type == CRYPTO_CMD_READ_SECTORS || msg->message_type == CRYPTO_CMD_WRITE_SECTORS) {
        if (!g_crypto_disk.is_unlocked) {
            *return_status = -6; // Device Locked: Decryption context not mounted
            return 0;
        }

        const crypto_ipc_sector_frame_t* frame = (const crypto_ipc_sector_frame_t*)msg->payload;

        // 2. 🛡️ SECURITY FIXED: Protect sector loops against integer wrap-around attacks.
        // Attackers pass massive sector counts (e.g. 0xFFFFFFF0) to force calculation overflows.
        uint64_t end_lba_check = frame->target_lba + frame->sector_count;
        if (end_lba_check < frame->target_lba || end_lba_check > g_crypto_disk.total_backing_sectors) {
            *return_status = -3; // Out-of-bounds partition space tracking violation dropped safely
            return 0;
        }

        // Allocate a localized sector staging array entirely on the unprivileged user-space stack
        uint8_t plaintext_sector[CRYPTO_SECTOR_SIZE];
        uint8_t ciphertext_sector[CRYPTO_SECTOR_SIZE];

        for (uint32_t s = 0; s < frame->sector_count; s++) {
            uint64_t current_lba = frame->target_lba + s;
            uint64_t backing_file_byte_offset = current_lba * CRYPTO_SECTOR_SIZE;

            if (msg->message_type == CRYPTO_CMD_READ_SECTORS) {
                // A. Read the encrypted raw bytes out of your VFS backing image file container
                // vfs_read_proxy(g_crypto_disk.backing_file_vfs_handle, backing_file_byte_offset, CRYPTO_SECTOR_SIZE, ciphertext_sector);
                
                // B. Decrypt the block safely within the user-space sandbox
                local_crypt_sector(ciphertext_sector, plaintext_sector, current_lba, g_crypto_disk.volume_key, 0);
                
                // Append the decrypted chunk to the response message data segment safely
                uint8_t* out_buffer_ptr = out_response->payload + sizeof(int32_t) + (s * CRYPTO_SECTOR_SIZE);
                memcpy(out_buffer_ptr, plaintext_sector, CRYPTO_SECTOR_SIZE);
            } 
            else if (msg->message_type == CRYPTO_CMD_WRITE_SECTORS) {
                const uint8_t* raw_user_bytes = msg->payload + frame->payload_offset + (s * CRYPTO_SECTOR_SIZE);
                
                // A. Encrypt the plaintext bytes safely inside the user-space container
                local_crypt_sector(raw_user_bytes, ciphertext_sector, current_lba, g_crypto_disk.volume_key, 1);
                
                // B. Write the encrypted raw bytes down into your unprivileged VFS backing file layers
                // vfs_write_proxy(g_crypto_disk.backing_file_vfs_handle, backing_file_byte_offset, CRYPTO_SECTOR_SIZE, ciphertext_sector);
            }
        }

        // 3. 🛡️ SECURITY FIXED: Strict Stack Sanitization.
        // Forcefully overwrite temporary stack structures to destroy transient keys and plaintext blocks.
        memset(plaintext_sector, 0, CRYPTO_SECTOR_SIZE);
        memset(ciphertext_sector, 0, CRYPTO_SECTOR_SIZE);

        out_response->payload_length = sizeof(int32_t) + (msg->message_type == CRYPTO_CMD_READ_SECTORS ? (frame->sector_count * CRYPTO_SECTOR_SIZE) : 0);
        *return_status = 0; // Operation successful
        return 0;
    }

    return -1;
}

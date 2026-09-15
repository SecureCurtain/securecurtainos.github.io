#include "sys_editor_gui.h"
#include "../../kernel/include/ext_vault.h"
#include "../../kernel/include/rbac.h"
#include <string.h>
#include <stdio.h>

static CodeEditorWorkspaceContext g_editor;

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern uint32_t query_active_focused_window_pid(void);
extern bool sys_commit_filesystem_metadata_update(uint32_t target_lba, const uint8_t* metadata_buffer);

void init_secure_text_editor(void) {
    memset(&g_editor, 0, sizeof(CodeEditorWorkspaceContext));
    strcpy(g_editor.active_file_path, "/vfs/home/operator/Documents/firewall_rules.yaml");
    
    // Seed standard boilerplate YAML setup configuration structures
    strcpy(g_editor.text_buffer[0], "# Custom Declarative IPS Rules Matrix");
    strcpy(g_editor.text_buffer[1], "rule_profile:");
    strcpy(g_editor.text_buffer[2], "    type: network_firewall");
    strcpy(g_editor.text_buffer[3], "    pattern: SELECT_UNION");
    strcpy(g_editor.text_buffer[4], "    action: DROP");
    
    g_editor.total_lines = 5;
    g_editor.cursor_row = 5;
    g_editor.cursor_col = 0;
    g_editor.is_modified_dirty = false;
    g_editor.is_yaml_syntax_valid = true;

    // Run initial syntax classification sweep across seeded entries
    for (uint32_t i = 0; i < g_editor.total_lines; i++) {
        sys_editor_execute_inline_yaml_scan(i);
    }
}

void sys_editor_execute_inline_yaml_scan(uint32_t line_index) {
    if (line_index >= ED_MAX_LINES) return;
    char* line = g_editor.text_buffer[line_index];
    uint32_t len = strlen(line);

    // 1. Classification: Comment Rule (Starts with standard hash token '#')
    // Strip out leading indentation spaces first
    uint32_t start_idx = 0;
    while (line[start_idx] == ' ' && start_idx < len) {
        start_idx++;
    }

    if (line[start_idx] == '#') {
        g_editor.line_syntax_attributes[line_index] = 0; // Comment attribute (Muted Slate Color)
        return;
    }

    if (len == 0 || start_idx == len) {
        g_editor.line_syntax_attributes[line_index] = 1; // Standard blank line
        return;
    }

    // 2. Classification: Structured Key Prober (Looks for mandatory colon ':' descriptor)
    const char* colon_ptr = strchr(line, ':');
    if (colon_ptr != NULL) {
        g_editor.line_syntax_attributes[line_index] = 2; // Key-Value Statement (Cyan/Blue focus highlight)
        
        // Industry-Compliance Validator: Ensure no trailing garbage characters sit right after key colons
        // In clean YAML, a colon must be immediately followed by a space, a newline, or quote marks
        if (*(colon_ptr + 1) != '\\0' && *(colon_ptr + 1) != ' ' && *(colon_ptr + 1) != '"' && *(colon_ptr + 1) != '\\'') {
            g_editor.line_syntax_attributes[line_index] = 3; // SYNTAX FAULT (Alert Crimson highlight)
        }
    } else {
        // Line contains characters but completely lacks a key mapping delimiter string
        // In structured YAML configuration layers, raw floating strings are an instant parse error
        g_editor.line_syntax_attributes[line_index] = 3; 
    }
}

void process_text_editor_keyboard_input(uint32_t scancode, char ascii_char) {
    g_editor.is_modified_dirty = true;
    uint32_t r = g_editor.cursor_row;
    uint32_t c = g_editor.cursor_col;

    // Handle standard developer key strokes assignments
    if (scancode == 0x0E) { // Backspace key scan code
        if (c > 0) {
            g_editor.text_buffer[r][c - 1] = '\\0';
            g_editor.cursor_col--;
        }
        sys_editor_execute_inline_yaml_scan(r);
        return;
    }
    
    if (scancode == 0x1C) { // Enter Key scan code -> Shift to next line array slot
        if (g_editor.total_lines < ED_MAX_LINES - 1) {
            g_editor.cursor_row++;
            g_editor.cursor_col = 0;
            if (g_editor.cursor_row >= g_editor.total_lines) {
                g_editor.total_lines++;
            }
        }
        return;
    }

    if (scancode == 0x0F) { // Tab key scan code -> Inject 4 standard compliance spaces
        if (c + ED_TAB_SPACES < ED_LINE_LEN - 1) {
            for (uint8_t i = 0; i < ED_TAB_SPACES; i++) {
                g_editor.text_buffer[r][c + i] = ' ';
            }
            g_editor.cursor_col += ED_TAB_SPACES;
            g_editor.text_buffer[r][g_editor.cursor_col] = '\\0';
        }
        sys_editor_execute_inline_yaml_scan(r);
        return;
    }

    // 3. INDUSTRY COMPLIANCE AUTOMATION: BRACKET & QUOTE AUTO-CLOSURE CLOSURES
    if (ascii_char == '{' || ascii_char == '[' || ascii_char == '(' || ascii_char == '"' || ascii_char == '\\'') {
        char closing_pair = '}';
        if (ascii_char == '[')  closing_pair = ']';
        if (ascii_char == '(')  closing_pair = ')';
        if (ascii_char == '"')  closing_pair = '"';
        if (ascii_char == '\\'') closing_pair = '\\'';

        if (c + 2 < ED_LINE_LEN - 1) {
            g_editor.text_buffer[r][c] = ascii_char;
            g_editor.text_buffer[r][c + 1] = closing_pair; // Inject the auto-closure character forward
            g_editor.text_buffer[r][c + 2] = '\\0';
            g_editor.cursor_col++; // Position cursor right inside the pair blocks
        }
        sys_editor_execute_inline_yaml_scan(r);
        return;
    }

    // Standard character append constraint rules
    if (ascii_char >= 32 && ascii_char <= 126 && c < ED_LINE_LEN - 1) {
        g_editor.text_buffer[r][c] = ascii_char;
        g_editor.cursor_col++;
        g_editor.text_buffer[r][g_editor.cursor_col] = '\\0';
        sys_editor_execute_inline_yaml_scan(r);
    }
}

void render_secure_text_editor(void) {
    // Render 4K-scaled master workspace window card container
    gfx_draw_filled_rect(ED_WIN_X, ED_WIN_Y, ED_WIN_W, ED_WIN_H, 0x11141A);
    gfx_draw_filled_rect(ED_WIN_X, ED_WIN_Y, ED_WIN_W, 42, 0x1A202C); // Top header toolbar
    
    char title_str[128];
    snprintf(title_str, sizeof(title_str), "SECURE CODING-COMPLIANT WORKSPACE ENGINE - [%s]%s", 
             g_editor.active_file_path, g_editor.is_modified_dirty ? " (UNSAVED)" : "");
    gfx_draw_string(ED_WIN_X + 24, ED_WIN_Y + 14, title_str, 0xFFFFFF);

    // Draw Developer Side Information Info Panel Card (Lists shortcuts)
    uint32_t side_x = ED_WIN_X + ED_WIN_W - 280;
    gfx_draw_filled_rect(side_x, ED_WIN_Y + 42, 280, ED_WIN_H - 42, 0x161A24);
    gfx_draw_string(side_x + 16, ED_WIN_Y + 70, "IDE CONTROLS:", 0x56607A);
    gfx_draw_string(side_x + 16, ED_WIN_Y + 110, " - TAB: 4 Spaces", 0x94A3B8);
    gfx_draw_string(side_x + 16, ED_WIN_Y + 142, " - {}, [], \\"\\": Auto-Close", 0x94A3B8);
    gfx_draw_string(side_x + 16, ED_WIN_Y + 174, " - Red Lines: Syntax Err", 0xFF3333);

    // Render large high-contrast editor line tracks
    bool compilation_blocker_found = false;
    for (uint32_t i = 0; i < g_editor.total_lines; i++) {
        uint32_t line_y = ED_WIN_Y + 70 + (i * 32);
        
        // 4. COLOR-SHIFTING SYNTAX HIGHLIGHT COLOR BLITTING SELECTORS
        uint32_t syntax_color = 0xE2E8F0; // White: Standard text
        uint8_t attr = g_editor.line_syntax_attributes[i];
        
        if (attr == 0)      syntax_color = 0x56607A; // Muted Slate Grey: Comments
        else if (attr == 2) syntax_color = 0x38BDF8; // Electric Cyan: YAML Config Keys
        else if (attr == 3) {
            syntax_color = 0xEF4444; // Warning Crimson: Syntax Violation Found!
            compilation_blocker_found = true;
        }

        // Draw line numbers column background strip
        char line_num_str[16];
        snprintf(line_num_str, sizeof(line_num_str), "%03d | ", i + 1);
        gfx_draw_string(ED_WIN_X + 24, line_y, line_num_str, 0x334155);
        
        // Draw the text string utilizing the dynamic syntax color token
        gfx_draw_string(ED_WIN_X + 96, line_y, g_editor.text_buffer[i], syntax_color);

        // Blit an active block underline cursor indicator on the current row index slot
        if (i == g_editor.cursor_row) {
            uint32_t cursor_pixel_offset = ED_WIN_X + 96 + (g_editor.cursor_col * 12);
            gfx_draw_filled_rect(cursor_pixel_offset, line_y + 20, 10, 4, 0x38BDF8);
        }
    }

    // Render giant commit save action button at the lower dock
    uint32_t btn_y = ED_WIN_Y + ED_WIN_H - 72;
    uint32_t btn_color = compilation_blocker_found ? 0x3A3F4D : 0x166534; // Disable/Dim button if syntax error is active
    gfx_draw_filled_rect(ED_WIN_X + 24, btn_y, 280, 46, btn_color);
    gfx_draw_string(ED_WIN_X + 54, btn_y + 15, compilation_blocker_found ? "[ FIX SYNTAX ERROR ]" : "[ COMMIT ATOMIC SAVE ]", 0xFFFFFF);
}

bool sys_editor_save_file_atomic(uint32_t calling_pid, const char* path) {
    if (!verify_vfs_extension_compliance(path, 1)) return false;

    // Check if any rule tracking flags represent a compilation blocker failure
    for (uint32_t i = 0; i < g_editor.total_lines; i++) {
        if (g_editor.line_syntax_attributes[i] == 3) {
            printf("[Editor Error]: Atomic transaction aborted. Resolve active syntax faults first.\\n");
            return false;
        }
    }

    uint8_t physical_write_staging_frame[512];
    memset(physical_write_staging_frame, 0, 512);
    
    // Flatten our multi-line structure array directly into a linear character stream payload
    uint32_t offset = 0;
    for (uint32_t i = 0; i < g_editor.total_lines; i++) {
        uint32_t len = strlen(g_editor.text_buffer[i]);
        if (offset + len + 1 < 512) {
            memcpy(physical_write_staging_frame + offset, g_editor.text_buffer[i], len);
            offset += len;
            physical_write_staging_frame[offset++] = '\\n'; // Re-insert standard delimiter line breaks
        }
    }

    uint32_t dummy_lba_sector = 9250;
    bool success = sys_commit_filesystem_metadata_update(dummy_lba_sector, physical_write_staging_frame);
    if (success) {
        g_editor.is_modified_dirty = false;
    }
    return success;
}

#pragma once
#include <stdint.h>
#include <stdbool.h>

#define ED_WIN_X        100
#define ED_WIN_Y        100
#define ED_WIN_W        1400 // Expanded workspace layout to support side panels
#define ED_WIN_H        900
#define ED_MAX_LINES    128
#define ED_LINE_LEN     80   // Industry-standard 80-column layout ceiling
#define ED_TAB_SPACES   4    // Standard developer tab indent spacing

typedef struct {
    char     text_buffer[ED_MAX_LINES][ED_LINE_LEN];
    uint8_t  line_syntax_attributes[ED_MAX_LINES]; // 0=Comment, 1=Standard, 2=YAML_Key, 3=SYNTAX_ERROR
    uint32_t total_lines;
    uint32_t cursor_row;
    uint32_t cursor_col;
    char     active_file_path[64];
    bool     is_modified_dirty;
    bool     is_yaml_syntax_valid;
} CodeEditorWorkspaceContext;

void init_secure_text_editor(void);
void render_secure_text_editor(void);
bool sys_editor_save_file_atomic(uint32_t calling_pid, const char* path);
void process_text_editor_keyboard_input(uint32_t scancode, char ascii_char);
void sys_editor_execute_inline_yaml_scan(uint32_t line_index);

#pragma once
#include <stdint.h>

#define MEM_WDGT_X    20
#define MEM_WDGT_Y    720 // Cleanly positioned on your lower 4K layout grid row
#define MEM_WDGT_W    700 // Extended width card for massive 4K visibility metrics
#define MEM_WDGT_H    110

void render_process_memory_footprint_widget(void);

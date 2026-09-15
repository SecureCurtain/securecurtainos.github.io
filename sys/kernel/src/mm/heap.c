/* SecureCurtain OS - Kernel Heap & Slab Allocator
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Freestanding
 */

#include "heap.h"
#include "vmm.h"
#include "pmm.h"
#include "kernel.h"

#define HEAP_START_VIRT   0xFFFFFFFF90000000ULL
#define HEAP_INITIAL_PAGES 16 // 64 KB Initial Kernel Heap

struct heap_block {
    size_t size;
    bool is_free;
    struct heap_block *next;
};

static struct heap_block *head_block = NULL;
static uintptr_t current_heap_break = HEAP_START_VIRT;

void heap_init(void) {
    serial_puts("[HEAP] Initializing Kernel Heap Allocator...\n");

    for (size_t i = 0; i < HEAP_INITIAL_PAGES; i++) {
        uintptr_t phys = pmm_alloc_frame();
        vmm_map_page(current_heap_break, phys, VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE);
        current_heap_break += PAGE_SIZE;
    }

    head_block = (struct heap_block *)HEAP_START_VIRT;
    head_block->size = (HEAP_INITIAL_PAGES * PAGE_SIZE) - sizeof(struct heap_block);
    head_block->is_free = true;
    head_block->next = NULL;

    serial_puts("[HEAP] Kernel Dynamic Heap ready (Base: 0xFFFFFFFF90000000).\n");
}

static void expand_heap(size_t required_bytes) {
    size_t pages_needed = (required_bytes + PAGE_SIZE - 1) / PAGE_SIZE;
    if (pages_needed < 4) pages_needed = 4;

    uintptr_t new_block_virt = current_heap_break;

    for (size_t i = 0; i < pages_needed; i++) {
        uintptr_t phys = pmm_alloc_frame();
        vmm_map_page(current_heap_break, phys, VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE);
        current_heap_break += PAGE_SIZE;
    }

    struct heap_block *new_block = (struct heap_block *)new_block_virt;
    new_block->size = (pages_needed * PAGE_SIZE) - sizeof(struct heap_block);
    new_block->is_free = true;
    new_block->next = NULL;

    // Attach to end of linked list
    struct heap_block *curr = head_block;
    while (curr->next != NULL) {
        curr = curr->next;
    }
    curr->next = new_block;
}

void *kmalloc(size_t size) {
    if (size == 0) return NULL;

    // Align size to 16 bytes
    size = (size + 15) & ~15;

    struct heap_block *curr = head_block;
    while (curr != NULL) {
        if (curr->is_free && curr->size >= size) {
            // Check if block can be split
            if (curr->size >= size + sizeof(struct heap_block) + 16) {
                struct heap_block *split = (struct heap_block *)((uint8_t *)curr + sizeof(struct heap_block) + size);
                split->size = curr->size - size - sizeof(struct heap_block);
                split->is_free = true;
                split->next = curr->next;

                curr->size = size;
                curr->next = split;
            }
            curr->is_free = false;
            return (void *)((uint8_t *)curr + sizeof(struct heap_block));
        }
        curr = curr->next;
    }

    // Heap exhausted, expand memory pool
    expand_heap(size + sizeof(struct heap_block));
    return kmalloc(size);
}

void *kzalloc(size_t size) {
    void *ptr = kmalloc(size);
    if (!ptr) return NULL;

    uint8_t *b = (uint8_t *)ptr;
    for (size_t i = 0; i < size; i++) {
        b[i] = 0;
    }
    return ptr;
}

void kfree(void *ptr) {
    if (!ptr) return;

    struct heap_block *block = (struct heap_block *)((uint8_t *)ptr - sizeof(struct heap_block));
    block->is_free = true;

    // Coalesce adjacent free blocks
    struct heap_block *curr = head_block;
    while (curr != NULL && curr->next != NULL) {
        if (curr->is_free && curr->next->is_free) {
            curr->size += sizeof(struct heap_block) + curr->next->size;
            curr->next = curr->next->next;
        } else {
            curr = curr->next;
        }
    }
}

void *krealloc(void *ptr, size_t new_size) {
    if (!ptr) return kmalloc(new_size);
    if (new_size == 0) {
        kfree(ptr);
        return NULL;
    }

    struct heap_block *block = (struct heap_block *)((uint8_t *)ptr - sizeof(struct heap_block));
    if (block->size >= new_size) return ptr;

    void *new_ptr = kmalloc(new_size);
    if (!new_ptr) return NULL;

    uint8_t *src = (uint8_t *)ptr;
    uint8_t *dst = (uint8_t *)new_ptr;
    for (size_t i = 0; i < block->size; i++) {
        dst[i] = src[i];
    }

    kfree(ptr);
    return new_ptr;
}

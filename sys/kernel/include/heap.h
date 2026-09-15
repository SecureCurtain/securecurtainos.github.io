/* SecureCurtain OS - Kernel Heap & Slab Allocator Header
 * Author: Jared Busby (jb7572)
 */

#ifndef _SECURECURTAIN_HEAP_H
#define _SECURECURTAIN_HEAP_H

#include <stdint.h>
#include <stddef.h>

/* Initializes kernel heap space */
void heap_init(void);

/* Dynamically allocates size bytes */
void *kmalloc(size_t size);

/* Allocates and zeroes memory */
void *kzalloc(size_t size);

/* Frees allocated heap block */
void kfree(void *ptr);

/* Reallocates memory block */
void *krealloc(void *ptr, size_t new_size);

#endif /* _SECURECURTAIN_HEAP_H */

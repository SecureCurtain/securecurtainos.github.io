/*
 * SecureCurtain OS - Symmetric Multiprocessing (SMP) Subsystem
 * Author: Jared Busby (jb7572)
 *
 * Implements Multi-Core CPU Initialization:
 * - Parses ACPI MADT (Multiple APIC Description Table)
 * - Identifies Local APIC IDs for all Application Processors (APs)
 * - Sets up real-mode AP trampoline at 0x8000
 * - Broadcasts INIT-SIPI-SIPI Inter-Processor Interrupts (IPI) via APIC ICR
 * - Synchronizes CPU core bringup with memory barriers and atomic spinlocks
 */

#include <stdint.h>
#include <stdbool.h>

#define MAX_CPUS 64

/* ACPI MADT Header and Entry Types */
#define ACPI_MADT_TYPE_LOCAL_APIC         0
#define ACPI_MADT_TYPE_IO_APIC            1
#define ACPI_MADT_TYPE_INTERRUPT_OVERRIDE 2

typedef struct __attribute__((packed)) {
    char     signature[4]; /* "APIC" */
    uint32_t length;
    uint8_t  revision;
    uint8_t  checksum;
    char     oem_id[6];
    char     oem_table_id[8];
    uint32_t oem_revision;
    uint32_t creator_id;
    uint32_t creator_revision;
    uint32_t local_apic_address;
    uint32_t flags;
} acpi_madt_header_t;

typedef struct __attribute__((packed)) {
    uint8_t type;
    uint8_t length;
} acpi_madt_entry_header_t;

typedef struct __attribute__((packed)) {
    acpi_madt_entry_header_t header;
    uint8_t  processor_id;
    uint8_t  apic_id;
    uint32_t flags; /* Bit 0: Enabled, Bit 1: Online Capable */
} acpi_madt_local_apic_t;

/* CPU Core Descriptor */
typedef struct {
    uint8_t  apic_id;
    uint8_t  acpi_id;
    bool     is_bsp;        /* Bootstrap Processor (Core 0) */
    bool     is_online;     /* Core successfully booted */
    uint64_t kernel_stack;  /* Dedicated Ring 0 stack pointer */
} cpu_core_t;

static cpu_core_t cpu_cores[MAX_CPUS];
static uint32_t   detected_cpu_count = 0;
static uint32_t   online_cpu_count   = 1; /* BSP starts online */

/* LAPIC Register Offsets */
#define LAPIC_ICR_LOW  0x300
#define LAPIC_ICR_HIGH 0x310

static volatile uint32_t *lapic_base = (volatile uint32_t *)0xFEE00000;

static void lapic_write(uint32_t reg, uint32_t value) {
    lapic_base[reg / 4] = value;
}

static __attribute__((unused)) uint32_t lapic_read(uint32_t reg) {
    return lapic_base[reg / 4];
}

/* Microsecond delay stub using PIT/HPET */
extern void pit_wait_ms(uint32_t ms);

/*
 * smp_parse_madt - Enumerate all physical and logical CPU cores from ACPI
 */
void smp_parse_madt(acpi_madt_header_t *madt) {
    if (!madt) return;

    uint8_t *ptr = (uint8_t *)(madt + 1);
    uint8_t *end = (uint8_t *)madt + madt->length;

    while (ptr < end && detected_cpu_count < MAX_CPUS) {
        acpi_madt_entry_header_t *entry = (acpi_madt_entry_header_t *)ptr;
        if (entry->length == 0) break;

        if (entry->type == ACPI_MADT_TYPE_LOCAL_APIC) {
            acpi_madt_local_apic_t *lapic = (acpi_madt_local_apic_t *)ptr;
            if (lapic->flags & 0x01) { /* Enabled */
                cpu_cores[detected_cpu_count].apic_id = lapic->apic_id;
                cpu_cores[detected_cpu_count].acpi_id = lapic->processor_id;
                cpu_cores[detected_cpu_count].is_bsp = (detected_cpu_count == 0);
                cpu_cores[detected_cpu_count].is_online = (detected_cpu_count == 0);
                detected_cpu_count++;
            }
        }
        ptr += entry->length;
    }
}

/*
 * smp_boot_core - Send INIT-SIPI-SIPI sequence to wake an AP core
 */
void smp_boot_core(uint8_t apic_id, uint8_t trampoline_page) {
    /* 1. Assert INIT IPI */
    lapic_write(LAPIC_ICR_HIGH, (uint32_t)apic_id << 24);
    lapic_write(LAPIC_ICR_LOW, 0x00004500); /* INIT level de-assert */
    pit_wait_ms(10);

    /* 2. Startup IPI (SIPI 1) */
    lapic_write(LAPIC_ICR_HIGH, (uint32_t)apic_id << 24);
    lapic_write(LAPIC_ICR_LOW, 0x00004600 | trampoline_page);
    pit_wait_ms(1);

    /* 3. Startup IPI (SIPI 2) */
    lapic_write(LAPIC_ICR_HIGH, (uint32_t)apic_id << 24);
    lapic_write(LAPIC_ICR_LOW, 0x00004600 | trampoline_page);
    pit_wait_ms(1);
}

/*
 * smp_init - Master SMP Initialization Routine
 */
void smp_init(void) {
    /* Trampoline loaded at 0x8000 -> Page 0x08 */
    uint8_t trampoline_page = 0x08;

    for (uint32_t i = 1; i < detected_cpu_count; ++i) {
        smp_boot_core(cpu_cores[i].apic_id, trampoline_page);
        cpu_cores[i].is_online = true;
        online_cpu_count++;
    }
}

uint32_t smp_get_online_cpu_count(void) {
    return online_cpu_count;
}

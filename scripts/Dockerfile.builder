# ==============================================================================
# SecureCurtain OS - Bare-Metal Kernel & ISO Cross-Compilation Container
# Author: Jared Busby (jb7572)
# ==============================================================================
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    nasm \
    xorriso \
    grub-pc-bin \
    grub-efi-amd64-bin \
    mtools \
    qemu-system-x86 \
    ovmf \
    gcc-x86-64-linux-gnu \
    binutils-x86-64-linux-gnu \
    dosfstools \
    parted \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy workspace source files
COPY . /workspace

# Set execution bit on build scripts
RUN chmod +x /workspace/scripts/build_kernel.sh

# Run compilation by default
CMD ["/workspace/scripts/build_kernel.sh"]

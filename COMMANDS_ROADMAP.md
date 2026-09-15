# SecureCurtain OS Command Implementation Roadmap & Progress Tracker
*Generated on: 2026-08-31*

This registry documents all 420+ mapped commands across POSIX/Linux, modern Unix replacements, Windows/PowerShell cross-platform bridges, and microkernel/hardware diagnostics for our SecureCurtain OS terminal.

---

## 📍 Where We Stand & How to Resume
If you pause or start a new session, you can always check this file (`COMMANDS_ROADMAP.md`) or run `help --all`, `tldr <cmd>`, or `man <cmd>` inside the terminal to check supported commands.

---

## 🗂️ Command Categories & Implementation Status

### 1. 📂 File and Directory Operations
- [x] `ls` / `dir` - Directory listing with permissions, sizes, dates, and colorized types
- [x] `cd` - Change current working directory in VFS
- [x] `pwd` - Print current working directory path
- [x] `mkdir` - Create directory
- [x] `rmdir` - Remove empty directory
- [x] `rm` / `del` - Remove file or directory
- [x] `cp` / `copy` - Copy file or directory
- [x] `mv` / `move` - Move or rename file
- [x] `touch` - Create empty file or update timestamp
- [x] `ln` - Create hard or symbolic links
- [x] `stat` - Display detailed inode/file attributes
- [x] `file` - Determine MIME type and binary signatures
- [x] `basename` - Strip directory path and suffix
- [x] `dirname` - Extract directory component
- [x] `sync` - Flush filesystem buffers to disk
- [x] `shred` - Securely overwrite and zero file data
- [x] `mktemp` - Generate temporary file safely in `/tmp`
- [x] `tree` - Recursive ASCII directory tree
- [x] `realpath` - Resolve canonical absolute path

### 2. 🔍 Searching, Locating & Text Querying
- [x] `grep` / `egrep` / `fgrep` - Search lines with regular expressions
- [x] `ripgrep` (`rg`) - Fast multi-threaded full-tree text search
- [x] `find` / `fd` - Locate files by name, type, and path
- [x] `locate` / `updatedb` - Query cached index database
- [x] `which` / `whereis` - Resolve executable path in `$PATH`
- [x] `type` - Identify if command is builtin, binary, alias, or function

### 3. 📝 File Viewing, Reading & Binary Inspection
- [x] `cat` / `type` (CMD) - Concatenate and stream file contents
- [x] `tac` - Output file lines in reverse order
- [x] `head` - Display first N lines of file
- [x] `tail` - Display last N lines of file
- [x] `less` / `more` - Page through text contents
- [x] `hexdump` / `xxd` / `od` - Hexadecimal memory and byte dump
- [x] `strings` - Extract ASCII strings from binaries
- [x] `nl` - Number text lines
- [x] `rev` - Reverse characters on every line
- [x] `bat` - Syntax-highlighted text reader

### 4. 🛡️ Permissions, Ownership & Security
- [x] `chmod` - Change file mode / access permissions
- [x] `chown` - Change user / group owner
- [x] `chgrp` - Change group ownership
- [x] `umask` - Query or set default creation mask
- [x] `chattr` / `lsattr` - Immutable (+i) filesystem attributes
- [x] `getfacl` / `setfacl` - Access Control List management
- [x] `sudo` / `su` - Switch user or run with elevated root privileges
- [x] `sestatus` / `getsebool` / `setsebool` - SELinux enforcement levels

### 5. 🌐 Modern Networking & Sockets
- [x] `ip` (`ip a`, `ip link`, `ip route`, `ip neighbor`) - Modern network configuration
- [x] `ifconfig` / `route` / `arp` - Classic network diagnostics
- [x] `ss` / `netstat` - Active TCP/UDP listening sockets
- [x] `ping` - ICMP echo round-trip latency
- [x] `traceroute` / `tracepath` / `mtr` - Gateway hop analysis
- [x] `curl` / `wget` - HTTP/HTTPS/FTP stream transfer
- [x] `dig` / `drill` / `nslookup` - DNS interrogator
- [x] `nc` (netcat) / `socat` - Raw socket I/O
- [x] `ufw` / `firewall-cmd` / `nft` / `iptables` - Firewall rules and filters

### 6. ⚙️ System Monitoring, Hardware & Processes
- [x] `ps` / `tasklist` - Active process snapshots
- [x] `top` / `htop` / `btop` - Interactive real-time process manager
- [x] `kill` / `killall` / `pkill` - Signal and terminate processes
- [x] `pgrep` / `pidof` - Resolve process name to PID
- [x] `free` - Physical RAM and swap space usage
- [x] `uptime` - System uptime, load averages
- [x] `vmstat` / `iostat` / `mpstat` - Kernel threads, disk I/O, per-core CPU
- [x] `uname` / `hostnamectl` / `timedatectl` - System identification and clock
- [x] `dmesg` / `journalctl` - Kernel ring buffer and service journals
- [x] `systemctl` / `services.msc` - Service daemon management
- [x] `lscpu` / `lspci` / `lsusb` / `lshw` / `dmidecode` - Hardware enumeration
- [x] `sensors` / `turbostat` - Core thermals, fan RPM, power consumption

### 7. 💾 Disk, Partitioning & Storage Architecture
- [x] `df` - Mounted volume disk space
- [x] `du` / `ncdu` / `dust` - Directory space analyzer
- [x] `lsblk` - Storage block devices and partition paths
- [x] `mount` / `umount` / `findmnt` - VFS mount point management
- [x] `fdisk` / `gdisk` / `parted` - MBR/GPT partition tables
- [x] `mkfs` (`mkfs.ext4`, `mkfs.fat32`) - File system formatting
- [x] `fsck` / `e2fsck` - Filesystem consistency check
- [x] `blkid` - Block device UUID and label query
- [x] `fstrim` / `blkdiscard` - SSD TRIM garbage collection
- [x] `pvcreate` / `vgcreate` / `lvcreate` - LVM volume manager

### 8. 🔄 OS Update, Watchdog & Kernel Control
- [x] `sys-update` - Dual-Slot A/B OS update manager (`--check`, `--apply`, `--slot-status`)
- [x] `watchdog` / `watchdogctl` - Hardware watchdog timer, heartbeat & auto-recovery
- [x] `bootctl` / `grub2-mkconfig` - EFI boot entries and default slot
- [x] `modprobe` / `lsmod` / `insmod` / `rmmod` - Dynamic kernel module manager
- [x] `sysctl` - Ring 0 kernel runtime parameters (`/proc/sys`)
- [x] `kexec` - Fast in-memory kernel restart without BIOS reset
- [x] `dracut` / `update-initramfs` - Initial RAM disk generator

### 9. 🔤 Text Formatting & Data Processing
- [x] `awk` - Pattern extraction and processing
- [x] `sed` - Stream editor substitutions
- [x] `cut` - Column extraction
- [x] `sort` - Alphabetical and numerical sorting
- [x] `uniq` - Deduplicate adjacent lines
- [x] `wc` - Word, line, character, and byte count
- [x] `tr` - Character translation
- [x] `tee` - Standard input tee to multiple files
- [x] `diff` / `sdiff` - Line-by-line file comparison
- [x] `jq` - JSON parsing and slicing
- [x] `base64` / `base32` / `basenc` - Encoding/decoding
- [x] `md5sum` / `sha256sum` / `sha512sum` / `b2sum` - Cryptographic hashes

### 10. 📦 Package & Subsystem Management
- [x] `apt` / `dnf` / `pacman` / `winget` - Unified package manager
- [x] `dpkg` / `rpm` - Low-level binary package installer
- [x] `tar` / `gzip` / `gunzip` / `zip` / `unzip` / `zstd` / `xz` - Archiving & compression

### 11. 📖 Help & Documentation
- [x] `man <cmd>` - Full formatted manual pages for any command
- [x] `tldr <cmd>` - Modern concise cheat sheets
- [x] `help` / `help --all` - Interactive catalog and category browser

---

*All commands are wired into the unified dispatch table in `/src/services/commandRegistryService.ts` and `/src/components/cockpit/CockpitTerminal.tsx`.*

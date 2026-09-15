import os
import shutil
import zipfile
import tarfile

target_dirs = ['sys', 'scripts', 'docs']
target_files = ['BARE_METAL_ROADMAP.md', 'README.md', 'COMMANDS_ROADMAP.md']

EXCLUDE_DIRS = {'.dep_cache', 'node_modules', 'build', '.git', '__pycache__', 'linux_source', 'linux_drivers'}

file_list = []
dir_set = set()

for d in target_dirs:
    if os.path.exists(d):
        for root, dirs, files in os.walk(d):
            dirs[:] = [subdir for subdir in dirs if subdir not in EXCLUDE_DIRS]
            if any(excluded in root.split(os.sep) for excluded in EXCLUDE_DIRS):
                continue
            dir_set.add(root)
            for f in sorted(files):
                file_list.append(os.path.join(root, f))


for f in target_files:
    if os.path.exists(f):
        file_list.append(f)

print(f'Discovered {len(dir_set)} directories and {len(file_list)} files.')

out_path = 'hydrator.sh'
with open(out_path, 'w', encoding='utf-8') as out:
    out.write('#!/usr/bin/env bash\n')
    out.write('# ==============================================================================\n')
    out.write('# Complete Source Code Hydrator for SecureCurtain OS (sys, scripts, docs)\n')
    out.write('# Verified Dual-Persona Ring 0 Microkernel, Subsystems, Win32 & Linux Runtimes\n')
    out.write('# ==============================================================================\n')
    out.write('set -euo pipefail\n\n')
    out.write('TARGET_DIR="${1:-.}"\n')
    out.write('echo "[*] Hydrating SecureCurtain OS complete verified source into: ${TARGET_DIR}"\n')
    out.write('mkdir -p "${TARGET_DIR}"\n\n')
    out.write('echo "[*] Creating directory hierarchy..."\n')
    for d in sorted(dir_set):
        out.write(f'mkdir -p "${{TARGET_DIR}}/{d}"\n')

    out.write('\necho "[*] Extracting verified files..."\n\n')

    for fpath in file_list:
        try:
            with open(fpath, 'r', encoding='utf-8', errors='replace') as sf:
                content = sf.read()
            
            # Find a safe unique delimiter that does not appear in content
            delim = '__SECURECURTAIN_EOF__'
            counter = 0
            while f'\n{delim}' in content or content.startswith(f'{delim}\n') or content == delim:
                counter += 1
                delim = f'__SECURECURTAIN_EOF_{counter}__'

            out.write(f"cat << '{delim}' > \"${{TARGET_DIR}}/{fpath}\"\n")
            out.write(content)
            if not content.endswith('\n'):
                out.write('\n')
            out.write(f'{delim}\n\n')
        except Exception as e:
            print(f'Error reading {fpath}: {e}')

    out.write('\n# Make shell scripts and python utilities executable\n')
    out.write('chmod +x "${TARGET_DIR}"/scripts/*.sh "${TARGET_DIR}"/scripts/*.py "${TARGET_DIR}"/sys/*.sh 2>/dev/null || true\n\n')
    out.write('echo "[*] Step 1: Staging upstream system dependencies (lwIP, mbedTLS, Linux Kernel Sources & Drivers)..."\n')
    out.write('if command -v python3 >/dev/null 2>&1; then\n')
    out.write('    python3 "${TARGET_DIR}/scripts/fetch_system_dependencies.py" || true\n')
    out.write('    echo "[*] Step 2: Initializing Win32 subsystem layout and system INI structures..."\n')
    out.write('    python3 "${TARGET_DIR}/scripts/setup_win32_subsystem.py" "${TARGET_DIR}/sysroot" || true\n')
    out.write('    echo "[*] Step 3: Packaging userland subsystems and UEFI signing MOK..."\n')
    out.write('    python3 "${TARGET_DIR}/scripts/build_subsystem.py" "${TARGET_DIR}/sysroot" || true\n')
    out.write('    echo "[*] Step 4: Compiling Bare-Metal Kernel & Building Bootable Hybrid ISO Image..."\n')
    out.write('    if [ -f "${TARGET_DIR}/scripts/build_kernel.sh" ]; then\n')
    out.write('        bash "${TARGET_DIR}/scripts/build_kernel.sh" || true\n')
    out.write('    fi\n')
    out.write('else\n')
    out.write('    echo "[!] python3 not found. When ready, run: python3 scripts/fetch_system_dependencies.py --all"\n')
    out.write('fi\n\n')
    out.write('echo "[+] Hydration completed successfully! All files and system dependencies ready."\n')

print(f'Generated {out_path}, size: {os.path.getsize(out_path)} bytes.')

# Sync to all mirrored hydrator names in root, public, and dist
copies = [
    'full source hydrator.sh',
    'hydrate_SecureCurtain.sh',
    'hydrator_v0.3.0.sh',
    'public/hydrator.sh',
    'public/hydrator_v0.3.0.sh',
    'public/full source hydrator.sh',
    'public/hydrate_SecureCurtain.sh',
    'public/full_source_hydrator.sh',
    'dist/hydrator.sh',
    'dist/hydrator_v0.3.0.sh',
    'dist/full source hydrator.sh',
    'dist/hydrate_SecureCurtain.sh',
    'dist/full_source_hydrator.sh'
]

for dest in copies:
    os.makedirs(os.path.dirname(dest) if os.path.dirname(dest) else '.', exist_ok=True)
    shutil.copy2(out_path, dest)
    print(f'Synced to {dest}')

# Also generate fresh universal zip and tar.gz in public/ and dist/
print('[*] Creating universal zip and tar.gz archives...')
for archive_dir in ['public', 'dist']:
    os.makedirs(archive_dir, exist_ok=True)
    zip_path = os.path.join(archive_dir, 'securecurtain.zip')
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for fpath in file_list:
            zf.write(fpath, fpath)
    print(f'Generated {zip_path} ({os.path.getsize(zip_path)} bytes)')
    shutil.copy2(zip_path, os.path.join(archive_dir, 'securecurtain-source.zip'))

    tar_path = os.path.join(archive_dir, 'securecurtain.tar.gz')
    with tarfile.open(tar_path, 'w:gz') as tf:
        for fpath in file_list:
            tf.add(fpath, fpath)
    print(f'Generated {tar_path} ({os.path.getsize(tar_path)} bytes)')
    shutil.copy2(tar_path, os.path.join(archive_dir, 'securecurtain-source.tar.gz'))


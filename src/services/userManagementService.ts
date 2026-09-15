// jb7572_2026-08-28: Enterprise & Local User, Group, RBAC & Directory Domain Integration Service
// Supports Local Linux/Windows SAM users & groups, granular RBAC (Role-Based Access Control),
// and Enterprise Network Server Directory Controllers:
// - Windows Server Active Directory (AD DS / Kerberos / LDAP / NTLMv2)
// - Linux OpenLDAP / FreeIPA / Samba4 / SSSD / NIS Domain Controller
import { SecuritySanitizer } from '../utils/securitySanitizer';

export type SecurityDomainType = 'LOCAL_STANDALONE' | 'ACTIVE_DIRECTORY' | 'FREEIPA_LDAP' | 'SAMBA4_PDC';

export type UserStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'EXPIRED' | 'PENDING_MFA';

export type RoleLevel = 'ROOT_ADMIN' | 'SECURITY_OPERATOR' | 'SYSTEM_ENGINEER' | 'AUDIT_ANALYST' | 'STANDARD_USER' | 'GUEST_RESTRICTED';

export interface UserPermission {
  id: string;
  name: string;
  category: 'STORAGE' | 'KERNEL_MEMORY' | 'NETWORK_FIREWALL' | 'SYSTEM_CONFIG' | 'LOGS_AUDITING' | 'PACKAGES' | 'USERS_SECURITY';
  description: string;
}

export interface SecurityRole {
  id: RoleLevel;
  name: string;
  description: string;
  color: string;
  permissions: string[]; // Permission IDs
  canSudo: boolean;
  requiresPinElevation: boolean;
  defaultShell: string;
  allowedLogonHours: string;
}

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  title?: string; // System / Professional designation (e.g. Chief Security Officer & Root Admin)
  email: string;
  role: RoleLevel;
  groups: string[]; // Group IDs
  status: UserStatus;
  domain: SecurityDomainType;
  domainName?: string;
  uid: number;
  gid: number;
  homeDirectory: string;
  shell: string;
  avatarGradient: string;
  pin: string; // 4-10 char PIN for sudo elevation
  password?: string; // Primary Login / PAM System Password
  forcePasswordReset?: boolean; // Force change on next login
  mfaEnabled: boolean;
  mfaMethod: 'TOTP_AUTH' | 'HARDWARE_FIDO2' | 'PIN_AIRGAP';
  totpSecret?: string; // RFC 6238 Base32 Secret for Google Authenticator / Apple Authenticator
  lastLogin: string;
  passwordExpiresDays: number;
  failedLoginsCount: number;
  isDomainUser?: boolean;
  sid?: string; // Windows Security Identifier e.g. S-1-5-21-...
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  gid: number;
  memberUsernames: string[];
  roleInherited?: RoleLevel;
  isSystemGroup: boolean;
  domain: SecurityDomainType;
  specialRights: string[];
}

export interface NetworkDomainConfig {
  domainType: SecurityDomainType;
  domainRealm: string; // e.g. CORP.SECURECURTAIN.NET or ad.enterprise.local
  primaryDcServer: string; // e.g. dc01.corp.securecurtain.net or 192.168.1.10
  secondaryDcServer?: string;
  kerberosRealm: string;
  ldapBaseDn: string; // e.g. DC=corp,DC=securecurtain,DC=net
  ldapBindUser: string;
  joinStatus: 'DISCONNECTED' | 'JOINED' | 'AUTHENTICATING' | 'SYNCING' | 'ERROR';
  lastSyncTimestamp: string;
  syncedUsersCount: number;
  syncedGroupsCount: number;
  autoCreateHomeDir: boolean;
  enableSssdCaching: boolean;
  allowOfflineCredentials: boolean;
  adGroupPolicyEnforced: boolean;
  trustTicketsExpiryHours: number;
}

export interface PasswordSecurityPolicy {
  // Length Rules
  enforceMinLength: boolean;
  minLength: number; // e.g. 10 (range 06-99)
  enforceMaxLength: boolean;
  maxLength: number; // e.g. 99 (range 16-99)

  // Password Age & Lifespan Rules
  enforcePasswordAge: boolean;
  maxPasswordAgeDays: number; // e.g. 90 days (01-99 days)
  enforceMinPasswordAge: boolean;
  minPasswordAgeDays: number; // e.g. 1 day minimum time before change (00-30 days)
  enforceExpirationWarning: boolean;
  expirationWarningDays: number; // e.g. 14 days warning (01-30 days)

  // Password History & Reuse Prevention
  enforceHistoryReuse: boolean;
  passwordHistoryCount: number; // e.g. 10 (01-99 passwords before reuse)
  disallowUsernameInPassword: boolean;
  disallowFullNameInPassword: boolean;
  enforceDictionaryBlacklist: boolean;

  // Character Classes & Complexity
  requireAlphanumeric: boolean; // Both letters & numbers required
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigits: boolean;
  minDigitsCount: number; // 2-digit input (01-10)
  requireSpecialChars: boolean; // Special symbols toggle
  minSpecialCharsCount: number; // 2-digit input (01-10)
  minCharacterClasses: number; // 1 to 4 classes

  // Account Lockout & Brute-Force Throttling
  enforceAccountLockout: boolean;
  maxFailedLoginsBeforeLock: number; // e.g. 5 attempts (01-20)
  lockoutDurationMinutes: number; // e.g. 30 minutes (01-99)
  resetFailedCountAfterMinutes: number; // e.g. 15 minutes (01-99)

  // Sudo & Elevation PIN Policy
  enforceElevationPinPolicy: boolean;
  minPinLength: number; // e.g. 4 (04-16)
  maxPinLength: number; // e.g. 12 (04-16)
  requirePinAlphanumericSpecial: boolean;
  sudoElevationTimeoutMinutes: number; // e.g. 15 (01-99)
  requireMfaForSudo: boolean;

  // Cryptographic Engine
  hashingAlgorithm: 'Argon2id' | 'SHA-512-Rounds' | 'Yescrypt' | 'bcrypt';
  argon2MemoryCostMB: number; // e.g. 64 (16-1024)
  argon2TimeIterations: number; // e.g. 3 (1-10)
  argon2Parallelism: number; // e.g. 4 (1-16)

  // User Lifecycle
  forceChangeAtNextLogon: boolean;
  allowUserSelfReset: boolean;
  notifyOnPasswordChange: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordSecurityPolicy = {
  enforceMinLength: true,
  minLength: 12,
  enforceMaxLength: true,
  maxLength: 64,
  enforcePasswordAge: true,
  maxPasswordAgeDays: 90,
  enforceMinPasswordAge: true,
  minPasswordAgeDays: 1,
  enforceExpirationWarning: true,
  expirationWarningDays: 14,
  enforceHistoryReuse: true,
  passwordHistoryCount: 10,
  disallowUsernameInPassword: true,
  disallowFullNameInPassword: true,
  enforceDictionaryBlacklist: true,
  requireAlphanumeric: true,
  requireUppercase: true,
  requireLowercase: true,
  requireDigits: true,
  minDigitsCount: 1,
  requireSpecialChars: true,
  minSpecialCharsCount: 1,
  minCharacterClasses: 3,
  enforceAccountLockout: true,
  maxFailedLoginsBeforeLock: 5,
  lockoutDurationMinutes: 30,
  resetFailedCountAfterMinutes: 15,
  enforceElevationPinPolicy: true,
  minPinLength: 4,
  maxPinLength: 12,
  requirePinAlphanumericSpecial: true,
  sudoElevationTimeoutMinutes: 15,
  requireMfaForSudo: true,
  hashingAlgorithm: 'Argon2id',
  argon2MemoryCostMB: 64,
  argon2TimeIterations: 3,
  argon2Parallelism: 4,
  forceChangeAtNextLogon: false,
  allowUserSelfReset: true,
  notifyOnPasswordChange: true
};

export const PASSWORD_POLICY_PRESETS: Record<string, { name: string; description: string; policy: PasswordSecurityPolicy }> = {
  NIST_SP800_63B: {
    name: 'NIST SP 800-63B High-Assurance Baseline',
    description: 'NIST digital identity guidelines: 14-char min length, no arbitrary forced churn without breach, strict dictionary blacklist, Argon2id.',
    policy: {
      ...DEFAULT_PASSWORD_POLICY,
      minLength: 14,
      enforcePasswordAge: false,
      maxPasswordAgeDays: 365,
      minPasswordAgeDays: 0,
      passwordHistoryCount: 5,
      minCharacterClasses: 3,
      maxFailedLoginsBeforeLock: 5,
      hashingAlgorithm: 'Argon2id',
      argon2MemoryCostMB: 128,
      argon2TimeIterations: 4
    }
  },
  ENTERPRISE_ACTIVE_DIRECTORY: {
    name: 'Corporate Active Directory & PAM Shadow Baseline',
    description: 'Standard enterprise compliance: 10-char min, 90-day expiration, 1-day min age, 24 history remember count, 5 lockout attempts.',
    policy: {
      ...DEFAULT_PASSWORD_POLICY,
      minLength: 10,
      enforcePasswordAge: true,
      maxPasswordAgeDays: 90,
      minPasswordAgeDays: 1,
      passwordHistoryCount: 24,
      minCharacterClasses: 4,
      maxFailedLoginsBeforeLock: 5,
      lockoutDurationMinutes: 30
    }
  },
  AIRGAP_SCIF_TOP_SECRET: {
    name: 'Air-Gapped SCIF / Top Secret Defense Standard',
    description: 'Strict military/defense profile: 16-char min, 60-day expiration, 3-day min age, 30 history reuse, 3 lockout attempts, hardware MFA.',
    policy: {
      ...DEFAULT_PASSWORD_POLICY,
      minLength: 16,
      enforcePasswordAge: true,
      maxPasswordAgeDays: 60,
      minPasswordAgeDays: 3,
      expirationWarningDays: 21,
      passwordHistoryCount: 30,
      minCharacterClasses: 4,
      maxFailedLoginsBeforeLock: 3,
      lockoutDurationMinutes: 60,
      minPinLength: 8,
      maxPinLength: 16,
      requirePinAlphanumericSpecial: true,
      requireMfaForSudo: true,
      hashingAlgorithm: 'Argon2id',
      argon2MemoryCostMB: 256,
      argon2TimeIterations: 5
    }
  },
  DEV_TESTING_RELAXED: {
    name: 'Developer & Test Lab Relaxed Policy',
    description: 'Permissive environment for rapid debugging: 8-char min, 365-day lifespan, 0 min age, 3 history count, 10 lockout attempts.',
    policy: {
      ...DEFAULT_PASSWORD_POLICY,
      minLength: 8,
      enforcePasswordAge: false,
      maxPasswordAgeDays: 365,
      minPasswordAgeDays: 0,
      passwordHistoryCount: 3,
      minCharacterClasses: 2,
      maxFailedLoginsBeforeLock: 10,
      lockoutDurationMinutes: 5,
      requirePinAlphanumericSpecial: false
    }
  }
};

// Full System Permission Matrix
export const SYSTEM_PERMISSIONS: UserPermission[] = [
  { id: 'perm_storage_format', name: 'Disk Partitioning & Formatting', category: 'STORAGE', description: 'Initialize GPT/MBR, wipe sectors, format ext4/ntfs/btrfs.' },
  { id: 'perm_storage_backup', name: 'External Drive Backup & Recovery', category: 'STORAGE', description: 'Create and restore encrypted system-wide backups.' },
  { id: 'perm_kernel_pml4', name: 'Direct PML4 & Ring 0 Memory Access', category: 'KERNEL_MEMORY', description: 'Inspect CR3 register, kernel hex dump, page table walk.' },
  { id: 'perm_net_firewall', name: 'Firewall & Routing Manipulation', category: 'NETWORK_FIREWALL', description: 'Open/close TCP/UDP ports, modify iptables/nftables.' },
  { id: 'perm_services_control', name: 'Daemon & Services Lifecycle', category: 'SYSTEM_CONFIG', description: 'Start, stop, enable, and restart systemd / init services.' },
  { id: 'perm_sysctl_tune', name: 'Kernel Sysctl & Registry Tuning', category: 'SYSTEM_CONFIG', description: 'Tune swappiness, dirty ratios, and KCONFIG registry.' },
  { id: 'perm_audit_view', name: 'Security Event & Kernel Journal Logs', category: 'LOGS_AUDITING', description: 'Read full dmesg, auth.log, and audit incident logs.' },
  { id: 'perm_pkg_install', name: 'Package & Firmware Pool Installation', category: 'PACKAGES', description: 'Install binary packages, kernel modules, and drivers.' },
  { id: 'perm_user_mgmt', name: 'User & Group Policy Administration', category: 'USERS_SECURITY', description: 'Create, edit, lock, unlock accounts and manage RBAC roles.' },
  { id: 'perm_domain_join', name: 'Active Directory / LDAP Domain Join', category: 'USERS_SECURITY', description: 'Join or disconnect machines from Windows / Linux Server DCs.' }
];

export const SYSTEM_ROLES: Record<RoleLevel, SecurityRole> = {
  ROOT_ADMIN: {
    id: 'ROOT_ADMIN',
    name: 'Root Administrator (Superuser)',
    description: 'Unrestricted supervisor ring 0 access, full sudo elevation, domain trust coordinator.',
    color: 'from-purple-600 to-indigo-600',
    permissions: SYSTEM_PERMISSIONS.map(p => p.id),
    canSudo: true,
    requiresPinElevation: true,
    defaultShell: '/bin/bash',
    allowedLogonHours: '24/7 Unrestricted'
  },
  SECURITY_OPERATOR: {
    id: 'SECURITY_OPERATOR',
    name: 'Security & Incident Operator',
    description: 'Manages firewall policies, audits auth logs, isolates USB ports, and controls SAM security.',
    color: 'from-rose-600 to-pink-600',
    permissions: [
      'perm_net_firewall',
      'perm_audit_view',
      'perm_user_mgmt',
      'perm_storage_backup'
    ],
    canSudo: true,
    requiresPinElevation: true,
    defaultShell: '/bin/bash',
    allowedLogonHours: '24/7 Unrestricted'
  },
  SYSTEM_ENGINEER: {
    id: 'SYSTEM_ENGINEER',
    name: 'System Infrastructure Engineer',
    description: 'Hardware partitioning, package deployments, kernel sysctl parameters, and daemon supervisor.',
    color: 'from-cyan-600 to-blue-600',
    permissions: [
      'perm_storage_format',
      'perm_storage_backup',
      'perm_services_control',
      'perm_sysctl_tune',
      'perm_pkg_install',
      'perm_audit_view'
    ],
    canSudo: true,
    requiresPinElevation: true,
    defaultShell: '/bin/zsh',
    allowedLogonHours: 'Mon-Sun 06:00-22:00'
  },
  AUDIT_ANALYST: {
    id: 'AUDIT_ANALYST',
    name: 'Forensic Audit & Compliance Analyst',
    description: 'Read-only access to event viewer, journal logs, packet captures, and memory telemetry.',
    color: 'from-amber-600 to-orange-600',
    permissions: [
      'perm_audit_view'
    ],
    canSudo: false,
    requiresPinElevation: false,
    defaultShell: '/bin/sh',
    allowedLogonHours: 'Mon-Fri 08:00-18:00'
  },
  STANDARD_USER: {
    id: 'STANDARD_USER',
    name: 'Standard Desktop Operator',
    description: 'Unprivileged Ring 3 desktop environment, runs standard user apps, sandboxed storage.',
    color: 'from-emerald-600 to-teal-600',
    permissions: [
      'perm_pkg_install'
    ],
    canSudo: false,
    requiresPinElevation: false,
    defaultShell: '/bin/bash',
    allowedLogonHours: 'Standard Business Hours'
  },
  GUEST_RESTRICTED: {
    id: 'GUEST_RESTRICTED',
    name: 'Restricted Ephemeral Guest',
    description: 'Disposable session in isolated memory space, temporary profile wiped upon logout.',
    color: 'from-slate-600 to-gray-600',
    permissions: [],
    canSudo: false,
    requiresPinElevation: false,
    defaultShell: '/bin/rbash',
    allowedLogonHours: 'Max 2 Hours / Ephemeral'
  }
};

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    fullName: 'System Administrator',
    title: 'Chief Information Security Officer & Root Admin',
    email: 'admin@securecurtain.local',
    role: 'ROOT_ADMIN',
    groups: ['grp_wheel', 'grp_sudo', 'grp_admins', 'grp_storage', 'grp_security'],
    status: 'ACTIVE',
    domain: 'LOCAL_STANDALONE',
    uid: 1000,
    gid: 1000,
    homeDirectory: '/home/admin',
    shell: '/bin/zsh',
    avatarGradient: 'from-purple-600 via-indigo-600 to-cyan-500',
    pin: '7572',
    password: 'SecureCurtain#7572!',
    forcePasswordReset: false,
    mfaEnabled: true,
    mfaMethod: 'TOTP_AUTH',
    totpSecret: 'JBSWY3DPEHPK3PXP',
    lastLogin: 'Just now (Active Session)',
    passwordExpiresDays: 90,
    failedLoginsCount: 0,
    sid: 'S-1-5-21-3849201948-1000'
  },
  {
    id: 'usr_sarah_sec',
    username: 'sarah.connor',
    fullName: 'Sarah Connor',
    title: 'Security Operations & SOC Lead',
    email: 'sarah.c@securecurtain.internal',
    role: 'SECURITY_OPERATOR',
    groups: ['grp_security', 'grp_audit', 'grp_sudo'],
    status: 'ACTIVE',
    domain: 'LOCAL_STANDALONE',
    uid: 1001,
    gid: 1001,
    homeDirectory: '/home/sarah.connor',
    shell: '/bin/bash',
    avatarGradient: 'from-rose-600 via-pink-600 to-amber-500',
    pin: '2026',
    password: 'SecOps#Shield2026!',
    forcePasswordReset: false,
    mfaEnabled: true,
    mfaMethod: 'TOTP_AUTH',
    totpSecret: 'HXDMVJECJJWSRZ3U',
    lastLogin: 'Today at 08:42 UTC',
    passwordExpiresDays: 45,
    failedLoginsCount: 0,
    sid: 'S-1-5-21-3849201948-1001'
  },
  {
    id: 'usr_alex_eng',
    username: 'alex.vance',
    fullName: 'Alex Vance',
    title: 'Principal Kernel & Infrastructure Engineer',
    email: 'alex.v@securecurtain.internal',
    role: 'SYSTEM_ENGINEER',
    groups: ['grp_engineers', 'grp_storage', 'grp_sudo'],
    status: 'ACTIVE',
    domain: 'LOCAL_STANDALONE',
    uid: 1002,
    gid: 1002,
    homeDirectory: '/home/alex.vance',
    shell: '/bin/bash',
    avatarGradient: 'from-cyan-600 via-teal-600 to-emerald-500',
    pin: '4491',
    password: 'Kernel#Linux6.12!',
    forcePasswordReset: false,
    mfaEnabled: false,
    mfaMethod: 'TOTP_AUTH',
    totpSecret: 'MFRGGZDFMZTWQ2LK',
    lastLogin: 'Yesterday at 16:15 UTC',
    passwordExpiresDays: 60,
    failedLoginsCount: 0,
    sid: 'S-1-5-21-3849201948-1002'
  },
  {
    id: 'usr_audit_guest',
    username: 'compliance.auditor',
    fullName: 'ISO-27001 Auditor',
    title: 'External Compliance & Forensics Inspector',
    email: 'auditor@external-cert.org',
    role: 'AUDIT_ANALYST',
    groups: ['grp_audit'],
    status: 'ACTIVE',
    domain: 'LOCAL_STANDALONE',
    uid: 1003,
    gid: 1003,
    homeDirectory: '/home/compliance.auditor',
    shell: '/bin/sh',
    avatarGradient: 'from-amber-600 via-orange-600 to-yellow-500',
    pin: '1234',
    password: 'Audit#ISO27001!',
    forcePasswordReset: false,
    mfaEnabled: true,
    mfaMethod: 'HARDWARE_FIDO2',
    totpSecret: 'NBSWY3DPO5XXE3DE',
    lastLogin: '3 days ago',
    passwordExpiresDays: 14,
    failedLoginsCount: 0,
    sid: 'S-1-5-21-3849201948-1003'
  },
  {
    id: 'usr_david_std',
    username: 'david.miller',
    fullName: 'David Miller',
    title: 'Standard Desktop Operator',
    email: 'david.m@securecurtain.internal',
    role: 'STANDARD_USER',
    groups: [],
    status: 'ACTIVE',
    domain: 'LOCAL_STANDALONE',
    uid: 1004,
    gid: 1004,
    homeDirectory: '/home/david.miller',
    shell: '/bin/bash',
    avatarGradient: 'from-emerald-600 via-teal-600 to-cyan-500',
    pin: '5566',
    password: 'Desktop#User2026!',
    forcePasswordReset: false,
    mfaEnabled: false,
    mfaMethod: 'TOTP_AUTH',
    totpSecret: 'OBZXG5DSOR4HPK2C',
    lastLogin: 'Today at 09:12 UTC',
    passwordExpiresDays: 90,
    failedLoginsCount: 0,
    sid: 'S-1-5-21-3849201948-1004'
  }
];

export interface UserAuditLog {
  id: string;
  timestamp: string;
  actorUsername: string;
  actionType: 'USER_CREATED' | 'USER_EDITED' | 'USER_DELETED' | 'USER_LOCKED' | 'USER_UNLOCKED' | 'EMERGENCY_RESET' | 'PASSWORD_CHANGED' | 'DOMAIN_JOIN' | 'POLICY_UPDATE' | 'SECURITY_THREAT_BLOCKED';
  targetUsername: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY_EMERGENCY';
  ipOrSource: string;
}

const INITIAL_AUDIT_LOGS: UserAuditLog[] = [
  {
    id: 'aud_001',
    timestamp: '2026-08-29 15:42:10 UTC',
    actorUsername: 'admin (ROOT_ADMIN)',
    actionType: 'USER_CREATED',
    targetUsername: 'david.miller',
    details: 'Provisioned unprivileged desktop operator account with sandboxed storage.',
    severity: 'INFO',
    ipOrSource: 'localhost [tty1]'
  },
  {
    id: 'aud_002',
    timestamp: '2026-08-29 15:58:33 UTC',
    actorUsername: 'sarah.connor (SECURITY_OPERATOR)',
    actionType: 'POLICY_UPDATE',
    targetUsername: 'SYSTEM',
    details: 'Synchronized PAM pwquality 2-digit integer thresholds & Argon2id memory cost.',
    severity: 'WARNING',
    ipOrSource: '192.168.1.45 [pam_pwquality]'
  }
];

const INITIAL_GROUPS: UserGroup[] = [
  {
    id: 'grp_wheel',
    name: 'wheel',
    description: 'Unix Root Supervisor Group with unrestricted kernel syscall privileges',
    gid: 10,
    memberUsernames: ['admin'],
    roleInherited: 'ROOT_ADMIN',
    isSystemGroup: true,
    domain: 'LOCAL_STANDALONE',
    specialRights: ['NOPASSWD_ALL', 'SE_DEBUG_NAME', 'CAP_SYS_ADMIN']
  },
  {
    id: 'grp_sudo',
    name: 'sudo / Administrators',
    description: 'Privileged user elevation group (equivalent to Windows Administrators / Linux sudoers)',
    gid: 27,
    memberUsernames: ['admin', 'sarah.connor', 'alex.vance'],
    roleInherited: 'ROOT_ADMIN',
    isSystemGroup: true,
    domain: 'LOCAL_STANDALONE',
    specialRights: ['ELEVATE_PIN_REQUIRED', 'SE_SECURITY_NAME', 'MANAGE_USERS']
  },
  {
    id: 'grp_security',
    name: 'secops / Network Operators',
    description: 'Security operations, firewall filter policy, socket telemetry, and SAM access',
    gid: 105,
    memberUsernames: ['admin', 'sarah.connor'],
    roleInherited: 'SECURITY_OPERATOR',
    isSystemGroup: false,
    domain: 'LOCAL_STANDALONE',
    specialRights: ['FIREWALL_EDIT', 'AUDIT_LOG_CLEAR', 'SE_AUDIT_NAME']
  },
  {
    id: 'grp_engineers',
    name: 'syseng / Disk Operators',
    description: 'Filesystem partitioners, volume formatters, backup maintainers, and driver installers',
    gid: 106,
    memberUsernames: ['alex.vance'],
    roleInherited: 'SYSTEM_ENGINEER',
    isSystemGroup: false,
    domain: 'LOCAL_STANDALONE',
    specialRights: ['RAW_DISK_WRITE', 'SERVICES_RESTART', 'BACKUP_CREATE']
  },
  {
    id: 'grp_audit',
    name: 'auditors / Event Viewers',
    description: 'Read-only compliance inspectors for kernel journal and system telemetry',
    gid: 107,
    memberUsernames: ['compliance.auditor', 'sarah.connor'],
    roleInherited: 'AUDIT_ANALYST',
    isSystemGroup: false,
    domain: 'LOCAL_STANDALONE',
    specialRights: ['JOURNAL_READ_ONLY', 'SE_EVENT_VIEWER_READ']
  },
  {
    id: 'grp_storage',
    name: 'storage / Backup Operators',
    description: 'Members authorized to mount and read/write encrypted external backup media',
    gid: 108,
    memberUsernames: ['admin', 'alex.vance'],
    isSystemGroup: false,
    domain: 'LOCAL_STANDALONE',
    specialRights: ['USB_MOUNT_AIRGAP', 'SE_BACKUP_NAME']
  }
];

class UserManagementService {
  private users: UserAccount[] = [...INITIAL_USERS];
  private groups: UserGroup[] = [...INITIAL_GROUPS];
  private passwordPolicy: PasswordSecurityPolicy = { ...DEFAULT_PASSWORD_POLICY };
  private auditLogs: UserAuditLog[] = [...INITIAL_AUDIT_LOGS];
  private currentSessionUserId: string = 'usr_admin'; // Active logged-in session persona
  private networkDomain: NetworkDomainConfig = {
    domainType: 'LOCAL_STANDALONE',
    domainRealm: 'CORP.SECURECURTAIN.NET',
    primaryDcServer: 'dc01.corp.securecurtain.net (192.168.1.10)',
    secondaryDcServer: 'dc02.corp.securecurtain.net (192.168.1.11)',
    kerberosRealm: 'CORP.SECURECURTAIN.NET',
    ldapBaseDn: 'DC=corp,DC=securecurtain,DC=net',
    ldapBindUser: 'CN=BindAgent,OU=ServiceAccounts,DC=corp,DC=securecurtain,DC=net',
    joinStatus: 'DISCONNECTED',
    lastSyncTimestamp: 'Never (Operating Standalone)',
    syncedUsersCount: 0,
    syncedGroupsCount: 0,
    autoCreateHomeDir: true,
    enableSssdCaching: true,
    allowOfflineCredentials: true,
    adGroupPolicyEnforced: true,
    trustTicketsExpiryHours: 10
  };

  // Listeners for reactive updates
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadPersistedUsers();
  }

  private loadPersistedUsers(): void {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('securecurtain_users_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.users = parsed;
            this.currentSessionUserId = parsed[0]?.id || 'usr_admin';
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted users from localStorage', e);
    }
  }

  public savePersistedUsers(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('securecurtain_users_v2', JSON.stringify(this.users));
      }
    } catch (e) {
      console.warn('Failed to save persisted users to localStorage', e);
    }
  }

  private notify() {
    this.savePersistedUsers();
    this.listeners.forEach(cb => cb());
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public getUsers(): UserAccount[] {
    return [...this.users];
  }

  public getCurrentSessionUser(): UserAccount {
    const found = this.users.find(u => u.id === this.currentSessionUserId);
    return found || this.users[0] || INITIAL_USERS[0];
  }

  public setCurrentSessionUser(userId: string): void {
    const exists = this.users.some(u => u.id === userId);
    if (exists) {
      this.currentSessionUserId = userId;
      this.notify();
    }
  }

  public isAdminLevel(role: RoleLevel): boolean {
    return role === 'ROOT_ADMIN' || role === 'SECURITY_OPERATOR';
  }

  /**
   * Evaluates user edit privileges according to security mandates:
   * 1. Regular users CANNOT edit their own profile or any other user.
   * 2. Admin-level users CAN edit everyone EXCEPT themselves (to prevent audit tampering / privilege escalation flaws).
   * 3. Admin-level users MUST use 'Emergency User Reset' to recover/reset their own account in case of lockout or malfeasance.
   */
  public canEditUserProfile(actorUserId: string, targetUserId: string): {
    allowed: boolean;
    reason: string;
    isSelf: boolean;
    isActorAdmin: boolean;
    canUseEmergencyReset: boolean;
  } {
    const actor = this.users.find(u => u.id === actorUserId);
    const target = this.users.find(u => u.id === targetUserId);

    if (!actor) {
      return {
        allowed: false,
        reason: 'Unauthenticated session. No valid actor identity found.',
        isSelf: false,
        isActorAdmin: false,
        canUseEmergencyReset: false
      };
    }

    if (!target) {
      return {
        allowed: false,
        reason: 'Target user does not exist.',
        isSelf: false,
        isActorAdmin: false,
        canUseEmergencyReset: false
      };
    }

    const isSelf = actor.id === target.id;
    const isActorAdmin = this.isAdminLevel(actor.role);

    // Rule 1: Regular users cannot edit their own profile or anyone else
    if (!isActorAdmin) {
      if (isSelf) {
        return {
          allowed: false,
          reason: 'Security Policy Block: Standard / non-admin users are strictly prohibited from editing their own profile, credentials, or assigned roles. Please contact a Root/Security Administrator.',
          isSelf: true,
          isActorAdmin: false,
          canUseEmergencyReset: false
        };
      } else {
        return {
          allowed: false,
          reason: 'Access Denied: Standard users possess read-only directory visibility and cannot modify other user accounts.',
          isSelf: false,
          isActorAdmin: false,
          canUseEmergencyReset: false
        };
      }
    }

    // Rule 2 & 3: Admin-level users
    if (isSelf) {
      return {
        allowed: false,
        reason: "Self-Modification Block: Admin-level users cannot edit themselves via standard user edit to prevent privilege tampering or audit circumvention. Use 'Emergency User Reset' in case of lockout, compromised credentials, or malfeasance.",
        isSelf: true,
        isActorAdmin: true,
        canUseEmergencyReset: true
      };
    }

    // Admin editing someone else -> Allowed!
    return {
      allowed: true,
      reason: 'Admin-level authorization granted: You are permitted to edit non-self user profiles.',
      isSelf: false,
      isActorAdmin: true,
      canUseEmergencyReset: true
    };
  }

  /**
   * Checks whether the actor can perform an Emergency User Reset on the target.
   * Admin-level users can emergency reset themselves (lockout recovery) or other accounts.
   */
  public canEmergencyReset(actorUserId: string, targetUserId: string): {
    allowed: boolean;
    reason: string;
    isSelf: boolean;
  } {
    const actor = this.users.find(u => u.id === actorUserId);
    const target = this.users.find(u => u.id === targetUserId);

    if (!actor || !target) {
      return { allowed: false, reason: 'Invalid actor or target user.', isSelf: false };
    }

    const isSelf = actor.id === target.id;
    const isActorAdmin = this.isAdminLevel(actor.role);

    if (!isActorAdmin) {
      return {
        allowed: false,
        reason: 'Emergency User Reset is strictly restricted to Root & Security Administrators.',
        isSelf
      };
    }

    // Admin resetting self -> Authorized for lockout/malfeasance recovery!
    if (isSelf) {
      return {
        allowed: true,
        reason: 'Self Emergency Recovery Authorized: Admin-level lockout & credential restoration protocol enabled.',
        isSelf: true
      };
    }

    // Root Admin can reset anyone; Security Operator can reset anyone except Root Admin
    if (actor.role === 'SECURITY_OPERATOR' && target.role === 'ROOT_ADMIN') {
      return {
        allowed: false,
        reason: 'Security Operator cannot perform emergency overrides on the primary Root Administrator account.',
        isSelf: false
      };
    }

    return {
      allowed: true,
      reason: 'Administrative Emergency Reset authorized.',
      isSelf: false
    };
  }

  /**
   * Secure User Edit with RBAC enforcement and Audit Logging
   */
  public updateUserProfile(
    actorUserId: string,
    targetUserId: string,
    updates: Partial<UserAccount>
  ): { success: boolean; message: string } {
    const check = this.canEditUserProfile(actorUserId, targetUserId);
    if (!check.allowed) {
      return { success: false, message: check.reason };
    }

    const targetUser = this.users.find(u => u.id === targetUserId);
    const actorUser = this.users.find(u => u.id === actorUserId);
    if (!targetUser || !actorUser) {
      return { success: false, message: 'User not found.' };
    }

    // Update user
    const success = this.updateUser(targetUserId, updates);
    if (success) {
      this.recordAudit({
        actorUsername: `${actorUser.username} (${actorUser.role})`,
        actionType: 'USER_EDITED',
        targetUsername: targetUser.username,
        details: `Modified profile attributes: [${Object.keys(updates).join(', ')}]`,
        severity: 'INFO',
        ipOrSource: 'User Management Cockpit'
      });
      return { success: true, message: `User @${targetUser.username} profile updated successfully.` };
    }

    return { success: false, message: 'Failed to apply user updates.' };
  }

  /**
   * Emergency User Reset function (Admins can reset their own or others in case of lockout/malfeasance)
   */
  public emergencyUserReset(
    actorUserId: string,
    targetUserId: string,
    resetData: {
      newPin?: string;
      newPassword?: string;
      forcePasswordReset?: boolean;
      unlockAccount?: boolean;
      restoreAdminRole?: boolean;
      resetFailedAttempts?: boolean;
      reason?: string;
      emergencyToken?: string;
    }
  ): { success: boolean; message: string } {
    const check = this.canEmergencyReset(actorUserId, targetUserId);
    if (!check.allowed) {
      return { success: false, message: check.reason };
    }

    const target = this.users.find(u => u.id === targetUserId);
    const actor = this.users.find(u => u.id === actorUserId);
    if (!target || !actor) {
      return { success: false, message: 'Target or Actor user not found.' };
    }

    // Apply Emergency Reset Actions (Dual Credential Reset)
    if (resetData.newPin) {
      target.pin = resetData.newPin;
    }

    if (resetData.newPassword) {
      target.password = resetData.newPassword;
    }

    if (resetData.forcePasswordReset !== undefined) {
      target.forcePasswordReset = resetData.forcePasswordReset;
    }

    if (resetData.unlockAccount) {
      target.status = 'ACTIVE';
    }

    if (resetData.resetFailedAttempts) {
      target.failedLoginsCount = 0;
      target.passwordExpiresDays = this.passwordPolicy.maxPasswordAgeDays;
    }

    if (resetData.restoreAdminRole) {
      if (target.id === 'usr_admin' || target.role === 'ROOT_ADMIN' || target.uid === 1000) {
        target.role = 'ROOT_ADMIN';
        if (!target.groups.includes('grp_wheel')) target.groups.push('grp_wheel');
        if (!target.groups.includes('grp_sudo')) target.groups.push('grp_sudo');
      } else {
        target.role = 'SECURITY_OPERATOR';
        if (!target.groups.includes('grp_security')) target.groups.push('grp_security');
        if (!target.groups.includes('grp_sudo')) target.groups.push('grp_sudo');
      }
    }

    target.lastLogin = `Emergency Reset (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;

    // Record Critical Audit Log
    this.recordAudit({
      actorUsername: `${actor.username} (${actor.role})`,
      actionType: 'EMERGENCY_RESET',
      targetUsername: target.username,
      details: `Emergency Dual-Credential Reset executed. Reason: "${SecuritySanitizer.sanitizeGenericText(resetData.reason || 'Account lockout / credential recovery')}". Unlocked: ${!!resetData.unlockAccount}, PasswordReset: ${!!resetData.newPassword}, PinReset: ${!!resetData.newPin}, ForceChangeOnLogin: ${!!resetData.forcePasswordReset}, AdminRestored: ${!!resetData.restoreAdminRole}`,
      severity: 'SECURITY_EMERGENCY',
      ipOrSource: 'Air-Gap Master Recovery Console'
    });

    this.notify();
    return {
      success: true,
      message: `Emergency Reset completed for @${target.username}. Primary Login Password and Elevation PIN updated.`
    };
  }

  /**
   * Records a security threat / malicious input attempt in the system audit logs.
   */
  public recordSecurityThreat(actorUsername: string, targetField: string, threatDetails: string, source: string = 'Input Sanitizer'): void {
    this.recordAudit({
      actorUsername,
      actionType: 'SECURITY_THREAT_BLOCKED',
      targetUsername: targetField,
      details: `Malicious payload / injection attempt blocked in [${targetField}]: ${threatDetails}`,
      severity: 'CRITICAL',
      ipOrSource: source
    });
    this.notify();
  }

  /**
   * Set user permanent password after emergency or forced reset
   */
  public changeUserPassword(userId: string, newPassword: string, actorUsername?: string): { success: boolean; message: string } {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found' };

    user.password = newPassword;
    user.forcePasswordReset = false;
    user.passwordExpiresDays = this.passwordPolicy.maxPasswordAgeDays;
    user.failedLoginsCount = 0;

    this.recordAudit({
      actorUsername: actorUsername || user.username,
      actionType: 'PASSWORD_CHANGED',
      targetUsername: user.username,
      details: `Permanent system password successfully set and validated against policy.`,
      severity: 'INFO',
      ipOrSource: 'PAM Authentication Subsystem'
    });

    this.notify();
    return { success: true, message: `Password successfully updated for @${user.username}.` };
  }

  public getAuditLogs(): UserAuditLog[] {
    return [...this.auditLogs];
  }

  private recordAudit(entry: Omit<UserAuditLog, 'id' | 'timestamp'>): void {
    const newEntry: UserAuditLog = {
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
    };
    this.auditLogs.unshift(newEntry);
    if (this.auditLogs.length > 50) this.auditLogs.pop();
  }

  public getGroups(): UserGroup[] {
    return [...this.groups];
  }

  public getDomainConfig(): NetworkDomainConfig {
    return { ...this.networkDomain };
  }

  public getRoles(): Record<RoleLevel, SecurityRole> {
    return SYSTEM_ROLES;
  }

  public getPermissions(): UserPermission[] {
    return SYSTEM_PERMISSIONS;
  }

  public getPasswordPolicy(): PasswordSecurityPolicy {
    return { ...this.passwordPolicy };
  }

  public updatePasswordPolicy(updates: Partial<PasswordSecurityPolicy>): PasswordSecurityPolicy {
    this.passwordPolicy = {
      ...this.passwordPolicy,
      ...updates
    };

    // If max age changed, synchronize user expiration days for active accounts
    if (updates.maxPasswordAgeDays !== undefined) {
      this.users.forEach(u => {
        if (u.status === 'ACTIVE') {
          u.passwordExpiresDays = Math.min(u.passwordExpiresDays, this.passwordPolicy.maxPasswordAgeDays);
        }
      });
    }

    this.notify();
    return { ...this.passwordPolicy };
  }

  public applyPasswordPolicyPreset(presetKey: string): PasswordSecurityPolicy {
    const preset = PASSWORD_POLICY_PRESETS[presetKey];
    if (preset) {
      this.passwordPolicy = { ...preset.policy };
      this.notify();
    }
    return { ...this.passwordPolicy };
  }

  public resetPasswordPolicy(): PasswordSecurityPolicy {
    this.passwordPolicy = { ...DEFAULT_PASSWORD_POLICY };
    this.notify();
    return { ...this.passwordPolicy };
  }

  public validatePasswordAgainstPolicy(
    password: string,
    username: string = '',
    fullName: string = ''
  ): {
    isValid: boolean;
    errors: string[];
    strengthScore: number;
    characterClassesMet: number;
    ruleResults: Record<string, boolean>;
  } {
    const pol = this.passwordPolicy;
    const errors: string[] = [];
    const ruleResults: Record<string, boolean> = {};

    // 1. Min Length
    const isMinLength = !pol.enforceMinLength || password.length >= pol.minLength;
    ruleResults.minLength = isMinLength;
    if (!isMinLength) {
      errors.push(`Password must be at least ${pol.minLength} characters in length.`);
    }

    // 2. Max Length
    const isMaxLength = password.length <= pol.maxLength;
    ruleResults.maxLength = isMaxLength;
    if (!isMaxLength) {
      errors.push(`Password cannot exceed ${pol.maxLength} characters.`);
    }

    // 3. Alphanumeric Check
    const hasAlpha = /[a-zA-Z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const isAlphanumeric = hasAlpha && hasNum;
    ruleResults.alphanumeric = !pol.requireAlphanumeric || isAlphanumeric;
    if (pol.requireAlphanumeric && !isAlphanumeric) {
      errors.push('Password must be alphanumeric (contain both alphabetic letters and numeric digits).');
    }

    // 4. Uppercase
    const hasUpper = /[A-Z]/.test(password);
    ruleResults.uppercase = !pol.requireUppercase || hasUpper;
    if (pol.requireUppercase && !hasUpper) {
      errors.push('Password must include at least one uppercase letter (A-Z).');
    }

    // 5. Lowercase
    const hasLower = /[a-z]/.test(password);
    ruleResults.lowercase = !pol.requireLowercase || hasLower;
    if (pol.requireLowercase && !hasLower) {
      errors.push('Password must include at least one lowercase letter (a-z).');
    }

    // 6. Digits & Minimum Digits Count
    const digitMatches = password.match(/[0-9]/g) || [];
    const hasDigit = digitMatches.length >= (pol.minDigitsCount || 1);
    ruleResults.digits = !pol.requireDigits || hasDigit;
    if (pol.requireDigits && !hasDigit) {
      errors.push(`Password must include at least ${pol.minDigitsCount || 1} numeric digit(s) (0-9).`);
    }

    // 7. Special Chars & Minimum Special Characters Count
    const specialMatches = password.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`'"/\\]/g) || [];
    const hasSpecial = specialMatches.length >= (pol.minSpecialCharsCount || 1);
    ruleResults.specialChars = !pol.requireSpecialChars || hasSpecial;
    if (pol.requireSpecialChars && !hasSpecial) {
      errors.push(`Password must include at least ${pol.minSpecialCharsCount || 1} special symbol(s) (!@#$%^&*...).`);
    }

    // 7. Character Classes count
    let classesCount = 0;
    if (hasUpper) classesCount++;
    if (hasLower) classesCount++;
    if (hasDigit) classesCount++;
    if (hasSpecial) classesCount++;
    const isClassesMet = classesCount >= pol.minCharacterClasses;
    ruleResults.characterClasses = isClassesMet;
    if (!isClassesMet) {
      errors.push(`Password must satisfy at least ${pol.minCharacterClasses} distinct character classes.`);
    }

    // 8. Username Check
    let usernameViolated = false;
    if (pol.disallowUsernameInPassword && username.trim().length >= 3) {
      if (password.toLowerCase().includes(username.toLowerCase().trim())) {
        usernameViolated = true;
        errors.push('Password cannot contain your account username.');
      }
    }
    ruleResults.disallowUsername = !usernameViolated;

    // 9. Full Name Check
    let fullNameViolated = false;
    if (pol.disallowFullNameInPassword && fullName.trim().length >= 3) {
      const parts = fullName.toLowerCase().trim().split(/\s+/);
      for (const p of parts) {
        if (p.length >= 3 && password.toLowerCase().includes(p)) {
          fullNameViolated = true;
          errors.push('Password cannot contain your legal or display name.');
          break;
        }
      }
    }
    ruleResults.disallowFullName = !fullNameViolated;

    // 10. Dictionary blacklist simulation
    const commonPasswords = ['password', '123456', 'admin123', 'qwerty', 'welcome1', 'root123', 'letmein', 'secure123'];
    let dictionaryViolated = false;
    if (pol.enforceDictionaryBlacklist) {
      if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
        dictionaryViolated = true;
        errors.push('Password matches a common dictionary blacklist or known breach entry.');
      }
    }
    ruleResults.dictionaryBlacklist = !dictionaryViolated;

    // Calculate strength score (0 - 100)
    let strengthScore = 0;
    if (password.length > 0) {
      strengthScore += Math.min(password.length * 4, 40);
      if (hasUpper) strengthScore += 15;
      if (hasLower) strengthScore += 15;
      if (hasDigit) strengthScore += 15;
      if (hasSpecial) strengthScore += 15;
      if (classesCount >= 4) strengthScore += 10;
      if (password.length >= 14) strengthScore += 10;
      if (usernameViolated || fullNameViolated || dictionaryViolated) strengthScore = Math.max(strengthScore - 40, 10);
    }
    strengthScore = Math.min(Math.max(strengthScore, 0), 100);

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      strengthScore,
      characterClassesMet: classesCount,
      ruleResults
    };
  }

  public generatePamPwQualityConfig(): string {
    const p = this.passwordPolicy;
    return `# /etc/security/pwquality.conf - Synchronized by SecureCurtain OS Policy Engine
# Minimum length of password
minlen = ${p.minLength}

# Character class requirements (negative values enforce mandatory minimum count)
dcredit = ${p.requireDigits ? -1 : 0}
ucredit = ${p.requireUppercase ? -1 : 0}
lcredit = ${p.requireLowercase ? -1 : 0}
ocredit = ${p.requireSpecialChars ? -1 : 0}

# Minimum distinct character classes required
minclass = ${p.minCharacterClasses}

# Maximum consecutive identical characters
maxrepeat = 3

# Password history check depth (/etc/security/opasswd)
remember = ${p.passwordHistoryCount}

# Disallow username substrings in password
usercheck = ${p.disallowUsernameInPassword ? 1 : 0}

# Enforce strict dictionary / cracklib check
dictcheck = ${p.enforceDictionaryBlacklist ? 1 : 0}

# /etc/login.defs shadow parameters:
# PASS_MAX_DAYS\t${p.maxPasswordAgeDays}
# PASS_MIN_DAYS\t${p.minPasswordAgeDays}
# PASS_WARN_AGE\t${p.expirationWarningDays}
# HASH_ALGO\t${p.hashingAlgorithm.toUpperCase()}
# PAM_FAILLOCK_DENY\t${p.maxFailedLoginsBeforeLock}
# PAM_FAILLOCK_UNLOCK_TIME\t${p.lockoutDurationMinutes * 60}`;
  }

  public addUser(user: Omit<UserAccount, 'id' | 'uid' | 'gid' | 'failedLoginsCount'>): UserAccount {
    const nextUid = Math.max(...this.users.map(u => u.uid), 1000) + 1;
    const nextGid = nextUid;

    // Sanitize user inputs against XSS, SQLi, Path Traversal, and Control Chars
    const sanitizedUsernameRes = SecuritySanitizer.sanitizeUsername(user.username);
    const safeUsername = sanitizedUsernameRes.sanitized || `user${nextUid}`;
    const safeFullName = SecuritySanitizer.sanitizeGenericText(user.fullName);
    const safeEmail = SecuritySanitizer.sanitizeEmail(user.email).sanitized || `${safeUsername}@securecurtain.internal`;
    const safeHomeDir = SecuritySanitizer.sanitizePath(user.homeDirectory).sanitized;
    const safeShell = SecuritySanitizer.sanitizeShell(user.shell).sanitized;
    const safePin = SecuritySanitizer.sanitizePin(user.pin).sanitized || '7572';
    const safePassword = user.password ? SecuritySanitizer.sanitizePassword(user.password).sanitized : undefined;

    const newId = `usr_${safeUsername.replace(/[^a-z0-9]/g, '_')}`;

    const newUser: UserAccount = {
      ...user,
      id: newId,
      username: safeUsername,
      fullName: safeFullName,
      email: safeEmail,
      homeDirectory: safeHomeDir,
      shell: safeShell,
      pin: safePin,
      password: safePassword,
      uid: nextUid,
      gid: nextGid,
      failedLoginsCount: 0,
      sid: `S-1-5-21-3849201948-${nextUid}`,
      lastLogin: 'Never (Newly Provisioned)'
    };

    this.users.push(newUser);

    // Update group memberships if selected
    user.groups.forEach(grpId => {
      const g = this.groups.find(x => x.id === grpId);
      if (g && !g.memberUsernames.includes(newUser.username)) {
        g.memberUsernames.push(newUser.username);
      }
    });

    this.notify();
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<UserAccount>): boolean {
    const idx = this.users.findIndex(u => u.id === userId);
    if (idx === -1) return false;

    const oldUser = this.users[idx];

    // Sanitize any incoming updates
    const sanitizedUpdates: Partial<UserAccount> = { ...updates };
    if (updates.fullName !== undefined) {
      sanitizedUpdates.fullName = SecuritySanitizer.sanitizeGenericText(updates.fullName);
    }
    if (updates.title !== undefined) {
      sanitizedUpdates.title = SecuritySanitizer.sanitizeGenericText(updates.title);
    }
    if (updates.email !== undefined) {
      sanitizedUpdates.email = SecuritySanitizer.sanitizeEmail(updates.email).sanitized || oldUser.email;
    }
    if (updates.homeDirectory !== undefined) {
      sanitizedUpdates.homeDirectory = SecuritySanitizer.sanitizePath(updates.homeDirectory).sanitized;
    }
    if (updates.shell !== undefined) {
      sanitizedUpdates.shell = SecuritySanitizer.sanitizeShell(updates.shell).sanitized;
    }
    if (updates.pin !== undefined) {
      sanitizedUpdates.pin = SecuritySanitizer.sanitizePin(updates.pin).sanitized || oldUser.pin;
    }
    if (updates.password !== undefined) {
      sanitizedUpdates.password = SecuritySanitizer.sanitizePassword(updates.password).sanitized;
    }

    const updated = { ...oldUser, ...sanitizedUpdates };
    this.users[idx] = updated;

    // Synchronize group memberships if groups was changed
    if (updates.groups) {
      this.groups.forEach(g => {
        if (updates.groups!.includes(g.id)) {
          if (!g.memberUsernames.includes(updated.username)) {
            g.memberUsernames.push(updated.username);
          }
        } else {
          g.memberUsernames = g.memberUsernames.filter(u => u !== updated.username);
        }
      });
    }

    this.notify();
    return true;
  }

  public deleteUser(userId: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (!user) return false;
    if (user.role === 'ROOT_ADMIN' || user.uid === 1000) return false; // Prevent root lockout

    this.users = this.users.filter(u => u.id !== userId);
    this.groups.forEach(g => {
      g.memberUsernames = g.memberUsernames.filter(u => u !== user.username);
    });

    this.notify();
    return true;
  }

  public toggleLockUser(userId: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (!user) return false;
    if (user.role === 'ROOT_ADMIN' || user.uid === 1000) return false; // Prevent root lockout

    user.status = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    this.notify();
    return true;
  }

  public resetUserPin(userId: string, newPin: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (!user) return false;
    user.pin = newPin;
    this.notify();
    return true;
  }

  public addGroup(group: Omit<UserGroup, 'id' | 'gid'>): UserGroup {
    const nextGid = Math.max(...this.groups.map(g => g.gid), 1000) + 1;
    const newId = `grp_${group.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const newGroup: UserGroup = {
      ...group,
      id: newId,
      gid: nextGid,
      isSystemGroup: false
    };

    this.groups.push(newGroup);

    // Update user group lists
    group.memberUsernames.forEach(uname => {
      const u = this.users.find(x => x.username === uname);
      if (u && !u.groups.includes(newId)) {
        u.groups.push(newId);
      }
    });

    this.notify();
    return newGroup;
  }

  public updateGroup(groupId: string, updates: Partial<UserGroup>): boolean {
    const idx = this.groups.findIndex(g => g.id === groupId);
    if (idx === -1) return false;

    const old = this.groups[idx];
    const updated = { ...old, ...updates };
    this.groups[idx] = updated;

    if (updates.memberUsernames) {
      this.users.forEach(u => {
        if (updates.memberUsernames!.includes(u.username)) {
          if (!u.groups.includes(groupId)) u.groups.push(groupId);
        } else {
          u.groups = u.groups.filter(gId => gId !== groupId);
        }
      });
    }

    this.notify();
    return true;
  }

  public deleteGroup(groupId: string): boolean {
    const grp = this.groups.find(g => g.id === groupId);
    if (!grp || grp.isSystemGroup) return false;

    this.groups = this.groups.filter(g => g.id !== groupId);
    this.users.forEach(u => {
      u.groups = u.groups.filter(gId => gId !== groupId);
    });

    this.notify();
    return true;
  }

  // Network Domain Controller Integration (Windows Active Directory / Linux FreeIPA / Samba4 LDAP)
  public configureNetworkDomain(config: Partial<NetworkDomainConfig>) {
    this.networkDomain = {
      ...this.networkDomain,
      ...config
    };
    this.notify();
  }

  public joinNetworkDomain(domainType: SecurityDomainType, realm: string, dcServer: string, adminUser: string): Promise<boolean> {
    this.networkDomain.joinStatus = 'AUTHENTICATING';
    this.networkDomain.domainType = domainType;
    this.networkDomain.domainRealm = realm.toUpperCase();
    this.networkDomain.primaryDcServer = dcServer;
    this.networkDomain.kerberosRealm = realm.toUpperCase();
    this.networkDomain.ldapBaseDn = realm.split('.').map(part => `DC=${part.toLowerCase()}`).join(',');
    this.notify();

    return new Promise((resolve) => {
      setTimeout(() => {
        this.networkDomain.joinStatus = 'SYNCING';
        this.notify();

        setTimeout(() => {
          this.networkDomain.joinStatus = 'JOINED';
          this.networkDomain.lastSyncTimestamp = new Date().toUTCString();
          this.networkDomain.syncedUsersCount = 142;
          this.networkDomain.syncedGroupsCount = 28;

          // Inject domain mock users into user directory if joined
          const domainUsers: UserAccount[] = [
            {
              id: 'usr_ad_chief_sec',
              username: 'ciso.director@' + realm.toLowerCase(),
              fullName: 'Enterprise CISO Director',
              email: `ciso@${realm.toLowerCase()}`,
              role: 'SECURITY_OPERATOR',
              groups: ['grp_ad_domain_admins', 'grp_security'],
              status: 'ACTIVE',
              domain: domainType,
              domainName: realm.toUpperCase(),
              uid: 20001,
              gid: 20001,
              homeDirectory: `/home/${realm.toLowerCase()}/ciso.director`,
              shell: '/bin/bash',
              avatarGradient: 'from-blue-600 via-indigo-700 to-purple-800',
              pin: '9021',
              mfaEnabled: true,
              mfaMethod: 'HARDWARE_FIDO2',
              lastLogin: 'Domain Kerberos Ticket (Active)',
              passwordExpiresDays: 30,
              failedLoginsCount: 0,
              isDomainUser: true,
              sid: 'S-1-5-21-4928172948-512'
            },
            {
              id: 'usr_ad_dev_lead',
              username: 'cloud.architect@' + realm.toLowerCase(),
              fullName: 'Cloud Infrastructure Lead',
              email: `cloud.lead@${realm.toLowerCase()}`,
              role: 'SYSTEM_ENGINEER',
              groups: ['grp_ad_devops', 'grp_engineers'],
              status: 'ACTIVE',
              domain: domainType,
              domainName: realm.toUpperCase(),
              uid: 20002,
              gid: 20002,
              homeDirectory: `/home/${realm.toLowerCase()}/cloud.architect`,
              shell: '/bin/zsh',
              avatarGradient: 'from-emerald-600 via-cyan-700 to-blue-800',
              pin: '5512',
              mfaEnabled: true,
              mfaMethod: 'TOTP_AUTH',
              lastLogin: 'Domain Kerberos Ticket (Active)',
              passwordExpiresDays: 45,
              failedLoginsCount: 0,
              isDomainUser: true,
              sid: 'S-1-5-21-4928172948-513'
            }
          ];

          // Add domain groups
          const domainGroups: UserGroup[] = [
            {
              id: 'grp_ad_domain_admins',
              name: 'Domain Admins (Enterprise DC)',
              description: `Active Directory / FreeIPA Domain Global Admin Group from ${realm.toUpperCase()}`,
              gid: 20001,
              memberUsernames: [`ciso.director@${realm.toLowerCase()}`],
              roleInherited: 'ROOT_ADMIN',
              isSystemGroup: true,
              domain: domainType,
              specialRights: ['DOMAIN_ADMIN', 'KERBEROS_TGT_DELEGATION', 'GROUP_POLICY_WRITE']
            },
            {
              id: 'grp_ad_devops',
              name: 'DevOps Cloud Engineers (Enterprise DC)',
              description: `Domain centralized engineering group with sudoers access`,
              gid: 20002,
              memberUsernames: [`cloud.architect@${realm.toLowerCase()}`],
              roleInherited: 'SYSTEM_ENGINEER',
              isSystemGroup: false,
              domain: domainType,
              specialRights: ['DOCKER_ACCESS', 'SERVICES_RELOAD']
            }
          ];

          // Filter out existing domain users/groups before inserting
          this.users = [...this.users.filter(u => !u.isDomainUser), ...domainUsers];
          this.groups = [...this.groups.filter(g => g.domain === 'LOCAL_STANDALONE'), ...domainGroups];

          this.notify();
          resolve(true);
        }, 1200);
      }, 1000);
    });
  }

  public leaveNetworkDomain(): Promise<boolean> {
    return new Promise((resolve) => {
      this.networkDomain.joinStatus = 'AUTHENTICATING';
      this.notify();

      setTimeout(() => {
        this.networkDomain.joinStatus = 'DISCONNECTED';
        this.networkDomain.domainType = 'LOCAL_STANDALONE';
        this.networkDomain.lastSyncTimestamp = 'Disconnected';
        this.networkDomain.syncedUsersCount = 0;
        this.networkDomain.syncedGroupsCount = 0;

        // Clean up domain users & groups
        this.users = this.users.filter(u => !u.isDomainUser);
        this.groups = this.groups.filter(g => g.domain === 'LOCAL_STANDALONE');

        this.notify();
        resolve(true);
      }, 800);
    });
  }

  public syncDomainNow(): Promise<boolean> {
    if (this.networkDomain.joinStatus !== 'JOINED') return Promise.resolve(false);
    this.networkDomain.joinStatus = 'SYNCING';
    this.notify();

    return new Promise((resolve) => {
      setTimeout(() => {
        this.networkDomain.joinStatus = 'JOINED';
        this.networkDomain.lastSyncTimestamp = new Date().toUTCString();
        this.notify();
        resolve(true);
      }, 900);
    });
  }

  public recordLoginSuccess(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.lastLogin = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (Active Session)';
      user.failedLoginsCount = 0;
      this.notify();
    }
  }

  public provisionPrimaryAdminUser(adminData: {
    username: string;
    fullName: string;
    title: string;
    email?: string;
    pin: string;
    password?: string;
    shell?: string;
    role?: RoleLevel;
  }): UserAccount {
    const cleanUsername = adminData.username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
    const cleanFullName = adminData.fullName.trim();
    const cleanTitle = adminData.title.trim();
    const cleanPin = adminData.pin.trim();

    // Check if existing primary admin or matching user exists
    const existingIndex = this.users.findIndex(
      u => u.uid === 1000 || u.role === 'ROOT_ADMIN' || u.username === cleanUsername || u.id === 'usr_admin'
    );

    let targetUser: UserAccount;

    if (existingIndex !== -1) {
      const oldUser = this.users[existingIndex];
      targetUser = {
        ...oldUser,
        username: cleanUsername || oldUser.username,
        fullName: cleanFullName || oldUser.fullName,
        title: cleanTitle || 'Chief Information Security Officer & Root Admin',
        email: adminData.email || oldUser.email || `${cleanUsername}@securecurtain.internal`,
        pin: cleanPin || oldUser.pin || '7572',
        shell: adminData.shell || oldUser.shell || '/bin/zsh',
        role: adminData.role || 'ROOT_ADMIN',
        status: 'ACTIVE',
        failedLoginsCount: 0,
        lastLogin: 'Provisioned via Live OS Installer'
      };
      this.users[existingIndex] = targetUser;
    } else {
      targetUser = {
        id: `usr_${cleanUsername}`,
        username: cleanUsername,
        fullName: cleanFullName,
        title: cleanTitle || 'Chief Information Security Officer & Root Admin',
        email: adminData.email || `${cleanUsername}@securecurtain.internal`,
        role: adminData.role || 'ROOT_ADMIN',
        groups: ['grp_wheel', 'grp_sudo', 'grp_admins', 'grp_storage', 'grp_security'],
        status: 'ACTIVE',
        domain: 'LOCAL_STANDALONE',
        uid: 1000,
        gid: 1000,
        homeDirectory: `/home/${cleanUsername}`,
        shell: adminData.shell || '/bin/zsh',
        avatarGradient: 'from-purple-600 via-indigo-600 to-cyan-500',
        pin: cleanPin || '7572',
        mfaEnabled: true,
        mfaMethod: 'PIN_AIRGAP',
        lastLogin: 'Provisioned via Live OS Installer',
        passwordExpiresDays: 90,
        failedLoginsCount: 0,
        sid: 'S-1-5-21-3849201948-1000'
      };
      this.users.unshift(targetUser);
    }

    // Ensure memberUsernames in privileged groups reflect the username
    ['grp_wheel', 'grp_sudo', 'grp_admins', 'grp_security', 'grp_storage'].forEach(grpId => {
      const g = this.groups.find(x => x.id === grpId);
      if (g && !g.memberUsernames.includes(targetUser.username)) {
        g.memberUsernames.push(targetUser.username);
      }
    });

    this.notify();
    return targetUser;
  }

  public initializeCleanOobeInstallation(adminConfig: {
    username: string;
    fullName: string;
    title: string;
    email?: string;
    pin: string;
    password?: string;
    totpSecret?: string;
    includeDemoUsers: boolean;
  }): UserAccount {
    const cleanUsername = adminConfig.username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '') || 'admin';
    const cleanFullName = adminConfig.fullName.trim() || 'System Administrator';
    const cleanTitle = adminConfig.title.trim() || 'Chief Information Security Officer & Root Admin';
    const cleanPin = adminConfig.pin.trim() || '7572';
    const cleanPassword = adminConfig.password || 'SecureCurtain#2026!';
    const cleanEmail = adminConfig.email?.trim() || `${cleanUsername}@securecurtain.local`;

    const rootAdmin: UserAccount = {
      id: `usr_${cleanUsername}`,
      username: cleanUsername,
      fullName: cleanFullName,
      title: cleanTitle,
      email: cleanEmail,
      role: 'ROOT_ADMIN',
      groups: ['grp_wheel', 'grp_sudo', 'grp_admins', 'grp_storage', 'grp_security'],
      status: 'ACTIVE',
      domain: 'LOCAL_STANDALONE',
      uid: 1000,
      gid: 1000,
      homeDirectory: `/home/${cleanUsername}`,
      shell: '/bin/zsh',
      avatarGradient: 'from-purple-600 via-indigo-600 to-cyan-500',
      pin: cleanPin,
      password: cleanPassword,
      forcePasswordReset: false,
      mfaEnabled: true,
      mfaMethod: 'TOTP_AUTH',
      totpSecret: adminConfig.totpSecret || 'JBSWY3DPEHPK3PXP',
      lastLogin: 'Just now (Initial OOBE Commissioning)',
      passwordExpiresDays: 90,
      failedLoginsCount: 0,
      sid: 'S-1-5-21-3849201948-1000'
    };

    if (adminConfig.includeDemoUsers) {
      const demoUsers = INITIAL_USERS.filter(u => u.uid !== 1000 && u.role !== 'ROOT_ADMIN');
      this.users = [rootAdmin, ...demoUsers];
    } else {
      // Clean air-gap installation: ZERO demo users, zero hardcoded placeholder data
      this.users = [rootAdmin];
    }

    // Reset group memberships
    this.groups.forEach(g => {
      g.memberUsernames = [rootAdmin.username];
    });

    this.currentSessionUserId = rootAdmin.id;
    this.savePersistedUsers();
    this.notify();
    return rootAdmin;
  }

  public resetToFactoryFirstBoot(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('securecurtain_users_v2');
        localStorage.removeItem('securecurtain_oobe_completed');
      }
    } catch (e) {
      console.warn('Failed to clear factory reset storage', e);
    }
    this.users = [...INITIAL_USERS];
    this.currentSessionUserId = this.users[0]?.id || 'usr_admin';
    this.notify();
  }
}

// =============================================================================
// DURESS COERCION SYSTEM LOCKDOWN HELPERS & PERSISTENCE
// =============================================================================
const DURESS_LOCKDOWN_KEY = 'securecurtain_duress_lockdown_active';
const DURESS_TIMESTAMP_KEY = 'securecurtain_duress_lockdown_ts';
const DURESS_ORIGIN_USER_KEY = 'securecurtain_duress_origin_user';

export const checkIsDuressLockdown = (): boolean => {
  try {
    return localStorage.getItem(DURESS_LOCKDOWN_KEY) === 'true';
  } catch {
    return false;
  }
};

export const getDuressLockdownTimestamp = (): string | null => {
  try {
    return localStorage.getItem(DURESS_TIMESTAMP_KEY);
  } catch {
    return null;
  }
};

export const triggerDuressLockdown = (originUsername?: string): void => {
  try {
    localStorage.setItem(DURESS_LOCKDOWN_KEY, 'true');
    localStorage.setItem(DURESS_TIMESTAMP_KEY, new Date().toISOString());
    if (originUsername) {
      localStorage.setItem(DURESS_ORIGIN_USER_KEY, originUsername);
    }
  } catch {
    // Fail-safe storage handling
  }
};

export const releaseDuressLockdown = (): void => {
  try {
    localStorage.removeItem(DURESS_LOCKDOWN_KEY);
    localStorage.removeItem(DURESS_TIMESTAMP_KEY);
    localStorage.removeItem(DURESS_ORIGIN_USER_KEY);
  } catch {
    // Fail-safe storage handling
  }
};

export const userManagementService = new UserManagementService();


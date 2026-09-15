// jb7572_2026-08-29: Comprehensive Enterprise Security Sanitizer & Threat Prevention Engine
// Protects all system inputs against XSS/Scripts, SQL Injection, Directory Traversal, Command Hijacking, LDAP Injection & Malfeasance.

export interface ThreatDetectionResult {
  isClean: boolean;
  threats: ThreatVector[];
  sanitizedValue: string;
  threatSummary?: string;
}

export interface ThreatVector {
  type: 'XSS_SCRIPT' | 'SQL_INJECTION' | 'PATH_TRAVERSAL' | 'COMMAND_INJECTION' | 'LDAP_INJECTION' | 'CONTROL_CHAR_POISONING' | 'CRLF_INJECTION' | 'UNICODE_HOMOGRAPH';
  severity: 'HIGH' | 'CRITICAL' | 'BLOCKED';
  description: string;
  matchedPattern: string;
}

export interface FieldValidationResult {
  isValid: boolean;
  sanitized: string;
  threatReport: ThreatDetectionResult;
  error?: string;
}

// Canonical Whitelist of permitted Unix Shells in SecureCurtain
export const PERMITTED_SHELLS = [
  '/bin/bash',
  '/bin/zsh',
  '/bin/sh',
  '/usr/bin/fish',
  '/bin/dash',
  '/usr/bin/tmux',
  '/bin/false',
  '/usr/sbin/nologin'
] as const;

// Threat Signature Patterns
const THREAT_SIGNATURES = {
  // 1. Script & HTML / XSS Injection
  XSS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /data\s*:\s*text\/html/gi,
    /on\w+\s*=/gi, // onerror=, onload=, onclick=, onmouseover=
    /document\s*\.\s*(?:cookie|location|write)/gi,
    /window\s*\.\s*(?:location|open|eval)/gi,
    /<img\s+[^>]*onerror/gi
  ],

  // 2. SQL Injection Patterns
  SQLI: [
    /(?:'|%27)\s*(?:OR|AND)\s*(?:'|%27)?(?:1|true|'1')\s*=\s*(?:'|%27)?(?:1|true|'1')/gi,
    /UNION\s+(?:ALL\s+)?SELECT/gi,
    /DROP\s+(?:TABLE|DATABASE|INDEX|VIEW|PROCEDURE)/gi,
    /INSERT\s+INTO\s+.*VALUES/gi,
    /DELETE\s+FROM/gi,
    /UPDATE\s+.*SET/gi,
    /EXEC(?:\s+xp_|\s+sp_)/gi,
    /(?:--|\/\*|\*\/|;)\s*$/m,
    /(?:--|\/\*)/g,
    /;\s*(?:DROP|DELETE|UPDATE|INSERT|SELECT|SHUTDOWN|CREATE)/gi
  ],

  // 3. Path Traversal & Directory Jumping
  PATH_TRAVERSAL: [
    /\.\.[\/\\]/g,            // ../ or ..\
    /%\s*2e\s*%\s*2e[\/\\]/gi, // %2e%2e/
    /%00/g,                   // Null byte
    /\0/g,                    // Raw null byte
    /(?:^|[\/\\])\.\.(?:$|[\/\\])/g
  ],

  // 4. Command Injection / Shell Hijacking
  COMMAND_INJECTION: [
    /[;&|`$]\s*(?:rm|cat|chmod|chown|curl|wget|nc|bash|sh|python|perl|eval|exec)\b/gi,
    /\$\([^)]+\)/g,           // $(command)
    /`[^`]+`/g,               // `command`
    /\|\|\s*/g,               // ||
    /&&\s*/g,                 // &&
    /(?:^|[^\\]);/g,          // Unescaped ;
    />\s*(?:\/etc\/|\/dev\/|\/root|\/home)/gi, // Redirection
    /<\s*(?:\/etc\/|\/dev\/|\/root)/gi
  ],

  // 5. LDAP / AD Injection
  LDAP_INJECTION: [
    /\*\s*\)\s*\(/g,
    /\)\s*\(\s*\|\s*\(/g,
    /\)\s*\(\s*&\s*\(/g,
    /\(objectClass=\*\)/gi,
    /\(uid=\*\)/gi
  ],

  // 6. Control Characters & CRLF
  CONTROL_CHARS: [
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, // Non-printable control characters
    /\r\n|\r|\n/g                         // CRLF for single-line inputs
  ],

  // 7. Invisible / Zero-Width Unicode spoofing (Homograph & Zero-Width attacks)
  UNICODE_SPOOF: [
    /[\u200B-\u200D\uFEFF\u202A-\u202E]/g
  ]
};

export class SecuritySanitizer {
  /**
   * Deep threat inspection across all known attack vectors.
   */
  public static detectThreats(input: string, context: string = 'generic'): ThreatDetectionResult {
    if (!input || typeof input !== 'string') {
      return { isClean: true, threats: [], sanitizedValue: '' };
    }

    const threats: ThreatVector[] = [];

    // Check XSS / Scripts
    for (const pattern of THREAT_SIGNATURES.XSS) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'XSS_SCRIPT',
          severity: 'CRITICAL',
          description: `Executable script, DOM payload, or event handler detected in ${context}.`,
          matchedPattern: match[0]
        });
        break;
      }
    }

    // Check SQL Injection
    for (const pattern of THREAT_SIGNATURES.SQLI) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'SQL_INJECTION',
          severity: 'HIGH',
          description: `SQL Injection token, tautology, or command chaining detected in ${context}.`,
          matchedPattern: match[0]
        });
        break;
      }
    }

    // Check Path Traversal
    for (const pattern of THREAT_SIGNATURES.PATH_TRAVERSAL) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'PATH_TRAVERSAL',
          severity: 'CRITICAL',
          description: `Directory traversal sequence (e.g. '../' or null byte) detected in ${context}.`,
          matchedPattern: match[0]
        });
        break;
      }
    }

    // Check Command Injection
    for (const pattern of THREAT_SIGNATURES.COMMAND_INJECTION) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'COMMAND_INJECTION',
          severity: 'CRITICAL',
          description: `Shell metacharacter or command chaining sequence detected in ${context}.`,
          matchedPattern: match[0]
        });
        break;
      }
    }

    // Check LDAP Injection
    for (const pattern of THREAT_SIGNATURES.LDAP_INJECTION) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'LDAP_INJECTION',
          severity: 'HIGH',
          description: `LDAP filter circumvention or wildcard token detected in ${context}.`,
          matchedPattern: match[0]
        });
        break;
      }
    }

    // Check Control Characters & CRLF
    for (const pattern of THREAT_SIGNATURES.CONTROL_CHARS) {
      const match = input.match(pattern);
      if (match && context !== 'multiline_text') {
        threats.push({
          type: 'CRLF_INJECTION',
          severity: 'HIGH',
          description: `Non-printable ASCII control character or CRLF injection detected.`,
          matchedPattern: '\\x' + (match[0].charCodeAt(0).toString(16).padStart(2, '0'))
        });
        break;
      }
    }

    // Check Zero-Width Spoofing
    for (const pattern of THREAT_SIGNATURES.UNICODE_SPOOF) {
      const match = input.match(pattern);
      if (match) {
        threats.push({
          type: 'UNICODE_HOMOGRAPH',
          severity: 'HIGH',
          description: `Invisible zero-width or directional override unicode character detected.`,
          matchedPattern: 'U+' + match[0].charCodeAt(0).toString(16).toUpperCase()
        });
        break;
      }
    }

    const sanitized = this.sanitizeGenericText(input);

    return {
      isClean: threats.length === 0,
      threats,
      sanitizedValue: sanitized,
      threatSummary: threats.length > 0 ? threats.map(t => t.description).join(' | ') : undefined
    };
  }

  /**
   * Universal HTML entity encoder for safe DOM output.
   */
  public static escapeHtml(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Generic text sanitizer: removes control characters, scripts, and normalizes unicode.
   */
  public static sanitizeGenericText(text: string, allowNewlines: boolean = false): string {
    if (!text || typeof text !== 'string') return '';
    
    // Normalize Unicode (NFC)
    let cleaned = text.normalize('NFC');

    // Strip zero-width characters
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, '');

    // Strip non-printable control characters
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    if (!allowNewlines) {
      cleaned = cleaned.replace(/[\r\n]+/g, ' ');
    }

    // Strip HTML script/iframe tags
    cleaned = cleaned
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    return cleaned.trim();
  }

  /**
   * Domain realm string sanitizer helper.
   */
  public static sanitizeDomainRealm(rawDomain: string): string {
    return this.sanitizeDomainName(rawDomain).sanitized;
  }

  /**
   * POSIX/UNIX Username Sanitizer & Validator.
   * Format: ^[a-z_][a-z0-9_.-]{0,31}$
   * Rejects path traversal, spaces, special injection tokens.
   */
  public static sanitizeUsername(rawUsername: string): FieldValidationResult {
    const threats = this.detectThreats(rawUsername, 'username');
    if (!rawUsername || !rawUsername.trim()) {
      return { isValid: false, sanitized: '', threatReport: threats, error: 'Username cannot be empty.' };
    }

    // Normalize: lowercase, remove illegal characters
    let clean = rawUsername.toLowerCase().trim();
    clean = clean.replace(/[\u200B-\u200D\uFEFF\x00-\x1F\x7F]/g, '');
    clean = clean.replace(/[^a-z0-9_.-]/g, '');

    // Ensure it starts with lowercase letter or underscore
    if (!/^[a-z_]/.test(clean)) {
      clean = '_' + clean;
    }

    // Cap at 32 characters (standard Linux POSIX utmp limit)
    clean = clean.substring(0, 32);

    // Validate standard format
    const isValidFormat = /^[a-z_][a-z0-9_.-]{1,31}$/.test(clean);
    
    // Reserved system names
    const reserved = ['root', 'daemon', 'bin', 'sys', 'sync', 'games', 'man', 'lp', 'mail', 'news', 'uucp', 'proxy', 'www-data', 'backup', 'list', 'irc', 'gnats', 'nobody', 'systemd-network'];
    const isReserved = reserved.includes(clean);

    let error: string | undefined;
    if (!isValidFormat) {
      error = 'Username must be 2-32 characters, start with a letter/underscore, and contain only lowercase alphanumeric, hyphen, or period.';
    } else if (isReserved) {
      error = `Username "${clean}" is a reserved system service account.`;
    } else if (!threats.isClean) {
      error = `Suspicious input detected: ${threats.threats[0]?.description}`;
    }

    return {
      isValid: isValidFormat && !isReserved && threats.isClean,
      sanitized: clean,
      threatReport: threats,
      error
    };
  }

  /**
   * Home Directory / File Path Sanitizer.
   * Completely prevents directory traversal (../, ..\, null bytes) and anchors strictly within permitted root.
   */
  public static sanitizePath(rawPath: string, allowedBase: string = '/home'): FieldValidationResult {
    const threats = this.detectThreats(rawPath, 'file_path');
    if (!rawPath || !rawPath.trim()) {
      return { isValid: false, sanitized: allowedBase, threatReport: threats, error: 'Path cannot be empty.' };
    }

    let clean = rawPath.trim();
    // Normalize slashes
    clean = clean.replace(/\\+/g, '/');

    // Remove null bytes and control chars
    clean = clean.replace(/[\x00-\x1F\x7F\0]|%00/g, '');

    // Eliminate any directory jumping patterns: ../, /../, ..
    clean = clean.replace(/\/\.\.(?=\/|$)/g, '');
    clean = clean.replace(/\.\.\//g, '');
    clean = clean.replace(/\.\./g, '');

    // Normalize multiple consecutive slashes
    clean = clean.replace(/\/+/g, '/');

    // Ensure absolute path starts with /
    if (!clean.startsWith('/')) {
      clean = '/' + clean;
    }

    // Path must begin with allowed base or approved root trees (/home, /mnt, /tmp, /var)
    const allowedRoots = ['/home', '/mnt', '/tmp', '/var/log', '/etc/securecurtain'];
    const isAllowedRoot = allowedRoots.some(root => clean === root || clean.startsWith(root + '/'));

    let error: string | undefined;
    if (!isAllowedRoot) {
      error = `Path must reside within authorized directory trees (${allowedRoots.join(', ')}).`;
    } else if (!threats.isClean) {
      error = `Path traversal or injection threat detected: ${threats.threats[0]?.description}`;
    }

    return {
      isValid: isAllowedRoot && threats.isClean,
      sanitized: clean,
      threatReport: threats,
      error
    };
  }

  /**
   * Linux Shell Path Sanitizer & Whitelist Validator.
   * Validates only allowed secure shell binaries.
   */
  public static sanitizeShell(rawShell: string): FieldValidationResult {
    const threats = this.detectThreats(rawShell, 'shell');
    const clean = this.sanitizeGenericText(rawShell);

    const isPermitted = (PERMITTED_SHELLS as readonly string[]).includes(clean);
    let error: string | undefined;
    if (!isPermitted) {
      error = `Invalid shell binary "${clean}". Permitted shells: ${PERMITTED_SHELLS.join(', ')}`;
    } else if (!threats.isClean) {
      error = `Shell injection token detected: ${threats.threats[0]?.description}`;
    }

    return {
      isValid: isPermitted && threats.isClean,
      sanitized: isPermitted ? clean : '/bin/bash',
      threatReport: threats,
      error
    };
  }

  /**
   * Email Address Sanitizer & RFC 5322 Validator.
   * Prevents CRLF injection and email header hijacking.
   */
  public static sanitizeEmail(rawEmail: string): FieldValidationResult {
    const threats = this.detectThreats(rawEmail, 'email');
    if (!rawEmail || !rawEmail.trim()) {
      return { isValid: false, sanitized: '', threatReport: threats, error: 'Email address cannot be empty.' };
    }

    let clean = rawEmail.trim().toLowerCase();
    // Strip CRLF and whitespace
    clean = clean.replace(/[\r\n\t\s\x00-\x1F\x7F]/g, '');

    // Strict RFC 5322 email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    const isValid = emailRegex.test(clean);

    let error: string | undefined;
    if (!isValid) {
      error = 'Please provide a valid standard email format (e.g. user@domain.com).';
    } else if (!threats.isClean) {
      error = `Threat detected in email: ${threats.threats[0]?.description}`;
    }

    return {
      isValid: isValid && threats.isClean,
      sanitized: clean,
      threatReport: threats,
      error
    };
  }

  /**
   * Elevation / Security PIN Sanitizer.
   * Accepts high-assurance PIN formats (e.g. 4-12 characters, numbers or formatted keys like SC#7572).
   * Strips dangerous shell and SQL injection control characters.
   */
  public static sanitizePin(rawPin: string): FieldValidationResult {
    const threats = this.detectThreats(rawPin, 'security_pin');
    if (!rawPin || !rawPin.trim()) {
      return { isValid: false, sanitized: '', threatReport: threats, error: 'Security PIN cannot be blank.' };
    }

    // Strip whitespaces, control characters, script brackets
    let clean = rawPin.trim();
    clean = clean.replace(/[\r\n\t\x00-\x1F\x7F<>`"';$]/g, '');

    const isValidLength = clean.length >= 4 && clean.length <= 16;
    let error: string | undefined;

    if (!isValidLength) {
      error = 'Security PIN must be between 4 and 16 characters.';
    } else if (!threats.isClean && threats.threats.some(t => t.type !== 'SQL_INJECTION')) {
      error = `Security token rejected: ${threats.threats[0]?.description}`;
    }

    return {
      isValid: isValidLength,
      sanitized: clean,
      threatReport: threats,
      error
    };
  }

  /**
   * Primary PAM Password Sanitizer & Validator.
   * Strips invisible characters, null bytes, and non-printable control codes while safely retaining complex symbols.
   */
  public static sanitizePassword(rawPassword: string): FieldValidationResult {
    const threats = this.detectThreats(rawPassword, 'password');
    if (!rawPassword) {
      return { isValid: false, sanitized: '', threatReport: threats, error: 'Password cannot be empty.' };
    }

    // Strip non-printable control characters and null bytes
    let clean = rawPassword.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\0]/g, '');
    clean = clean.replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, '');

    const isValidLength = clean.length >= 6 && clean.length <= 128;
    let error: string | undefined;

    if (!isValidLength) {
      error = 'Password must be between 6 and 128 characters.';
    }

    return {
      isValid: isValidLength,
      sanitized: clean,
      threatReport: threats,
      error
    };
  }

  /**
   * Domain / Realm / NetBIOS Sanitizer.
   * Rejects LDAP filter injection, control characters, and unapproved symbols.
   */
  public static sanitizeDomainName(rawDomain: string): FieldValidationResult {
    const threats = this.detectThreats(rawDomain, 'domain_realm');
    if (!rawDomain || !rawDomain.trim()) {
      return { isValid: false, sanitized: '', threatReport: threats, error: 'Domain realm cannot be blank.' };
    }

    let clean = rawDomain.trim().toUpperCase();
    clean = clean.replace(/[^A-Z0-9_.-]/g, '');

    const isValidFormat = /^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)*$/.test(clean);
    let error: string | undefined;

    if (!isValidFormat) {
      error = 'Domain realm must be a valid FQDN (e.g. CORP.SECURECURTAIN.NET).';
    } else if (!threats.isClean) {
      error = `Domain injection threat detected: ${threats.threats[0]?.description}`;
    }

    return {
      isValid: isValidFormat && threats.isClean,
      sanitized: clean,
      threatReport: threats,
      error
    };
  }

  /**
   * LDAP / Active Directory OU Path Sanitizer.
   * Strips wildcards and invalid LDAP filter escape sequences.
   */
  public static sanitizeOuPath(rawOu: string): FieldValidationResult {
    const threats = this.detectThreats(rawOu, 'ldap_ou_path');
    if (!rawOu || !rawOu.trim()) {
      return { isValid: false, sanitized: '', threatReport: threats, error: 'OU path cannot be blank.' };
    }

    let clean = rawOu.trim();
    // Strip control characters, quotes, null bytes, wildcards
    clean = clean.replace(/[\x00-\x1F\x7F\0*()\\~]/g, '');

    const isValid = /^(?:(?:OU|DC|CN)=[a-zA-Z0-9_-]+)(?:,(?:OU|DC|CN)=[a-zA-Z0-9_-]+)*$/i.test(clean);
    let error: string | undefined;

    if (!isValid) {
      error = 'Distinguished Name / OU format invalid. Must follow standard LDAP syntax (e.g. OU=Workstations,DC=corp,DC=net).';
    } else if (!threats.isClean) {
      error = `LDAP filter threat detected: ${threats.threats[0]?.description}`;
    }

    return {
      isValid: isValid && threats.isClean,
      sanitized: clean,
      threatReport: threats,
      error
    };
  }

  /**
   * Search Query & Filter Sanitizer.
   * Neutralizes SQL tautologies, comment sequences, and script payloads while preserving alphanumeric search terms.
   */
  public static sanitizeSearchQuery(rawQuery: string): string {
    if (!rawQuery) return '';
    let clean = rawQuery.trim();

    // Strip SQL comment indicators and quote escapes
    clean = clean.replace(/--|\/\*|\*\/|;|'|"|`/g, '');

    // Strip HTML script tokens
    clean = clean.replace(/<[^>]*>/g, '');

    // Strip control characters
    clean = clean.replace(/[\x00-\x1F\x7F]/g, '');

    return clean.substring(0, 100);
  }

  /**
   * Terminal / CLI Command Sanitizer & Sandbox Safety Checker.
   * Inspects command for dangerous system exploits.
   */
  public static sanitizeCliCommand(rawCmd: string): { isSafe: boolean; sanitized: string; warning?: string } {
    if (!rawCmd) return { isSafe: true, sanitized: '' };

    let clean = rawCmd.trim();
    // Strip null bytes and control chars
    clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Detect dangerous destructive commands
    const dangerousPatterns = [
      /rm\s+-rf\s+(?:\/|\/\*|~|\/etc|\/boot|\/dev)/i,
      />\s*\/dev\/sd[a-z]/i,
      /mkfs\.\w+\s+\/dev\//i,
      /:(){ :|:& };:/, // Fork bomb
      /dd\s+if=\/dev\/zero\s+of=\/dev\/sd/i,
      /chmod\s+-R\s+777\s+\//i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(clean)) {
        return {
          isSafe: false,
          sanitized: clean,
          warning: `CRITICAL MALFEASANCE BLOCKED: Dangerous bare-metal destruction pattern detected.`
        };
      }
    }

    return {
      isSafe: true,
      sanitized: clean
    };
  }
}

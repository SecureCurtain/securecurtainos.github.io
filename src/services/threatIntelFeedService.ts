// jb7572_2026-09-02: STIX 2.1 & TAXII 2.1 Threat Intelligence Feed Generator & Serializer
import { DetectedThreatObject, QuarantinedObject, ThreatSeverity, ThreatVector } from '../types';

export interface StixExternalReference {
  source_name: string;
  external_id?: string;
  url?: string;
  description?: string;
}

export interface StixKillChainPhase {
  kill_chain_name: string;
  phase_name: string;
}

export interface StixBaseObject {
  type: string;
  spec_version: '2.1';
  id: string;
  created: string;
  modified: string;
  created_by_ref?: string;
  labels?: string[];
  external_references?: StixExternalReference[];
}

export interface StixIdentity extends StixBaseObject {
  type: 'identity';
  name: string;
  identity_class: string;
  sectors?: string[];
  contact_information?: string;
}

export interface StixIndicator extends StixBaseObject {
  type: 'indicator';
  name: string;
  description: string;
  indicator_types: string[];
  pattern: string;
  pattern_type: 'stix' | 'yara';
  pattern_version?: string;
  valid_from: string;
  confidence: number;
}

export interface StixMalware extends StixBaseObject {
  type: 'malware';
  name: string;
  description: string;
  malware_types: string[];
  is_family: boolean;
  kill_chain_phases?: StixKillChainPhase[];
  capabilities?: string[];
}

export interface StixAttackPattern extends StixBaseObject {
  type: 'attack-pattern';
  name: string;
  description: string;
  aliases?: string[];
}

export interface StixCourseOfAction extends StixBaseObject {
  type: 'course-of-action';
  name: string;
  description: string;
  action_type?: string;
}

export interface StixRelationship extends StixBaseObject {
  type: 'relationship';
  relationship_type: 'indicates' | 'mitigates' | 'uses' | 'variant-of' | 'targets';
  source_ref: string;
  target_ref: string;
}

export interface StixBundle {
  type: 'bundle';
  id: string;
  spec_version: '2.1';
  objects: (StixIdentity | StixIndicator | StixMalware | StixAttackPattern | StixCourseOfAction | StixRelationship)[];
}

export interface TaxiiCollectionManifest {
  id: string;
  title: string;
  description: string;
  can_read: boolean;
  can_write: boolean;
  media_types: string[];
}

export interface TaxiiEnvelope {
  more: boolean;
  objects: any[];
  next?: string | null;
  taxii_version: '2.1';
  collection_id: string;
  generated_at: string;
}

// Deterministic UUID-like generator for STIX identifiers
function generateStixId(prefix: string, seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const part2 = Math.abs((hash ^ 0x5a5a5a5a) & 0xffff).toString(16).padStart(4, '0');
  const part3 = '4' + Math.abs((hash >> 16) & 0x0fff).toString(16).padStart(3, '0');
  const part4 = '8' + Math.abs((hash >> 20) & 0x0fff).toString(16).padStart(3, '0');
  const part5 = (Math.abs(hash * 31) >>> 0).toString(16).padStart(12, '0').slice(0, 12);
  return `${prefix}--${hex}-${part2}-${part3}-${part4}-${part5}`;
}

const IDENTITY_ID = 'identity--838bcfa3-a734-41e0-8591-de4b984d4d7d';

const IDENTITY_OBJECT: StixIdentity = {
  type: 'identity',
  spec_version: '2.1',
  id: IDENTITY_ID,
  created: '2026-09-01T00:00:00.000Z',
  modified: '2026-09-02T12:00:00.000Z',
  name: 'SecureCurtain Host Intrusion Prevention System (HIPS)',
  identity_class: 'system',
  sectors: ['defense', 'technology', 'financial-services', 'critical-infrastructure'],
  contact_information: 'soc-incident-response@securecurtain.io'
};

const MITRE_MAPPINGS: Record<ThreatVector, { id: string; name: string; url: string; phase: string; malwareTypes: string[] }> = {
  'MEMORY_INJECTION': {
    id: 'T1055',
    name: 'Process Injection (Reflective DLL / Shellcode)',
    url: 'https://attack.mitre.org/techniques/T1055/',
    phase: 'defense-evasion',
    malwareTypes: ['trojan', 'backdoor']
  },
  'BYOVD_KERNEL_EXPLOIT': {
    id: 'T1068',
    name: 'Exploitation for Privilege Escalation (BYOVD Driver)',
    url: 'https://attack.mitre.org/techniques/T1068/',
    phase: 'privilege-escalation',
    malwareTypes: ['rootkit', 'exploit']
  },
  'RANSOMWARE_ENCRYPTION': {
    id: 'T1486',
    name: 'Data Encrypted for Impact',
    url: 'https://attack.mitre.org/techniques/T1486/',
    phase: 'impact',
    malwareTypes: ['ransomware']
  },
  'UNAUTHORIZED_RING0_HOOK': {
    id: 'T1014',
    name: 'Rootkit (Syscall Table / Ring-0 Hooking)',
    url: 'https://attack.mitre.org/techniques/T1014/',
    phase: 'defense-evasion',
    malwareTypes: ['rootkit', 'bootkit']
  },
  'TROJAN_BACKDOOR': {
    id: 'T1059.001',
    name: 'Command and Scripting Interpreter: PowerShell',
    url: 'https://attack.mitre.org/techniques/T1059/001/',
    phase: 'execution',
    malwareTypes: ['trojan', 'dropper']
  },
  'CRYPTO_MINER': {
    id: 'T1496',
    name: 'Resource Hijacking (Cryptojacking)',
    url: 'https://attack.mitre.org/techniques/T1496/',
    phase: 'impact',
    malwareTypes: ['miner']
  },
  'PROCESS_HOLLOWING': {
    id: 'T1055.012',
    name: 'Process Hollowing',
    url: 'https://attack.mitre.org/techniques/T1055/012/',
    phase: 'defense-evasion',
    malwareTypes: ['trojan', 'backdoor']
  },
  'MACRO_DROPPER': {
    id: 'T1566.001',
    name: 'Phishing: Spearphishing Attachment (VBA Macro)',
    url: 'https://attack.mitre.org/techniques/T1566/001/',
    phase: 'initial-access',
    malwareTypes: ['dropper']
  },
  'LATERAL_MOVEMENT': {
    id: 'T1021.002',
    name: 'Remote Services: SMB/Windows Admin Shares',
    url: 'https://attack.mitre.org/techniques/T1021/002/',
    phase: 'lateral-movement',
    malwareTypes: ['worm', 'tool']
  }
};

class ThreatIntelFeedService {
  /**
   * Generates an OASIS STIX 2.1 Bundle containing Identities, Indicators, Malware,
   * Attack Patterns, Courses of Action, and SRO Relationships.
   */
  public generateStix21Bundle(
    threats: DetectedThreatObject[],
    quarantinedList: QuarantinedObject[] = []
  ): StixBundle {
    const nowIso = new Date().toISOString();
    const bundleId = generateStixId('bundle', `bundle-${Date.now()}-${threats.length}`);
    const objects: (StixIdentity | StixIndicator | StixMalware | StixAttackPattern | StixCourseOfAction | StixRelationship)[] = [
      IDENTITY_OBJECT
    ];

    const attackPatternsMap = new Map<string, StixAttackPattern>();

    threats.forEach(threat => {
      const quar = quarantinedList.find(q => q.threatId === threat.id || q.id === threat.quarantinedVaultId);
      const mitre = MITRE_MAPPINGS[threat.vector] || {
        id: 'T1204',
        name: 'User Execution',
        url: 'https://attack.mitre.org/techniques/T1204/',
        phase: 'execution',
        malwareTypes: ['malicious-software']
      };

      // 1. Attack Pattern (MITRE ATT&CK)
      if (!attackPatternsMap.has(mitre.id)) {
        const apObj: StixAttackPattern = {
          type: 'attack-pattern',
          spec_version: '2.1',
          id: generateStixId('attack-pattern', mitre.id),
          created: '2026-09-01T00:00:00.000Z',
          modified: nowIso,
          created_by_ref: IDENTITY_ID,
          name: mitre.name,
          description: `MITRE ATT&CK Technique ${mitre.id}: ${mitre.name}. Detected and mitigated by SecureCurtain HIPS Sentinel.`,
          external_references: [
            {
              source_name: 'mitre-attack',
              external_id: mitre.id,
              url: mitre.url,
              description: `MITRE ATT&CK description for ${mitre.name}`
            }
          ]
        };
        attackPatternsMap.set(mitre.id, apObj);
        objects.push(apObj);
      }
      const apRef = attackPatternsMap.get(mitre.id)!;

      // 2. Malware Object
      const malwareId = generateStixId('malware', threat.id);
      const malwareObj: StixMalware = {
        type: 'malware',
        spec_version: '2.1',
        id: malwareId,
        created: new Date(threat.detectedAt).toISOString().replace(' ', 'T') + 'Z',
        modified: nowIso,
        created_by_ref: IDENTITY_ID,
        name: threat.name,
        description: threat.description,
        malware_types: mitre.malwareTypes,
        is_family: false,
        labels: [threat.severity.toLowerCase(), threat.vector.toLowerCase().replace(/_/g, '-')],
        kill_chain_phases: [
          {
            kill_chain_name: 'mitre-attack',
            phase_name: mitre.phase
          }
        ],
        external_references: [
          {
            source_name: 'SecureCurtain-HIPS',
            external_id: threat.id,
            description: `Engine: ${threat.engine} | Action: ${threat.currentAction}`
          }
        ]
      };
      objects.push(malwareObj);

      // 3. File Hash Indicator
      const fileIndicatorId = generateStixId('indicator', `file-hash-${threat.sha256}`);
      const fileIndicator: StixIndicator = {
        type: 'indicator',
        spec_version: '2.1',
        id: fileIndicatorId,
        created: nowIso,
        modified: nowIso,
        created_by_ref: IDENTITY_ID,
        name: `Malicious File Hash (SHA-256): ${threat.name}`,
        description: `Cryptographic SHA-256 fingerprint associated with ${threat.name} at path ${threat.targetPath}`,
        indicator_types: ['malicious-activity', 'anomalous-activity'],
        pattern: `[file:hashes.'SHA-256' = '${threat.sha256}']`,
        pattern_type: 'stix',
        valid_from: new Date(threat.detectedAt).toISOString().replace(' ', 'T') + 'Z',
        confidence: threat.severity === 'CRITICAL' ? 100 : threat.severity === 'HIGH' ? 85 : 70
      };
      objects.push(fileIndicator);

      // Relationship: Indicator indicates Malware
      objects.push({
        type: 'relationship',
        spec_version: '2.1',
        id: generateStixId('relationship', `${fileIndicatorId}-${malwareId}`),
        created: nowIso,
        modified: nowIso,
        created_by_ref: IDENTITY_ID,
        relationship_type: 'indicates',
        source_ref: fileIndicatorId,
        target_ref: malwareId
      });

      // Relationship: Malware uses Attack Pattern
      objects.push({
        type: 'relationship',
        spec_version: '2.1',
        id: generateStixId('relationship', `${malwareId}-${apRef.id}`),
        created: nowIso,
        modified: nowIso,
        created_by_ref: IDENTITY_ID,
        relationship_type: 'uses',
        source_ref: malwareId,
        target_ref: apRef.id
      });

      // 4. Extracted Network / C2 Indicators if available in quarantine analysis
      if (quar && quar.decompiledCode && quar.decompiledCode.extracted_strings) {
        quar.decompiledCode.extracted_strings.forEach((strObj, strIdx) => {
          if (strObj.type === 'C2_IP' || strObj.type === 'URL') {
            const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(strObj.stringVal);
            const netPattern = isIp 
              ? `[ipv4-addr:value = '${strObj.stringVal.split(':')[0]}']`
              : `[url:value = '${strObj.stringVal}']`;

            const netIndId = generateStixId('indicator', `net-${threat.id}-${strIdx}-${strObj.stringVal}`);
            const netInd: StixIndicator = {
              type: 'indicator',
              spec_version: '2.1',
              id: netIndId,
              created: nowIso,
              modified: nowIso,
              created_by_ref: IDENTITY_ID,
              name: `C2 Network Beacon: ${strObj.stringVal}`,
              description: `Observed malicious callback destination extracted during reverse-engineering analysis of ${threat.name}`,
              indicator_types: ['malicious-activity'],
              pattern: netPattern,
              pattern_type: 'stix',
              valid_from: nowIso,
              confidence: 95
            };
            objects.push(netInd);

            objects.push({
              type: 'relationship',
              spec_version: '2.1',
              id: generateStixId('relationship', `${netIndId}-${malwareId}`),
              created: nowIso,
              modified: nowIso,
              created_by_ref: IDENTITY_ID,
              relationship_type: 'indicates',
              source_ref: netIndId,
              target_ref: malwareId
            });
          }
        });

        // 5. YARA Rule Indicator
        if (quar.decompiledCode.yara_rule_generated) {
          const yaraIndId = generateStixId('indicator', `yara-${threat.id}`);
          const yaraInd: StixIndicator = {
            type: 'indicator',
            spec_version: '2.1',
            id: yaraIndId,
            created: nowIso,
            modified: nowIso,
            created_by_ref: IDENTITY_ID,
            name: `YARA Signature: ${threat.name}`,
            description: `Automated byte pattern rule compiled by SecureCurtain Sandbox for detecting ${threat.name}`,
            indicator_types: ['malicious-activity'],
            pattern: quar.decompiledCode.yara_rule_generated,
            pattern_type: 'yara',
            valid_from: nowIso,
            confidence: 90
          };
          objects.push(yaraInd);

          objects.push({
            type: 'relationship',
            spec_version: '2.1',
            id: generateStixId('relationship', `${yaraIndId}-${malwareId}`),
            created: nowIso,
            modified: nowIso,
            created_by_ref: IDENTITY_ID,
            relationship_type: 'indicates',
            source_ref: yaraIndId,
            target_ref: malwareId
          });
        }
      }

      // 6. Course of Action (Mitigation)
      const coaId = generateStixId('course-of-action', `coa-${threat.id}`);
      const coaObj: StixCourseOfAction = {
        type: 'course-of-action',
        spec_version: '2.1',
        id: coaId,
        created: nowIso,
        modified: nowIso,
        created_by_ref: IDENTITY_ID,
        name: `HIPS Enforcement: ${threat.currentAction}`,
        description: `SecureCurtain applied defensive mitigation "${threat.currentAction}" against threat vector "${threat.vector}". Recommended ongoing action: ${threat.suggestedAction}.`
      };
      objects.push(coaObj);

      objects.push({
        type: 'relationship',
        spec_version: '2.1',
        id: generateStixId('relationship', `${coaId}-${malwareId}`),
        created: nowIso,
        modified: nowIso,
        created_by_ref: IDENTITY_ID,
        relationship_type: 'mitigates',
        source_ref: coaId,
        target_ref: malwareId
      });
    });

    return {
      type: 'bundle',
      id: bundleId,
      spec_version: '2.1',
      objects
    };
  }

  /**
   * Generates a TAXII 2.1 Envelope response wrapping the STIX 2.1 threat objects.
   */
  public generateTaxiiEnvelope(
    threats: DetectedThreatObject[],
    quarantinedList: QuarantinedObject[] = []
  ): TaxiiEnvelope {
    const bundle = this.generateStix21Bundle(threats, quarantinedList);
    return {
      more: false,
      next: null,
      taxii_version: '2.1',
      collection_id: '91a7b52c-2301-447e-8557-0a424e0f4f9d',
      generated_at: new Date().toISOString(),
      objects: bundle.objects
    };
  }

  /**
   * Returns TAXII 2.1 Collection Metadata
   */
  public getTaxiiCollectionInfo(): TaxiiCollectionManifest {
    return {
      id: '91a7b52c-2301-447e-8557-0a424e0f4f9d',
      title: 'SecureCurtain HIPS Threat Intelligence Feed',
      description: 'Production feed of high-fidelity indicators of compromise (IOCs), BYOVD driver exploits, in-memory stagers, and ransomware signatures captured by Host Intrusion Prevention System.',
      can_read: true,
      can_write: false,
      media_types: ['application/stix+json;version=2.1', 'application/vnd.oasis.taxii+json;version=2.1']
    };
  }

  /**
   * Generates standard RFC 4180 CSV export for SIEM ingestion (Splunk, Elastic, Sentinel).
   */
  public generateIocCsv(threats: DetectedThreatObject[]): string {
    const headers = [
      'IOC_TYPE',
      'IOC_VALUE',
      'THREAT_NAME',
      'SEVERITY',
      'VECTOR',
      'MITRE_ATTACK_ID',
      'DETECTION_ENGINE',
      'ENFORCEMENT_ACTION',
      'TARGET_PATH',
      'FIRST_DETECTED'
    ];

    const rows: string[] = [headers.join(',')];

    threats.forEach(t => {
      const mitre = MITRE_MAPPINGS[t.vector]?.id || 'T1204';
      // Hash row
      rows.push([
        'SHA256',
        `"${t.sha256}"`,
        `"${t.name}"`,
        t.severity,
        t.vector,
        mitre,
        t.engine,
        t.currentAction,
        `"${t.targetPath}"`,
        `"${t.detectedAt}"`
      ].join(','));
    });

    return rows.join('\n');
  }

  /**
   * Generates MISP (Malware Information Sharing Platform) standard Event JSON.
   */
  public generateMispEvent(
    threats: DetectedThreatObject[],
    quarantinedList: QuarantinedObject[] = []
  ): object {
    const attributes: any[] = [];

    threats.forEach((t, idx) => {
      const mitre = MITRE_MAPPINGS[t.vector]?.id || 'T1204';
      attributes.push({
        id: `attr_${idx + 1}_sha256`,
        type: 'sha256',
        category: 'Payload delivery',
        value: t.sha256,
        comment: `SHA256 hash for ${t.name} (${t.vector})`,
        to_ids: true,
        distribution: '5'
      });

      attributes.push({
        id: `attr_${idx + 1}_filename`,
        type: 'filename',
        category: 'Artifacts dropped',
        value: t.targetPath,
        comment: `Target path for ${t.name}`,
        to_ids: false
      });

      const quar = quarantinedList.find(q => q.threatId === t.id);
      if (quar && quar.decompiledCode && quar.decompiledCode.extracted_strings) {
        quar.decompiledCode.extracted_strings.forEach((s, sIdx) => {
          if (s.type === 'C2_IP') {
            attributes.push({
              id: `attr_${idx + 1}_c2_${sIdx}`,
              type: 'ip-dst',
              category: 'Network activity',
              value: s.stringVal,
              comment: `C2 beacon destination from reverse-engineered sample`,
              to_ids: true
            });
          }
        });
      }
    });

    return {
      Event: {
        id: '7572',
        uuid: '838bcfa3-a734-41e0-8591-de4b984d4d7d',
        info: 'SecureCurtain HIPS Sentinel Threat Intelligence Package',
        threat_level_id: '1', // High
        analysis: '2', // Completed
        date: new Date().toISOString().slice(0, 10),
        published: true,
        Attribute: attributes,
        Tag: [
          { name: 'tlp:amber+strict' },
          { name: 'misp-galaxy:mitre-attack' },
          { name: 'securecurtain:hips-detection-feed' }
        ]
      }
    };
  }

  /**
   * Browser file download utility
   */
  public downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const threatIntelFeedService = new ThreatIntelFeedService();

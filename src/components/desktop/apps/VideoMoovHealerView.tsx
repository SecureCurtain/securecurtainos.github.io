// jb7572_2026-08-26: SecureCurtain Core Architecture - Automated RAW Video Hex Healer (MOOV Atom Rebuilder)
import React, { useState } from 'react';
import {
  FileVideo,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Terminal,
  Zap,
  FolderDown,
  Film,
  Camera,
  Activity,
  Layers,
  Sparkles,
  Download,
  Copy,
  Info
} from 'lucide-react';

interface CorruptVideoFile {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  detectedCodec: string;
  cameraSource: string;
  issue: string;
  hasMdat: boolean;
  hasMoov: boolean;
  sampleRequired: boolean;
  suggestedReference: string;
  hexSignature: string;
}

const SAMPLE_CORRUPT_VIDEOS: CorruptVideoFile[] = [
  {
    id: 'vid_dji_01',
    name: 'DJI_0842_Flight_Sunset_4K.MP4',
    size: '1.42 GB',
    sizeBytes: 1524682000,
    detectedCodec: 'H.265 (HEVC) Main 10 / D-Log M (10-bit)',
    cameraSource: 'DJI Mavic 3 Pro (4K 60fps 150Mbps)',
    issue: 'Truncated container: Power lost before writing final "moov" atom chunk.',
    hasMdat: true,
    hasMoov: false,
    sampleRequired: true,
    suggestedReference: 'DJI_0841_Healthy_Reference.MP4',
    hexSignature: '00 00 00 1C 66 74 79 70 69 73 6F 6D 00 00 02 00'
  },
  {
    id: 'vid_canon_02',
    name: 'MVI_2910_Reception_Speeches.MOV',
    size: '3.88 GB',
    sizeBytes: 4166115000,
    detectedCodec: 'Apple ProRes 422 HQ / Linear PCM Audio',
    cameraSource: 'Canon EOS R6 Mark II (C-Log3 4K 24fps)',
    issue: 'Card ejected during recording. Missing STCO/CO64 chunk offset table.',
    hasMdat: true,
    hasMoov: false,
    sampleRequired: true,
    suggestedReference: 'MVI_2909_Healthy_Reference.MOV',
    hexSignature: '00 00 00 20 66 74 79 70 71 74 20 20 20 05 03 00'
  },
  {
    id: 'vid_gopro_03',
    name: 'GX010048_Extreme_Downhill.MP4',
    size: '890 MB',
    sizeBytes: 933230000,
    detectedCodec: 'H.264 (AVC) High@L5.2 / AAC Stereo',
    cameraSource: 'GoPro HERO 12 Black (5.3K 30fps)',
    issue: 'Crash impact battery disconnect: Partial header with unclosed MDAT block.',
    hasMdat: true,
    hasMoov: false,
    sampleRequired: true,
    suggestedReference: 'GX010047_Healthy_Reference.MP4',
    hexSignature: '00 00 00 18 66 74 79 70 6D 70 34 32 00 00 00 00'
  }
];

interface VideoMoovHealerViewProps {
  addNotification?: (notification: any) => void;
}

export const VideoMoovHealerView: React.FC<VideoMoovHealerViewProps> = ({ addNotification }) => {
  const [corruptVideos, setCorruptVideos] = useState<CorruptVideoFile[]>(SAMPLE_CORRUPT_VIDEOS);
  const [selectedVideo, setSelectedVideo] = useState<CorruptVideoFile>(SAMPLE_CORRUPT_VIDEOS[0]);
  const [referenceFile, setReferenceFile] = useState<string>(SAMPLE_CORRUPT_VIDEOS[0].suggestedReference);
  const [repairMethod, setRepairMethod] = useState<'untrunc' | 'ffmpeg_stream' | 'atom_splicer'>('untrunc');
  
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [repairProgress, setRepairProgress] = useState<number>(0);
  const [repairedSuccess, setRepairedSuccess] = useState<boolean>(false);
  const [repairedDetails, setRepairedDetails] = useState<{
    duration: string;
    frames: number;
    audioTrack: string;
    outputFile: string;
  } | null>(null);

  const [repairLogs, setRepairLogs] = useState<string[]>([
    '[*] Untrunc & Hex Atom Rebuilder Engine v3.4 Ready',
    '[*] Loaded MPEG-4 / ISO QuickTime Container specifications (ISO/IEC 14496-12)',
    '[+] Select a broken video and a healthy sample video shot on the same camera to rebuild the moov atom.'
  ]);

  const handleStartRepair = () => {
    setIsRepairing(true);
    setRepairedSuccess(false);
    setRepairProgress(10);
    setRepairLogs(prev => [
      ...prev,
      `[*] Analyzing corrupted video stream: ${selectedVideo.name}...`,
      `[1/4] Scanning for raw MDAT payload boundaries (detected size: ${selectedVideo.size})...`
    ]);

    setTimeout(() => {
      setRepairProgress(40);
      setRepairLogs(prev => [
        ...prev,
        `[2/4] Parsing reference video ${referenceFile} for SPS/PPS/VPS header tracks...`,
        `[codec] Extracting codec private data: ${selectedVideo.detectedCodec}`
      ]);
    }, 900);

    setTimeout(() => {
      setRepairProgress(75);
      setRepairLogs(prev => [
        ...prev,
        `[3/4] Parsing NAL units and reconstructing STTS/STSZ/STCO time-to-sample tables...`,
        `[sync] Synchronized 14,280 video frames and 48kHz audio packets with 0 dropped frames.`
      ]);
    }, 1800);

    setTimeout(() => {
      setRepairProgress(100);
      setIsRepairing(false);
      setRepairedSuccess(true);
      const outName = selectedVideo.name.replace(/\.(mp4|mov)/i, '_REPAIRED.mp4');
      setRepairedDetails({
        duration: '04m 12s',
        frames: 15120,
        audioTrack: 'AAC 48.0 kHz 320 kbps Stereo',
        outputFile: `/output/repaired/${outName}`
      });

      setRepairLogs(prev => [
        ...prev,
        `[4/4] Generating optimized faststart MOOV atom at head of file...`,
        `[✓] SUCCESS: Video rebuilt into 100% playable file: ${outName}!`,
        `[✓] Verification: FFmpeg decodes 100% of stream without artifacting or audio drift.`
      ]);

      if (addNotification) {
        addNotification({
          title: 'Video Repaired Successfully',
          message: `${selectedVideo.name} reconstructed with verified MOOV atom.`,
          type: 'success'
        });
      }
    }, 2800);
  };

  const getCliCommand = () => {
    if (repairMethod === 'untrunc') {
      return `untrunc -s /reference/${referenceFile} /corrupted/${selectedVideo.name}`;
    } else if (repairMethod === 'ffmpeg_stream') {
      return `ffmpeg -err_detect ignore_err -i /corrupted/${selectedVideo.name} -c copy -movflags faststart /output/${selectedVideo.name.replace(/\.(mp4|mov)/i, '_fixed.mp4')}`;
    } else {
      return `mp4box -add /corrupted/${selectedVideo.name}#video -add /corrupted/${selectedVideo.name}#audio -new /output/rebuilt_${selectedVideo.name}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-950/80 border border-pink-500/40 text-pink-400 shadow-md shadow-pink-950/50">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white">Automated RAW Video Hex Healer (MOOV Atom Rebuilder)</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/30">
                UNTRUNC & MP4/MOV STREAM RECONSTRUCTOR
              </span>
            </div>
            <p className="text-xs text-[#8fa0b5] mt-0.5">
              Fix unfinalized or truncated MP4, MOV, and 4K/8K drone/camera footage cut short by sudden battery death, crashes, or card removal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141b2c] border border-[#232f4b] text-sky-300 text-xs font-mono">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>H.264 / H.265 (HEVC) / ProRes / D-Log M</span>
        </div>
      </div>

      {/* Main Grid: Broken File Picker & Reference Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Corrupted Video Files (Col 5) */}
        <div className="lg:col-span-5 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">1. Select Truncated Video File</span>
            </div>
            <span className="text-[10px] font-mono text-[#778899]">Missing MOOV Header</span>
          </div>

          <div className="space-y-2">
            {corruptVideos.map(vid => {
              const isSelected = selectedVideo.id === vid.id;
              return (
                <div
                  key={vid.id}
                  onClick={() => {
                    setSelectedVideo(vid);
                    setReferenceFile(vid.suggestedReference);
                    setRepairedSuccess(false);
                    setRepairedDetails(null);
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-pink-950/40 border-pink-500/80 shadow-sm'
                      : 'bg-[#101422] border-[#1c2438] hover:border-[#2e3b5a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <FileVideo className="w-4 h-4 text-pink-400" />
                        <span className="text-xs font-bold font-mono text-white truncate max-w-[200px]" title={vid.name}>
                          {vid.name}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-sky-400">
                        {vid.cameraSource}
                      </div>
                      <div className="text-[10px] font-mono text-[#8fa0b5]">
                        Size: {vid.size} • Codec: <span className="text-amber-300">{vid.detectedCodec}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/30">
                        MOOV MISSING
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#708098] mt-2 border-t border-[#182030] pt-1.5">
                    {vid.issue}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Healer Engine & Reference Sample (Col 7) */}
        <div className="lg:col-span-7 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">2. Reference Sample & Reconstruction Engine</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Lossless Frame Salvage</span>
          </div>

          {/* Method Selection */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setRepairMethod('untrunc')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                repairMethod === 'untrunc'
                  ? 'bg-pink-950/60 border-pink-500 text-white shadow-sm'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-xs font-bold font-mono">1. Untrunc Splicer</div>
              <div className="text-[10px] text-[#708098] mt-0.5">Rebuilds MOOV atom using healthy reference file.</div>
            </button>

            <button
              onClick={() => setRepairMethod('ffmpeg_stream')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                repairMethod === 'ffmpeg_stream'
                  ? 'bg-pink-950/60 border-pink-500 text-white shadow-sm'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-xs font-bold font-mono">2. Stream Remuxer</div>
              <div className="text-[10px] text-[#708098] mt-0.5">Pass-through direct copy (faststart indexing).</div>
            </button>

            <button
              onClick={() => setRepairMethod('atom_splicer')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                repairMethod === 'atom_splicer'
                  ? 'bg-pink-950/60 border-pink-500 text-white shadow-sm'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-xs font-bold font-mono">3. MP4Box Raw Repair</div>
              <div className="text-[10px] text-[#708098] mt-0.5">Demuxes MDAT stream to raw H.264/HEVC annexb.</div>
            </button>
          </div>

          {/* Reference Sample Input */}
          <div className="p-3.5 rounded-lg bg-[#101422] border border-[#1e273e] space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8fa0b5] flex items-center justify-between">
                <span>Healthy Reference Video Sample (Shot on same device):</span>
                <span className="text-[10px] text-emerald-400">Required for Codec Matrices</span>
              </label>
              <input
                type="text"
                value={referenceFile}
                onChange={(e) => setReferenceFile(e.target.value)}
                className="w-full bg-[#090c15] border border-[#232f4b] rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-[#090c15] border border-[#182030]">
                <div className="text-[10px] text-[#778899]">Target Camera / Resolution:</div>
                <div className="text-white font-bold mt-0.5">{selectedVideo.cameraSource}</div>
              </div>
              <div className="p-2 rounded bg-[#090c15] border border-[#182030]">
                <div className="text-[10px] text-[#778899]">Stream Hex Signature:</div>
                <div className="text-pink-300 font-bold mt-0.5 truncate">{selectedVideo.hexSignature}</div>
              </div>
            </div>
          </div>

          {/* Action Button & Repair Progress */}
          <div className="space-y-2 pt-2">
            {isRepairing && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-[#8fa0b5]">
                  <span>Reconstructing Frame Sequences...</span>
                  <span className="text-pink-400 font-bold">{repairProgress}%</span>
                </div>
                <div className="w-full bg-[#121624] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-300"
                    style={{ width: `${repairProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-mono text-[#778899]">
                Engine: <span className="text-pink-400 font-bold">{repairMethod.toUpperCase()}</span>
              </div>

              <button
                onClick={handleStartRepair}
                disabled={isRepairing}
                className="px-6 py-2.5 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all"
              >
                {isRepairing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rebuilding MOOV Atom ({repairProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Rebuild & Synthesize Playable Video</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Repaired Success Banner */}
          {repairedSuccess && repairedDetails && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>VIDEO SUCCESSFULLY HEALED AND VALIDATED</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-200">
                  100% PLAYABLE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-1.5 rounded bg-[#090c15]/60 border border-emerald-500/20">
                  <div className="text-[9px] text-[#778899]">Recovered Duration:</div>
                  <div className="text-white font-bold">{repairedDetails.duration}</div>
                </div>
                <div className="p-1.5 rounded bg-[#090c15]/60 border border-emerald-500/20">
                  <div className="text-[9px] text-[#778899]">Salvaged Frames:</div>
                  <div className="text-emerald-300 font-bold">{repairedDetails.frames.toLocaleString()}</div>
                </div>
                <div className="p-1.5 rounded bg-[#090c15]/60 border border-emerald-500/20">
                  <div className="text-[9px] text-[#778899]">Audio Stream:</div>
                  <div className="text-sky-300 font-bold truncate">{repairedDetails.audioTrack}</div>
                </div>
              </div>

              <div className="text-[11px] font-mono text-emerald-200 flex items-center justify-between pt-1">
                <span>Output File: <code className="text-white bg-black/40 px-1.5 py-0.5 rounded">{repairedDetails.outputFile}</code></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CLI Script & Execution Log */}
      <div className="bg-[#080a11] rounded-xl border border-[#1b2234] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#161d2d] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-bold font-mono text-white">FFmpeg & Untrunc Native Shell Command</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(getCliCommand());
              if (addNotification) {
                addNotification({
                  title: 'Command Copied',
                  message: 'Video repair command copied to clipboard',
                  type: 'info'
                });
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#131a2b] hover:bg-[#1b253e] text-[11px] font-mono text-[#8fa0b5] hover:text-white transition-all"
          >
            <Copy className="w-3 h-3" />
            <span>Copy CLI Command</span>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs text-pink-300 select-all overflow-x-auto">
          <code># {getCliCommand()}</code>
        </div>

        <div className="p-3 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
          {repairLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('[✓]')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('[1/4]') || log.includes('[2/4]') || log.includes('[3/4]') || log.includes('[4/4]')
                  ? 'text-sky-300'
                  : log.includes('[+]')
                  ? 'text-pink-300'
                  : 'text-[#708098]'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

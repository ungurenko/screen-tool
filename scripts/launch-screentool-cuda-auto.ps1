param(
	[string]$AppPath,
	[string]$CudaScriptPath,
	[switch]$CloseExisting,
	[switch]$NoDiagnostics,
	[switch]$AllowCudaAudio
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

if (-not $AppPath) {
	$packagedAppPath = Join-Path $repoRoot "release\win-unpacked\ScreenTool.exe"
	$installedAppPath = Join-Path $env:LOCALAPPDATA "Programs\screentool\ScreenTool.exe"
	if (Test-Path $packagedAppPath) {
		$AppPath = $packagedAppPath
	} elseif (Test-Path $installedAppPath) {
		$AppPath = $installedAppPath
	} else {
		throw "ScreenTool.exe was not found. Build the Windows package first or pass -AppPath."
	}
}

if (-not $CudaScriptPath) {
	$CudaScriptPath = Join-Path $repoRoot "electron\native\nvidia-cuda-compositor\run-mp4-pipeline.mjs"
}

if (-not (Test-Path $AppPath)) {
	throw "ScreenTool app not found: $AppPath"
}

if (-not (Test-Path $CudaScriptPath)) {
	throw "NVIDIA CUDA/NVENC wrapper script not found: $CudaScriptPath"
}

$existingScreenTool = @(Get-Process -Name "ScreenTool" -ErrorAction SilentlyContinue)
if ($existingScreenTool.Count -gt 0) {
	if (-not $CloseExisting) {
		Write-Host "ScreenTool is already running. Close it first, or rerun with -CloseExisting so the CUDA env is inherited by the new app process."
		$existingScreenTool | Select-Object Id, ProcessName, Path | Format-Table -AutoSize
		exit 2
	}

	$existingScreenTool | Stop-Process -Force
	Start-Sleep -Milliseconds 500
}

$env:SCREENTOOL_EXPERIMENTAL_NVIDIA_CUDA_EXPORT = "1"
$env:SCREENTOOL_NVIDIA_CUDA_EXPORT_SCRIPT = (Resolve-Path $CudaScriptPath).Path
$env:SCREENTOOL_NVIDIA_CUDA_EXPORT_HIGH_PRIORITY = "1"
$env:SCREENTOOL_NVIDIA_CUDA_SAMPLE_GPU = "1"

if ($AllowCudaAudio) {
	$env:SCREENTOOL_NVIDIA_CUDA_ALLOW_AUDIO_EXPORT = "1"
	Remove-Item Env:\SCREENTOOL_NVIDIA_CUDA_FORCE_VIDEO_ONLY -ErrorAction SilentlyContinue
} else {
	Remove-Item Env:\SCREENTOOL_NVIDIA_CUDA_ALLOW_AUDIO_EXPORT -ErrorAction SilentlyContinue
	$env:SCREENTOOL_NVIDIA_CUDA_FORCE_VIDEO_ONLY = "1"
}

if ($NoDiagnostics) {
	Remove-Item Env:\SCREENTOOL_NVIDIA_CUDA_EXPORT_DIAGNOSTICS -ErrorAction SilentlyContinue
} else {
	$env:SCREENTOOL_NVIDIA_CUDA_EXPORT_DIAGNOSTICS = "1"
}

$resolvedAppPath = (Resolve-Path $AppPath).Path
$appDirectory = Split-Path $resolvedAppPath -Parent
if ($AllowCudaAudio) {
	$cudaAudioMode = "inline CUDA audio candidate; app still requires timestamp-aligned CUDA output"
} else {
	$cudaAudioMode = "CUDA video-only, then shared app audio mux"
}

Write-Host "Launching ScreenTool with guarded NVIDIA CUDA/NVENC auto export enabled:"
Write-Host "  App: $resolvedAppPath"
Write-Host "  CUDA wrapper: $env:SCREENTOOL_NVIDIA_CUDA_EXPORT_SCRIPT"
Write-Host "  Force CUDA video-only: $($env:SCREENTOOL_NVIDIA_CUDA_FORCE_VIDEO_ONLY -eq '1')"
Write-Host "  CUDA audio exports: $cudaAudioMode"
Write-Host "  Diagnostics: $($env:SCREENTOOL_NVIDIA_CUDA_EXPORT_DIAGNOSTICS -eq '1')"

Start-Process -FilePath $resolvedAppPath -WorkingDirectory $appDirectory

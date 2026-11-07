$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$apkSrcDir   = $PSScriptRoot
$buildDir    = Join-Path $apkSrcDir "build"
$outApk      = Join-Path $projectRoot "public\narasa-konseling.apk"

# 1. Resolve JDK 17+ & Android SDK Build-Tools 34.0.0
$jdkHome = if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\javac.exe")) {
  $env:JAVA_HOME
} else {
  "$env:USERPROFILE\.local\jdk17"
}

$env:JAVA_HOME = $jdkHome
$env:PATH = "$jdkHome\bin;$env:PATH"

$sdkRoot    = "$env:LOCALAPPDATA\Android\Sdk"
$buildTools = Join-Path $sdkRoot "build-tools\34.0.0"
$androidJar = Join-Path $sdkRoot "platforms\android-34\android.jar"

$aapt2     = Join-Path $buildTools "aapt2.exe"
$d8        = Join-Path $buildTools "d8.bat"
$zipalign  = Join-Path $buildTools "zipalign.exe"
$apksigner = Join-Path $buildTools "apksigner.bat"
$javac     = Join-Path $jdkHome "bin\javac.exe"
$keytool   = Join-Path $jdkHome "bin\keytool.exe"

foreach ($tool in @($aapt2, $d8, $zipalign, $apksigner, $javac, $keytool, $androidJar)) {
  if (!(Test-Path $tool)) {
    throw "Required Android/JDK tool not found: $tool"
  }
}

# 2. Clean & prepare build directories
if (Test-Path $buildDir) {
  Remove-Item -Recurse -Force $buildDir
}
$compiledResDir = Join-Path $buildDir "compiled_res"
$genDir         = Join-Path $buildDir "gen"
$classesDir     = Join-Path $buildDir "classes"
$dexDir         = Join-Path $buildDir "dex"

foreach ($d in @($compiledResDir, $genDir, $classesDir, $dexDir)) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
}

Write-Host "[1/6] Compiling Android resources with aapt2..."
$resZip = Join-Path $compiledResDir "res.zip"
& $aapt2 compile --dir (Join-Path $apkSrcDir "res") -o $resZip
if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed" }

Write-Host "[2/6] Linking AndroidManifest.xml & resources..."
$unalignedApk = Join-Path $buildDir "narasa-unaligned.apk"
& $aapt2 link `
  -I $androidJar `
  --manifest (Join-Path $apkSrcDir "AndroidManifest.xml") `
  --java $genDir `
  --min-sdk-version 24 `
  --target-sdk-version 34 `
  -o $unalignedApk `
  $resZip
if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed" }

Write-Host "[3/6] Compiling Java sources (MainActivity + R.java)..."
$javaFiles = Get-ChildItem -Path (Join-Path $apkSrcDir "src"), $genDir -Recurse -Filter "*.java" | ForEach-Object { $_.FullName }
& $javac -encoding UTF-8 -source 11 -target 11 -classpath $androidJar -d $classesDir $javaFiles
if ($LASTEXITCODE -ne 0) { throw "javac failed" }

Write-Host "[4/6] Converting JVM bytecode to Dalvik DEX (classes.dex)..."
$classFiles = Get-ChildItem -Path $classesDir -Recurse -Filter "*.class" | ForEach-Object { $_.FullName }
& $d8 --lib $androidJar --min-api 24 --release --output $dexDir $classFiles
if ($LASTEXITCODE -ne 0) { throw "d8 failed" }

# Inject classes.dex into unaligned APK archive
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipStream = [System.IO.File]::Open($unalignedApk, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite)
$archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Update)
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
  $archive,
  (Join-Path $dexDir "classes.dex"),
  "classes.dex",
  [System.IO.Compression.CompressionLevel]::Optimal
) | Out-Null
$archive.Dispose()
$zipStream.Dispose()

Write-Host "[5/6] Aligning APK with zipalign (4-byte & page alignment)..."
$alignedApk = Join-Path $buildDir "narasa-aligned.apk"
& $zipalign -p -f 4 $unalignedApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "zipalign failed" }

Write-Host "[6/6] Signing APK (v1 + v2 + v3 schemes) & verifying..."
$keystorePath = Join-Path $apkSrcDir "narasa-release.keystore"
$ksPass       = "narasabk2026"
$keyAlias     = "narasa_key"

if (!(Test-Path $keystorePath)) {
  & $keytool -genkeypair -v `
    -keystore $keystorePath `
    -alias $keyAlias `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storepass $ksPass `
    -keypass $ksPass `
    -dname "CN=NARASA Konseling Mahasiswa, OU=Prodi BKPI dan PIAUD, O=Unit BK Kampus, L=Indonesia, ST=ID, C=ID"
  if ($LASTEXITCODE -ne 0) { throw "keytool failed" }
}

if (Test-Path $outApk) { Remove-Item -Force $outApk }

& $apksigner sign `
  --ks $keystorePath `
  --ks-key-alias $keyAlias `
  --ks-pass "pass:$ksPass" `
  --key-pass "pass:$ksPass" `
  --v1-signing-enabled true `
  --v2-signing-enabled true `
  --v3-signing-enabled true `
  --out $outApk `
  $alignedApk
if ($LASTEXITCODE -ne 0) { throw "apksigner sign failed" }

$idsigFile = "$outApk.idsig"
if (Test-Path $idsigFile) { Remove-Item -Force $idsigFile }

& $apksigner verify --verbose $outApk
if ($LASTEXITCODE -ne 0) { throw "apksigner verify failed" }

& $aapt2 dump badging $outApk | Select-Object -First 12
$apkInfo = Get-Item $outApk
Write-Host "SUCCESS! Signed Android APK generated at: $($apkInfo.FullName) ($([math]::Round($apkInfo.Length / 1KB, 1)) KB)"


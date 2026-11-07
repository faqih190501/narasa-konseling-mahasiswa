$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$apkSrcDir   = $PSScriptRoot
$buildDir    = Join-Path $apkSrcDir "build"
$outApk      = Join-Path $projectRoot "public\narasa-konseling.apk"
$outApkV2    = Join-Path $projectRoot "public\narasa-konseling-v2.apk"

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

$aapt      = Join-Path $buildTools "aapt.exe"
$aapt2     = Join-Path $buildTools "aapt2.exe"
$d8        = Join-Path $buildTools "d8.bat"
$dexdump   = Join-Path $buildTools "dexdump.exe"
$zipalign  = Join-Path $buildTools "zipalign.exe"
$apksigner = Join-Path $buildTools "apksigner.bat"
$javac     = Join-Path $jdkHome "bin\javac.exe"
$jarExe    = Join-Path $jdkHome "bin\jar.exe"
$keytool   = Join-Path $jdkHome "bin\keytool.exe"

foreach ($tool in @($aapt, $aapt2, $d8, $dexdump, $zipalign, $apksigner, $javac, $jarExe, $keytool, $androidJar)) {
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

Write-Host "[1/7] Compiling Android resources with aapt2..."
$resZip = Join-Path $compiledResDir "res.zip"
& $aapt2 compile --dir (Join-Path $apkSrcDir "res") -o $resZip
if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed" }

Write-Host "[2/7] Linking AndroidManifest.xml & resources..."
$unalignedApk = Join-Path $buildDir "narasa-unaligned.apk"
& $aapt2 link `
  -I $androidJar `
  --manifest (Join-Path $apkSrcDir "AndroidManifest.xml") `
  --java $genDir `
  --min-sdk-version 21 `
  --target-sdk-version 34 `
  -o $unalignedApk `
  $resZip
if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed" }

Write-Host "[3/7] Compiling Java sources (MainActivity + R.java)..."
$javaFiles = Get-ChildItem -Path (Join-Path $apkSrcDir "src"), $genDir -Recurse -Filter "*.java" | ForEach-Object { $_.FullName }
& $javac -encoding UTF-8 -source 8 -target 8 -bootclasspath $androidJar -d $classesDir $javaFiles
if ($LASTEXITCODE -ne 0) { throw "javac failed" }

Write-Host "[4/7] Converting JVM bytecode to Dalvik DEX (classes.dex, min-api 21)..."
$classFiles = Get-ChildItem -Path $classesDir -Recurse -Filter "*.class" | ForEach-Object { $_.FullName }
& $d8 --lib $androidJar --min-api 21 --release --output $dexDir $classFiles
if ($LASTEXITCODE -ne 0) { throw "d8 failed" }

Write-Host "[5/7] Packaging classes.dex UNCOMPRESSED (STORED, no data-descriptor) via jar uf0..."
Push-Location $dexDir
try {
  & $jarExe uf0 $unalignedApk "classes.dex"
  if ($LASTEXITCODE -ne 0) { throw "jar uf0 failed" }
} finally {
  Pop-Location
}

Write-Host "[6/7] Aligning APK with zipalign (-p -f 4 for page-aligned DEX & resources.arsc)..."
$alignedApk = Join-Path $buildDir "narasa-aligned.apk"
& $zipalign -p -f 4 $unalignedApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "zipalign failed" }

Write-Host "[7/7] Signing APK (v1 JAR + v2 + v3 APK Signature Schemes) & running ART dexdump check..."
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
if (Test-Path $outApkV2) { Remove-Item -Force $outApkV2 }

& $apksigner sign `
  --ks $keystorePath `
  --ks-key-alias $keyAlias `
  --ks-pass "pass:$ksPass" `
  --key-pass "pass:$ksPass" `
  --min-sdk-version 21 `
  --v1-signing-enabled true `
  --v2-signing-enabled true `
  --v3-signing-enabled true `
  --out $outApk `
  $alignedApk
if ($LASTEXITCODE -ne 0) { throw "apksigner sign failed" }

foreach ($sig in @("$outApk.idsig", "$outApkV2.idsig")) {
  if (Test-Path $sig) { Remove-Item -Force $sig }
}

# Verify alignment, v1+v2+v3 signatures, AND ART dexdump directly on the signed APK!
& $zipalign -c -v 4 $outApk
if ($LASTEXITCODE -ne 0) { throw "zipalign verification failed" }

& $apksigner verify --verbose --min-sdk-version 21 $outApk
if ($LASTEXITCODE -ne 0) { throw "apksigner verify failed" }

$dexCheck = & $dexdump -f (Join-Path $dexDir "classes.dex")
if ($LASTEXITCODE -ne 0) { throw "ART dexdump failed to read classes.dex!" }
$dexCheck | Select-Object -First 20 | ForEach-Object { Write-Host $_ }

Copy-Item -Force $outApk $outApkV2

$apkInfo = Get-Item $outApk
Write-Host "SUCCESS! Verified Android APK ready at $($apkInfo.FullName) & narasa-konseling-v2.apk ($([math]::Round($apkInfo.Length / 1KB, 1)) KB)"

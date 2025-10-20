# App Signing Guide for nowtask

## Overview

Android requires all apps to be digitally signed before installation on devices or publication to Google Play Store. This guide covers generating, managing, and using signing certificates.

## Important: Two Signing Certificates

### 1. **Debug Certificate** (Development)
- **Auto-generated**: Generated automatically on first build
- **Location**: `~/.android/debug.keystore` (Linux/Mac) or `%USERPROFILE%\.android\debug.keystore` (Windows)
- **Expires**: 365 days from generation
- **Uses**: Local development and testing only
- **SHA-1**: Register in Firebase Console for Google Sign-In

### 2. **Release Certificate** (Production)
- **Manual creation**: Must be generated using `keytool`
- **Location**: Safely store outside project (e.g., `~/keys/nowtask-release-key.jks`)
- **Expires**: Typically 25+ years (recommended)
- **Uses**: Google Play Store publication
- **Requirements**: Must match SHA-1 registered in Firebase Console

## Setup Workflow

### Step 1: Generate Release Signing Key

Run this command once to create a release signing key:

```bash
# Windows (PowerShell or CMD)
keytool -genkey -v -keystore C:\Users\<YOUR_USERNAME>\keys\nowtask-release-key.jks ^
  -keyalg RSA -keysize 2048 -validity 10000 -alias nowtask-release-key

# Linux/Mac
keytool -genkey -v -keystore ~/keys/nowtask-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias nowtask-release-key
```

**Parameters:**
- `-keysize 2048` - RSA key size (2048 bit is standard)
- `-validity 10000` - Validity period in days (~27 years)
- `-alias nowtask-release-key` - Friendly name for the key

**You will be prompted for:**
```
Enter keystore password: [CREATE A STRONG PASSWORD]
Re-enter new password: [CONFIRM]
What is your first and last name? [Your Name]
What is the name of your organizational unit? [nowtask]
What is the name of your organization? [nowtask]
What is the name of your City or Locality? [Your City]
What is the name of your State or Province? [Your State]
What is the two-letter country code for this unit? [JP]
Is CN=..., OU=..., O=..., L=..., ST=..., C=... correct? [yes]
```

**Output:**
```
Generating 2,048 bit RSA key pair and self-signed certificate (SHA256withRSA) with a validity of 10,000 days
Certificate fingerprint (SHA-256): ...
Certificate fingerprint (SHA1): [YOUR-SHA1]  ← Save this!
```

### Step 2: Get Certificate SHA-1 Fingerprints

**For Debug Certificate:**
```bash
# Windows
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android

# Linux/Mac
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**For Release Certificate:**
```bash
# Windows
keytool -list -v -keystore C:\Users\<YOUR_USERNAME>\keys\nowtask-release-key.jks -alias nowtask-release-key

# Linux/Mac
keytool -list -v -keystore ~/keys/nowtask-release-key.jks -alias nowtask-release-key
```

Look for the `SHA1:` line - this is your certificate fingerprint.

### Step 3: Register Certificates in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select "nowtask" project
3. Navigate to **Project Settings** → **Your Apps** → Select Android app
4. Under "SHA certificate fingerprints", add:
   - **Debug SHA-1** (from Step 2)
   - **Release SHA-1** (from Step 2)

**Why both?** Google Sign-In verifies the certificate fingerprint matches. Both debug and release builds need to be registered.

## Gradle Configuration for Signing

### Method 1: gradle.properties (Recommended for CI/CD)

Create or edit `android-app/gradle.properties`:

```gradle
# Release Signing Configuration
RELEASE_STORE_FILE=C:\\Users\\<YOUR_USERNAME>\\keys\\nowtask-release-key.jks
RELEASE_STORE_PASSWORD=<YOUR_KEYSTORE_PASSWORD>
RELEASE_KEY_ALIAS=nowtask-release-key
RELEASE_KEY_PASSWORD=<YOUR_KEY_PASSWORD>
```

**Windows paths must use double backslashes (`\\`)**

### Method 2: signing.properties (Git-ignored)

Create `android-app/signing.properties` (add to `.gitignore`):

```gradle
storeFile=C:\\Users\\<YOUR_USERNAME>\\keys\\nowtask-release-key.jks
storePassword=<YOUR_KEYSTORE_PASSWORD>
keyAlias=nowtask-release-key
keyPassword=<YOUR_KEY_PASSWORD>
```

### Method 3: build.gradle.kts Configuration

Edit `android-app/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile = file(System.getenv("RELEASE_STORE_FILE") ?: "")
            storePassword = System.getenv("RELEASE_STORE_PASSWORD")
            keyAlias = System.getenv("RELEASE_KEY_ALIAS")
            keyPassword = System.getenv("RELEASE_KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Building Signed APK/AAB

### Debug APK (Automatic)
```bash
cd android-app
./gradlew assembleDebug
# Output: android-app/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (Manual Signing)
```bash
cd android-app
./gradlew assembleRelease
# Output: android-app/app/build/outputs/apk/release/app-release-unsigned.apk
```

Then sign it:
```bash
# Windows
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 ^
  -keystore C:\Users\<YOUR_USERNAME>\keys\nowtask-release-key.jks ^
  android-app\app\build\outputs\apk\release\app-release-unsigned.apk ^
  nowtask-release-key

# Linux/Mac
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ~/keys/nowtask-release-key.jks \
  android-app/app/build/outputs/apk/release/app-release-unsigned.apk \
  nowtask-release-key

# Then align the APK
zipalign -v 4 \
  android-app/app/build/outputs/apk/release/app-release-unsigned.apk \
  android-app/app/build/outputs/apk/release/app-release.apk
```

### Release AAB (Recommended for Play Store)
```bash
cd android-app
./gradlew bundleRelease
# Output: android-app/app/build/outputs/bundle/release/app-release.aab
```

## Google Play Store Release

1. **Build release AAB**:
   ```bash
   ./gradlew bundleRelease
   ```

2. **Go to [Google Play Console](https://play.google.com/console)**

3. **Select your app → "Release" → "Production"**

4. **Upload app-release.aab** (Android App Bundle)

5. **Review signing certificate details** (automatically detected by Play Console)

**Critical:** The SHA-1 in Play Console must match your release certificate.

## Troubleshooting

### Issue: "Signature does not match"
```
error: ERROR: signing (new signature does not match the original signature)
```
**Solution:** Ensure you're using the same certificate. If using a new certificate, update SHA-1 in Firebase Console and Google Play Console.

### Issue: "Certificate not yet valid"
```
error: java.lang.RuntimeException: Keystore was tampered with
```
**Solution:** Check certificate generation date and expiration with:
```bash
keytool -list -v -keystore <YOUR_KEYSTORE_FILE>
```

### Issue: "Google Sign-In fails after release build"
**Solution:** You registered only the debug certificate SHA-1 in Firebase. Add the release SHA-1:
1. Get release certificate SHA-1 (Step 2 above)
2. Add to Firebase Console
3. Wait 15 minutes for propagation
4. Rebuild and test

### Issue: "Wrong keystore password"
**Solution:** Double-check the password. You can't recover it. If lost, generate a new certificate and update SHA-1 everywhere.

## Security Best Practices

✅ **DO:**
- Store release keystore file outside the project directory
- Use strong passwords (20+ characters with symbols)
- Use version control for code only, NOT keystore files
- Rotate certificates every 2-3 years
- Keep separate keystore for development and production
- Use `.gitignore` to prevent accidental commits:
  ```
  # .gitignore
  *.jks
  *.keystore
  signing.properties
  local.properties
  ```

❌ **DON'T:**
- Commit `.jks` files to Git
- Share certificate passwords
- Use debug certificate for Play Store
- Reuse passwords across projects
- Store keystore in version control

## Certificate Expiration Management

### Check Expiration
```bash
keytool -list -v -keystore ~/keys/nowtask-release-key.jks
# Look for: "Valid from: ... until: ..."
```

### Plan Renewal
- Set calendar reminder 3 months before expiration
- Create new certificate with same alias
- Update Firebase Console SHA-1
- Update Google Play Console SHA-1
- Rebuild and test before expiration

## CI/CD Integration (GitHub Actions, etc.)

Store secrets in CI/CD environment:

```yaml
# Example: GitHub Actions secrets
RELEASE_STORE_FILE: (base64-encoded .jks file)
RELEASE_STORE_PASSWORD: (your password)
RELEASE_KEY_ALIAS: nowtask-release-key
RELEASE_KEY_PASSWORD: (your key password)
```

Decode in CI/CD:
```bash
echo $RELEASE_STORE_FILE | base64 -d > nowtask-release-key.jks
```

## Related Documentation

- [Android Signing Documentation](https://developer.android.com/studio/publish/app-signing)
- [Google Play Security and Publishing](https://developer.android.com/google-play/console/about/security)
- [Firebase Console SHA-1 Setup](https://developers.google.com/android/guides/google-play-services/setup)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-20 | Initial app signing guide |

## Contacts & Support

- Firebase Console: https://console.firebase.google.com
- Google Play Console: https://play.google.com/console
- Android Documentation: https://developer.android.com/studio/publish
